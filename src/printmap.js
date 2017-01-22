"use strict";

const trackUtils = require('./trackutils.js');
const paperformat = require('./paperformat.js');
const jspdf = require('jspdf');
const mapboxgl = require('mapbox-gl');
mapboxgl.accessToken = require('./mapboxtoken.js');

function toPixels(length) {
  'use strict';
  // 96 dpi / 25.4mm/in = dots per mm
  return (96 / 25.4 ) * length + 'px';
}

function initContainer(width, height) {
  // Create map container
  var hidden = document.createElement('div');
  hidden.className = 'hidden-map';
  document.body.appendChild(hidden);
  var container = document.createElement('div');
  container.style.width = toPixels(width);
  container.style.height = toPixels(height);
  hidden.appendChild(container);

  return container;
}

function resizeContainer(container, width, height) {
  container.style.width = toPixels(width);
  container.style.height = toPixels(height);
}

function initMap(container, zoom, center, style) {
  // Init render map
  return new mapboxgl.Map({
    container: container,
    zoom: zoom,
    center: center,
    style: style,
    interactive: false,
    attributionControl: false
  });
}


var printmap = {};

printmap.generatePDF = function(style, scale, format, track) {
  var dpi = 300;

  // Calculate pixel ratio
  var actualPixelRatio = window.devicePixelRatio;
  Object.defineProperty(window, 'devicePixelRatio', {
    get: function() {
      return dpi / 96;
    }
  });

  // Init div container
  var [width, height] = paperformat.dimensions(format);
  var container = initContainer(width, height);

  // Create map images
  asyncRenderFeatures(
    track.cutouts.features,
    function(feature, report) {
      console.log("Map loading started");
      // Resize container div
      let orientation = 'p';
      if (feature.properties.width > feature.properties.height) {
        resizeContainer(container, height, width);
        orientation = 'l';
      } else {
        resizeContainer(container, width, height);
      }
       
      // Calc center and bounds of feature
      let center = [0.5 * (feature.bbox[0] + feature.bbox[2]),
        0.5 * (feature.bbox[1] + feature.bbox[3])];
      let bbounds = new mapboxgl.LngLatBounds([feature.bbox[0], feature.bbox[1]], 
        [feature.bbox[2], feature.bbox[3]]);

      // Init map
      let map = initMap(container, 1, center, style);
      map.resize();
      map.fitBounds(bbounds);

      map.once('load', function() {
        console.log("Map loaded");
        let mapImage = map.getCanvas().toDataURL('image/png');
        map.remove();

        // Report result back
        report({data: mapImage, orientation: orientation, width: width,
          height: height, format: format});
      });
    }, 
    function() {}
  );
}

function asyncRenderFeatures(features, iterator, callback) {
  var nextItemIndex = 0;
  var pdf = new jspdf({compress: true});
  pdf.deletePage(1);

  function report(img) {
    pdf.addPage(img.format, img.orientation);

    if (img.orientation === 'l') {
      [img.height, img.width] = [img.width, img.height];
    }

    pdf.addImage(img.data, 'png', 0, 0, img.width, img.height, null, 'FAST');

    // are we done?
    nextItemIndex++;
    if (nextItemIndex === features.length) {
      pdf.save("map.pdf");
      // callback(result);
      return;
    } else {
      // otherwise, call the iterator on the next item
      iterator(features[nextItemIndex], report);
    }
  }

  // jump start first iteration
  iterator(features[0], report);
}

module.exports = printmap;

