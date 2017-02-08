import jspdf from 'jspdf';
import mapboxgl from 'mapbox-gl';

import Map from './map.js';
import layers from './layers.js';
import paperformat from './paperformat.js';
import token from './mapboxtoken.js';

mapboxgl.accessToken = token;

function timer(name) {
  const start = performance.now();
  return {
    stop() {
      const end  = performance.now();
      console.log(
        (name + " ".repeat(15)).slice(0, 15),
        (" ".repeat(6) + Math.trunc(end - start)).slice(-6), 'ms');
    }
  };
}

function toPixels(length) {
  // 96 dpi / 25.4mm/in = dots per mm
  return (96 / 25.4 ) * length + 'px';
}

function initContainer(width, height) {
  // Create map container
  const container = document.createElement('div');
  container.style.width = toPixels(width);
  container.style.height = toPixels(height);
  document.querySelector('#hidden-map').appendChild(container);
  return container;
}

function resizeContainer(container, width, height) {
  container.style.width = toPixels(width);
  container.style.height = toPixels(height);
}

function bboxCenter(bbox) {
  return [0.5 * (bbox[0] + bbox[2]), 0.5 * (bbox[1] + bbox[3])];
}

function bboxBounds(bbox) {
  return new mapboxgl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
}

function loadMap(map, format, margin) {
  return function(feature) {
    return new Promise(function(resolve, reject) {

      var t = timer("#loadMap");

      const orientation = (feature.properties.width > feature.properties.height) ? "l" : "p";
      let [width, height] = paperformat.dimensions(format);
      width -= 2 * margin;
      height -= 2 * margin;
      if (orientation === "l") {
        [width, height] = [height, width];
      }

      resizeContainer(map.getContainer(), width, height);
      map.resize();
      map.setCenter(bboxCenter(feature.bbox));
      map.fitBounds(bboxBounds(feature.bbox), {duration: 0});

      map.on('render', function listener() {
        if (map.loaded()) {
          let tt = timer("#getCanvas");
          const data = map.getCanvas().toDataURL('image/jpeg', 1.0);
          resolve({format, orientation, data, margin, width, height});
          tt.stop();
          t.stop();
          map.off('render', listener);
        }
      });

      map.on('error', function(e) {
        container.parentNode.removeChild(container);
        reject(Error(e.message));
      });

    });
  };
}

function addMap(pdf) {
  var count = 0;
  return (img) => {
    pdf.addPage(img.format, img.orientation);
    pdf.addImage({
      imageData: img.data,
      x: img.margin,
      y: img.margin,
      w: img.width,
      h: img.height,
      compression: 'FAST',
      alias: "map" + count++  // setting alias improves speed ~2x
    });
  };
}

const printmap = {

  setPixelRatio(dpi) {
    this.actualPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => dpi / 96
    });
  },

  resetPixelRatio() {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => this.actualPixelRatio
    });
  },

  generatePDF(track, options, progressfn) {
    // Calculate pixel ratio
    this.setPixelRatio(options.dpi);

    var t = timer("PDF generation");

    // initialise pdf. delete first page to simplify addImage-loop
    const pdf = new jspdf({compress: true});
    pdf.deletePage(1);

    // initialise container div and map. both will be reused for every map cutout
    const container = initContainer(0, 0);
    const map =  new mapboxgl.Map({
      container: container,
      center: [0,0],
      style: options.style,
      interactive: false,
      attributionControl: false,
      renderWorldCopies: false
    });

    // add route
    map.once('styledata', function() {
      layers.addTrack(map);
      map.getSource("track").setData(track.data);
      layers.addCutouts(map);
      map.getSource("cutouts").setData(track.cutouts);
      layers.addMilemarkers(map);
      map.getSource("milemarkers").setData(track.milemarkers);
    });

    // generate functions
    // TODO: find better name loadMapImage and addMapImage
    const loadMapImage = loadMap(map, options.format, options.margin);
    const addMapImage = addMap(pdf);

    let count = 0;
    const totalMaps = track.cutouts.features.length;
    progressfn(count, totalMaps);

    track.cutouts.features.reduce(
      (sequence, feature) => {
        return sequence.then(() => loadMapImage(feature))
          .then((image) => {
          let t = timer("#addMapImage");
          addMapImage(image);
          t.stop();
          progressfn(count++, totalMaps);
        });
      }, Promise.resolve())
      .then(() => {
        pdf.save();
        progressfn(totalMaps, totalMaps);
        map.remove();
        t.stop();
        this.resetPixelRatio();
      });
  }
};

export default printmap;

