"use strict";

const trackUtils = require('./trackutils.js');
const paperformat = require('./paperformat.js');
const jspdf = require('jspdf');
const mapboxgl = require('mapbox-gl');

mapboxgl.accessToken = require('./mapboxtoken.js');

function timer(name) {
  var start = performance.now();
  return {
    stop: function() {
      var end  = performance.now()
      console.log(
        (name + " ".repeat(15)).slice(0, 15),
        (" ".repeat(6) + Math.trunc(end - start)).slice(-6),
        'ms');
    }
  }
};

function toPixels(length) {
  'use strict';
  // 96 dpi / 25.4mm/in = dots per mm
  return (96 / 25.4 ) * length + 'px';
}

function initContainer(width, height) {
  // Create map container
  var container = document.createElement('div');
  container.style.width = toPixels(width);
  container.style.height = toPixels(height);
  document.querySelector('#hidden-map').appendChild(container);
  return container;
}

function resizeContainer(container, width, height) {
  container.style.width = toPixels(width);
  container.style.height = toPixels(height);
}

function initMap(container, center, style) {
  // Init render map
  return new mapboxgl.Map({
    container: container,
    center: center,
    style: style,
    interactive: false,
    attributionControl: false
  });
}

function bboxCenter(bbox) {
  return [0.5 * (bbox[0] + bbox[2]), 0.5 * (bbox[1] + bbox[3])];
}

function bboxBounds(bbox) {
  return new mapboxgl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
}

var printmap = {};

printmap.generatePDF = function(style, scale, format, track, progressfn) {
  var dpi = 300;

  // Calculate pixel ratio
  var actualPixelRatio = window.devicePixelRatio;
  Object.defineProperty(window, 'devicePixelRatio', {
    get: function() {
      return dpi / 96;
    }
  });

  var t = timer("PDF generation");

  var totalMaps = track.cutouts.features.length;
  var count = 1;
  progressfn(count, totalMaps);

  var pdf = new jspdf({compress: true});
  pdf.deletePage(1);

  var loadMapImage = loadMap(format, style);
  var addMapImage = addMap(pdf);

  track.cutouts.features.reduce(
    function(sequence, feature) {
      return sequence.then(function() {
        return loadMapImage(feature);
      }).then(function(image) {
        let t = timer("#addMapImage");
        addMapImage(image);
        t.stop();
        progressfn(count++, totalMaps);
        console.log("--------------");
      });
    }, Promise.resolve()
  ).then(function() {
    pdf.save()
    progressfn(totalMaps, totalMaps);
    t.stop();
    Object.defineProperty(window, 'devicePixelRatio', {
      get: function() {return actualPixelRatio}
    });
  });
}

function loadMap(format, style) {
  return function(feature) {
    return new Promise(function(resolve, reject) {

      var t = timer("#loadMap");
      var orientation = (feature.properties.width > feature.properties.height) ? "l" : "p";
      var [width, height] = paperformat.dimensions(format);
      if (orientation === "l") {
        [width, height] = [height, width];
      }

      // Initialize container div
      var container = initContainer(width, height);

      // Prepare map
      var map =  new mapboxgl.Map({
        container: container,
        center: bboxCenter(feature.bbox),
        style: style,
        interactive: false,
        attributionControl: false,
        renderWorldCopies: false
      });
      map.fitBounds(bboxBounds(feature.bbox));





      map.once('load', function() {
        let tt = timer("#getCanvas")
        var mapImage = map.getCanvas().toDataURL('image/jpeg', 1.0);
        container.parentNode.removeChild(container);
        resolve({data: mapImage, orientation: orientation, width: width,
          height: height, format: format});
        tt.stop()
        t.stop();
        map.remove()  // XXX: does this even work?
      });

      map.on('error', function(e) {
        map.remove()
        container.parentNode.removeChild(container);
        reject(Error(e.message));
      });

    });
  }
}

function addMap(pdf) {
  var count = 0;
  return function(img) {
    pdf.addPage(img.format, img.orientation);
    pdf.addImage({
      imageData: img.data,
      w: img.width,
      h: img.height,
      compression: 'FAST',
      alias: "map" + count++  // setting alias improves speed ~2x
    });
  }
}

module.exports = printmap;

