import cheapruler from 'cheap-ruler';
import extent from '@mapbox/extent';
import toGeoJSON from '@mapbox/togeojson';
import {DOMParser} from 'xmldom';


// copied from https://github.com/mapbox/cheap-ruler
function interpolate(a, b, t) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return [a[0] + dx * t, a[1] + dy * t];
}

function createPoint(coords, title) {
  return {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": coords,
    },
    "properties": {"title": title}
  };
}

const trackutils = {

  // return bounds of track
  bounds(track) {
    const bounds = extent();
    track.features.forEach(function(feature) {
      bounds.union(feature.bbox);
    });
    return bounds.bbox();
  },

  // return track reduced to collection of (Multi)LineString features
  reduce(track) {
    const reducedFeatures = track.features.filter(function(feature) {
      return feature.geometry.type.endsWith("LineString");
    });
    return { "type": "FeatureCollection", "features": reducedFeatures };
  },

  // return total distance of track
  totalDistance(track) {
    const line = track.features[0].geometry.coordinates;
    const ruler = cheapruler(line[Math.trunc(line.length/2)][1]);
    return ruler.lineDistance(line).toFixed(3);
  },

  // return FeatureCollection with Points in given interval along given line
  milemarkers(track, interval) {
    if (interval <= 0) {
      return {"type": "FeatureCollection", "features": []};
    }

    const line = track.features[0].geometry.coordinates;
    const ruler = cheapruler(line[Math.trunc(line.length/2)][1]);
    const points = [];
    let count = 1;
    let totalDistance = 0;

    for (let i = 0; i < line.length - 1; i++) {
      let currentPoint = line[i];
      let nextPoint = line[i + 1];
      let distance = ruler.distance(currentPoint, nextPoint);
      totalDistance += distance;

      if (totalDistance > interval) {
        let intermediatePoint = interpolate(
          currentPoint,
          nextPoint,
          (interval - totalDistance + distance) / distance
        );
        points.push(createPoint(intermediatePoint, interval * count++));
        totalDistance -= interval - ruler.distance(intermediatePoint, nextPoint);
      }
    }

    return {"type": "FeatureCollection", "features": points};
  },

  // convert data to geojson
  togeojson(format, data) {
    if (format === "geojson") {
      return JSON.parse(data);
    }

    if (format === "gpx") {
      data = (new DOMParser()).parseFromString(data, "text/xml");
      return toGeoJSON[format](data);
    }

    throw "Unknown file format: " + format;
  }
};

export default trackutils;
