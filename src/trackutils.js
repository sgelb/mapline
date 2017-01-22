"use strict";
const bbox = require("@turf/bbox");
const lineDistance = require("@turf/line-distance");
const tj = require("@mapbox/togeojson");
const DOMParser = require("xmldom").DOMParser;

var trackUtils = {};

// return bounds of track
trackUtils.bounds = function(track) {
  // TODO: replace with s.th smaller: own implementation or @mapbox/extent
  // http://geojson.org/geojson-spec.html#bounding-boxes
  return bbox(track);
};

// return track reduced to LineString and and MultiLineString
trackUtils.reduce = function(track) {
  var reducedFeatures = track.features.filter(function(feature) {
    var type = feature.geometry.type;
    return type.endsWith("LineString");
  });

  return { "type": "FeatureCollection", "features": reducedFeatures };
};

// return total distance of track
trackUtils.totalDistance = function(track) {
  // TODO: replace with cheap-ruler or own code, see
  // https://github.com/mapbox/cheap-ruler/blob/master/index.js#L138
  return lineDistance(track).toFixed(2);
};

// convert data to geojson
trackUtils.togeojson = function(format, data) {
  if (format === "geojson") {
    return JSON.parse(data);
  }

  if (format === "gpx") {
    data = new DOMParser().parseFromString(data, "text/xml");
    return tj[format](data);
  }

  throw "Unknown file format: " + format;
};

module.exports = trackUtils;
