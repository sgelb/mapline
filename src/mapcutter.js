"use strict";
const cheapRuler = require("cheap-ruler");

var paperformats = {
  "a3": [ 297, 420 ],
  "a4": [ 210, 297 ],
  "a5": [ 148, 210 ],
  "a6": [ 104, 148 ],
  "letter": [ 210, 279 ],
  "legal": [ 216, 356 ]
};


function Bbox(lat) {
  if (lat === undefined) {
    throw new Error("Missing argument");
  }

  if (!(this instanceof Bbox)) {
    return new Bbox(lat);
  }

  this.ruler = cheapRuler(lat, "meters");

  // new bbox [w, s, e, n]
  this.bbox = [ Infinity, Infinity, -Infinity, -Infinity ];
}

// extent bbox to include coordinate
Bbox.prototype.include = function(ll) {
  this.bbox[0] = Math.min(this.bbox[0], ll[0]);
  this.bbox[1] = Math.min(this.bbox[1], ll[1]);
  this.bbox[2] = Math.max(this.bbox[2], ll[0]);
  this.bbox[3] = Math.max(this.bbox[3], ll[1]);
};

// return if bbox width and height are larger than arguments
Bbox.prototype.largerThan = function(maxWidth, maxHeight) {
  // distance between nw and ne corner of bbox
  var width = this.ruler.distance([ this.bbox[0], this.bbox[3] ], [
    this.bbox[2],
    this.bbox[3]
  ]);
  // distance between nw and sw corner of bbox
  var height = this.ruler.distance([ this.bbox[0], this.bbox[3] ], [
    this.bbox[0],
    this.bbox[1]
  ]);

  return width > maxWidth || height > maxHeight;
};

// resize bbox to width and height
Bbox.prototype.resize = function(width, height) {
  var wDiff = 0.5 * (width - this.ruler.distance(
    [ this.bbox[0], this.bbox[3] ], 
    [ this.bbox[2], this.bbox[3] ]));
  var hDiff = 0.5 * (height - this.ruler.distance(
    [ this.bbox[0], this.bbox[3] ], 
    [ this.bbox[0], this.bbox[1] ]));

  this.bbox[0] = this.ruler.destination([this.bbox[0], this.bbox[3]], wDiff, 270)[0];
  this.bbox[1] = this.ruler.destination([this.bbox[0], this.bbox[1]], hDiff, 180)[1];
  this.bbox[2] = this.ruler.destination([this.bbox[2], this.bbox[3]], wDiff, 90)[0];
  this.bbox[3] = this.ruler.destination([this.bbox[0], this.bbox[3]], hDiff, 0)[1];
};

// revert to bbox
Bbox.prototype.revertTo = function(bbox) {
  this.bbox = bbox;
}

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

var mapcutter = {};

mapcutter.bbox = Bbox;

// return array of sheet bboxes in specified scale and format along track
mapcutter.bboxes = function(track, scale, format, fn) {
  var format = paperformats[format];

  // real world width and height of map sheet in meter
  var rw = format[0] / 1000 * scale;
  var rh = format[1] / 1000 * scale;

  // padding around track in mm
  let padding = 10;
  var rwp = (format[0] - padding) / 1000 * scale;
  var rhp = (format[1] - padding) / 1000 * scale;

  var bboxes = [];

  // calculate real world width and height of map sheet
  for (let feature of track.features) {
    let bbox = Bbox(feature.geometry.coordinates[0][1]);
    for (let coord of feature.geometry.coordinates) {
      let oldBbox = bbox.bbox;
      bbox.include(coord);
      if (bbox.largerThan(rwp, rhp)) {
        // FIXME: look if distance between coords > rwp||rhp?
        bbox.revertTo(oldBbox);
        bbox.resize(rw, rh);

        fn(Math.random().toString(36).substring(2, 5), bbox.linestring());
        bboxes.push(bbox.bbox);

        bbox = Bbox(coord[1]);
        bbox.include(coord);
      }
    }
    
    bbox.resize(rw, rh);
    fn(Math.random().toString(36).substring(2, 5), bbox.linestring());
    bboxes.push(bbox.bbox);
  }

  return bboxes;
};

module.exports = mapcutter;
