"use strict";
import bbox from '@turf/bbox';
import cheapruler from 'cheap-ruler';

import toGeoJSON from '@mapbox/togeojson';
import {DOMParser} from 'xmldom';

var trackutils = {};

// return bounds of track
trackutils.bounds = function(track) {
  // TODO: replace with s.th smaller: own implementation or @mapbox/extent
  // http://geojson.org/geojson-spec.html#bounding-boxes
  return bbox(track);
};

// return track reduced to LineString and and MultiLineString
trackutils.reduce = function(track) {
  var reducedFeatures = track.features.filter(function(feature) {
    var type = feature.geometry.type;
    return type.endsWith("LineString");
  });

  return { "type": "FeatureCollection", "features": reducedFeatures };
};

// return total distance of track
trackutils.totalDistance = function(track) {
  var line = track.features[0].geometry.coordinates;
  var ruler = cheapruler(line[Math.trunc(line.length/2)][1]);
  // console.log(lineDistance(track).toFixed(3));
  return ruler.lineDistance(line).toFixed(3);
};

// convert data to geojson
trackutils.togeojson = function(format, data) {
  if (format === "geojson") {
    return JSON.parse(data);
  }

  if (format === "gpx") {
    data = new DOMParser().parseFromString(data, "text/xml");
    return toGeoJSON[format](data);
  }

  throw "Unknown file format: " + format;
};

export default trackutils;
