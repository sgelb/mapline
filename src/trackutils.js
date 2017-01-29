"use strict";
import cheapruler from 'cheap-ruler';
import extent from '@mapbox/extent';
import toGeoJSON from '@mapbox/togeojson';
import {DOMParser} from 'xmldom';

var trackutils = {};

// return bounds of track
trackutils.bounds = function(track) {
  var bounds = extent();
  track.features.forEach(function(feature) {
    bounds.union(feature.bbox);
  });
  return bounds.bbox();
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


// copied from https://github.com/mapbox/cheap-ruler
function interpolate(a, b, t) {
  var dx = b[0] - a[0];
  var dy = b[1] - a[1];
  return [a[0] + dx * t, a[1] + dy * t];
}

function createPoint(coords, title) {
  return { "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": coords,
    },
    "properties": {"title": title}
  }
}

// return geojson with points in given interval along given line
trackutils.milemarkers = function(track, interval) {

  var line = track.features[0].geometry.coordinates;
  var ruler = cheapruler(line[Math.trunc(line.length/2)][1]);

  var points = [];
  var count = 1;
  var sum = 0;
  for (let i = 0; i < line.length - 1; i++) {
    let p0 = line[i];
    let p1 = line[i + 1];
    let d = ruler.distance(p0, p1);
    sum += d;
    if (sum > interval) {
      let tp = interpolate(p0, p1, (interval - (sum - d)) / d);
      points.push(createPoint(tp, interval * count++));
      sum -= interval - ruler.distance(tp, p1);
    }
  }

  return {"type": "FeatureCollection", "features": points};
}

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
