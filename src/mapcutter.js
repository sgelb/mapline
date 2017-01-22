"use strict";

const cheapRuler = require("cheap-ruler");
const paperformat = require("./paperformat.js");

function Bbox(lat) {

  if (lat === undefined) {
    throw new Error("Missing argument");
  }

  this.lat = lat;
  this.ruler = cheapRuler(lat, "meters");

  // new bbox [w, s, e, n]
  this.bbox = [ Infinity, Infinity, -Infinity, -Infinity ];
};

// extent bbox to include coordinate
Bbox.prototype.include = function(ll) {
  this.bbox[0] = Math.min(this.bbox[0], ll[0]);
  this.bbox[1] = Math.min(this.bbox[1], ll[1]);
  this.bbox[2] = Math.max(this.bbox[2], ll[0]);
  this.bbox[3] = Math.max(this.bbox[3], ll[1]);
};

// return dimensions of bbox in meters
Bbox.prototype.dimensions = function() {
  // distance between nw and ne corner of bbox
  // TODO: replace distance() with own squaredDistance() and benchmark
  var w = this.ruler.distance(
    [ this.bbox[0], this.bbox[3] ],
    [ this.bbox[2], this.bbox[3] ]);
  // distance between nw and sw corner of bbox
  var h = this.ruler.distance(
    [ this.bbox[0], this.bbox[3] ],
    [ this.bbox[0], this.bbox[1] ]);
  return [w, h];
};

// return if bbox width and height are larger than arguments
Bbox.prototype.largerThan = function(maxWidth, maxHeight) {
  let [w, h] = this.dimensions();
  return (w > maxWidth || h > maxHeight) && (h > maxWidth || w > maxHeight);
};

// resize bbox to width and height
Bbox.prototype.resize = function (width, height) {
  var [w, h] = this.dimensions();
  var wDiff = 0.5 * (width - w);
  var hDiff = 0.5 * (height - h);

  if (h <= width && w <= height) {
    wDiff = 0.5 * (height - w);
    hDiff = 0.5 * (width- h);
  }

  this.bbox[0] = this.ruler.destination(
    [this.bbox[0], this.bbox[3]], wDiff, 270)[0];
  this.bbox[1] = this.ruler.destination(
    [this.bbox[0], this.bbox[1]], hDiff, 180)[1];
  this.bbox[2] = this.ruler.destination(
    [this.bbox[2], this.bbox[3]], wDiff, 90)[0];
  this.bbox[3] = this.ruler.destination(
    [this.bbox[0], this.bbox[3]], hDiff, 0)[1];
};

// revert to bbox
Bbox.prototype.revertTo = function(bbox) {
  this.bbox = bbox;
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

// return bbox as Feature of type LineString
Bbox.prototype.feature = function() {
  var [width, height] = this.dimensions();
  return {"type": "Feature",
    // new bbox [w, s, e, n]
    "bbox": this.bbox,
    "geometry": {
      "type": "LineString",
      "coordinates": this.linestring()
    },
    "properties": {
      "name": "cutout",
      "width": width,
      "height": height
    }
  };
};


function featurecollection(features) {
  return {
    "type": "FeatureCollection",
    "features": features
  };
}

var mapcutter = {};

// return array of sheet bboxes in specified scale and format along track
mapcutter.featurecollection = function(track, scale, format) {
  var format = paperformat.dimensions(format);

  // real world width and height of map sheet in meter
  var rw = format[0] / 1000 * scale;
  var rh = format[1] / 1000 * scale;

  // padding around track in mm
  var padding = 10;
  var rwp = (format[0] - padding) / 1000 * scale;
  var rhp = (format[1] - padding) / 1000 * scale;

  var bboxes = [];

  // calculate real world width and height of map sheet
  for (let feature of track.features) {
    let bbox = new Bbox(feature.geometry.coordinates[0][1]);
    for (let coord of feature.geometry.coordinates) {
      let oldBbox = bbox.bbox;
      bbox.include(coord);
      if (bbox.largerThan(rwp, rhp)) {
        // FIXME: edge case of distance between coords > max(rwp, rhp)?
        bbox.revertTo(oldBbox);
        bbox.resize(rw, rh);

        bboxes.push(bbox.feature());

        bbox = new Bbox(coord[1]);
        bbox.include(coord);
      }
    }

    bbox.resize(rw, rh);
    bboxes.push(bbox.feature());
  }

  return featurecollection(bboxes);
};

module.exports = mapcutter;
