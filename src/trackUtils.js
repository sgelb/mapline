'use strict';

const geojsonExtent = require('geojson-extent');
const lineDistance = require('@turf/line-distance');
const tj = require('@mapbox/togeojson');
const DOMParser = require('xmldom').DOMParser;
var paperformats = {
  "a3": [ 297, 420 ],
  "a4": [ 210, 297 ],
  "a5": [ 148, 210 ],
  "a6": [ 104, 148 ],
  "letter": [ 210, 279 ],
  "legal": [ 216, 356 ]
};

var trackUtils = {};

// return bounds of track
trackUtils.bounds = function(track) {
  return geojsonExtent(track);
};

// return track reduced to LineString and and MultiLineString
trackUtils.reduce = function(track) {
  var reducedFeatures = track.features.filter(function(feature) {
    var type = feature.geometry.type;
    return (type === 'LineString' || type === 'MultiLineString');
  });

  return { "type": "FeatureCollection", "features": reducedFeatures };
};

// return total distance of track
trackUtils.totalDistance = function(track) {
  return lineDistance(track).toFixed(2);
};

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
};

function Bbox(lat) {
  if (!(this instanceof Bbox)) {
    return new Bbox(lat);
  }
  this.ruler = cheapRuler(lat, "meters");

  // new bbox [w, s, e, n]
  this.bbox = [ Infinity, Infinity, -Infinity, -Infinity ];
}

Bbox.prototype.include = function(ll) {
  this.bbox[0] = Math.min(this.bbox[0], ll[0]);
  this.bbox[1] = Math.min(this.bbox[1], ll[1]);
  this.bbox[2] = Math.max(this.bbox[2], ll[0]);
  this.bbox[3] = Math.max(this.bbox[3], ll[1]);
};

Bbox.prototype.largerThan = function(maxWidth, maxHeight) {
  var width = this.ruler.distance([ this.bbox[0], this.bbox[3] ], [
    this.bbox[2],
    this.bbox[3]
  ]);
  var height = this.ruler.distance([ this.bbox[0], this.bbox[3] ], [
    this.bbox[0],
    this.bbox[1]
  ]);

  return width > maxWidth || height > maxHeight;
};

// return bbox as LineString array
Bbox.prototype.linestring = function() {
  return [
    [ this.bbox[0], this.bbox[3] ],
    [ this.bbox[2], this.bbox[3] ],
    [ this.bbox[2], this.bbox[1] ],
    [ this.bbox[0], this.bbox[1] ],
    [ this.bbox[0], this.bbox[3] ]
  ];
};

// return array of sheet bboxes in specified scale and format along track
trackUtils.sheets = function(track, scale, format, fn) {
  var format = paperformats[format];
  var rw = format[0] / 1000 * scale;
  var rh = format[1] / 1000 * scale;

  var bboxes = [];
  var bbox;

  // calculate real world width and height of map sheet
  for (let feature of track.features) {
    bbox = Bbox(feature.geometry.coordinates[0][1]);
    for (let coord of feature.geometry.coordinates) {
      bbox.include(coord);
      if (bbox.largerThan(rw, rh)) {
        bbox.resize(rw, rh);
        fn(Math.random().toString(36).substring(2, 5), bbox.linestring());
        bboxes.push(bbox.bbox);
        bbox = Bbox(coord[1]);
      }
    }
    fn(Math.random().toString(36).substring(2, 5), bbox.linestring());
    bboxes.push(bbox.bbox);
  }

  return bboxes;
};

module.exports = trackUtils;

