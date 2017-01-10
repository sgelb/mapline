'use strict';

const tj = require('@mapbox/togeojson');
const DOMParser = require('xmldom').DOMParser;

var trackTools = {};

// convert data to geojson
trackTools.togeojson = function(format, data) {
  if (format === 'geojson') {
    return JSON.parse(data);
  }

  if (format === 'gpx') {
    data = (new DOMParser()).parseFromString(data, 'text/xml');
    return tj[format](data);
  }

  throw "Unknown file format: " + format;
}


module.exports = trackTools
