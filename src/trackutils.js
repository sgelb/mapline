import cheapruler from 'cheap-ruler';
import mapboxgl from 'mapbox-gl';
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
    const bounds = new mapboxgl.LngLatBounds();
    track.features.forEach(feature => bounds.extend(feature.bbox));
    return bounds;
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
    return ruler.lineDistance(line).toFixed(2);
  },

  elevation(track) {
    const line = track.features[0].geometry.coordinates;
    if (line[0].length < 3) {
      return;
    }

    let climb = 0;
    let descent = 0;
    let last = line[0][2];
    line.forEach(coord => {
      let diff = coord[2] - last;
      if (diff > 0) {
        climb += diff;
      } else {
        descent -= diff;
      }
      last = coord[2];
    });

    return [Math.trunc(climb), Math.trunc(descent)];
  },

  // return FeatureCollection with Points in given interval along given line
  milemarkers(track, interval) {
    if (interval <= 0) {
      return {"type": "FeatureCollection", "features": []};
    }

    const line = track.features[0].geometry.coordinates;
    const ruler = cheapruler(line[Math.trunc(line.length/2)][1]);
    const points = [];
    let count = 0;
    let intermediateDistance = 0;
    points.push(createPoint(line[0], interval * count++));

    for (let i = 0; i < line.length - 1; i++) {
      let currentPoint = line[i];
      let nextPoint = line[i + 1];
      let distance = ruler.distance(currentPoint, nextPoint);
      intermediateDistance += distance;

      if (intermediateDistance > interval) {
        let intermediatePoint = interpolate(
          currentPoint,
          nextPoint,
          (interval - (intermediateDistance - distance)) / distance
        );
        points.push(createPoint(intermediatePoint, interval * count++));
        intermediateDistance = ruler.distance(intermediatePoint, nextPoint);
      }
    }
    points.push(createPoint(line[line.length - 1], Math.trunc(this.totalDistance(track))));
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
