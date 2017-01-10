'use strict';

const geojsonExtent = require('geojson-extent');
const lineDistance = require('@turf/line-distance');
const tj = require('@mapbox/togeojson');
const DOMParser = require('xmldom').DOMParser;

var trackUtils = {};

// return bounds of track
trackUtils.bounds = function(track) {
  return geojsonExtent(track);
}

// return track reduced to LineString and and MultiLineString
trackUtils.reduce = function(track) {
  var reducedFeatures = track.features.filter(function(feature) {
    var type = feature.geometry.type;
    return (type === 'LineString' || type === 'MultiLineString');
  });

  return {
    "type": "FeatureCollection",
    "features": reducedFeatures
  };
}

// return total distance of track
trackUtils.totalDistance = function(track) {
  return lineDistance(track).toFixed(2);
}

// convert data to geojson
trackUtils.togeojson = function(format, data) {
  if (format === 'geojson') {
    return JSON.parse(data);
  }

  if (format === 'gpx') {
    data = (new DOMParser()).parseFromString(data, 'text/xml');
    return tj[format](data);
  }

  throw "Unknown file format: " + format;
}

// return array of sheet bounds in specified scale and format along track
trackUtils.sheets = function(track, scale, format) {
  var sheets = [];
  console.log(scale + ", " + format);

  return sheets;
}

module.exports = trackUtils
