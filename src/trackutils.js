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
    let line = track;
    if (track.type === "FeatureCollection") {
      line = track.features[0].geometry;
    } else if (track.type === "Feature") {
      line = track.geometry;
    }

    if (line.type === "MultiLineString") {
      line = line.coordinates[0];
    } else if (line.hasOwnProperty('coordinates')) {
      line = line.coordinates;
    }

    const ruler = cheapruler(line[Math.trunc(line.length/2)][1]);
    return parseFloat(ruler.lineDistance(line).toFixed(2));
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

  insideBounds(point, bbox) {
    return  point[0] >= bbox.getWest() &&
      point[0] <= bbox.getEast() &&
      point[1] >= bbox.getSouth() &&
      point[1] <= bbox.getNorth();
  },

  distanceInBounds(bounds, route) {
    const line = route.geometry.coordinates;
    const ruler = cheapruler(bounds.bbox.getCenter().lat);
    let insideDistance = 0;
    let insideBounds = this.insideBounds(line[0], bounds.bbox);
    for (let i = 0; i < line.length - 1; i++) {

      // inside bounds
      if (this.insideBounds(line[i], bounds.bbox)) {
        insideDistance += ruler.distance(line[i], line[i+1]);
        insideBounds = true;
        continue;
      }

      // outside bounds
      if (insideBounds) {
        // last point was inside this bounds, find intersection
        const intersection = this.intersection(line[i], line[i-1], bounds.geometry.coordinates[0]);
        const intersectionDistance = ruler.distance(line[i], intersection);
        insideDistance += intersectionDistance;
        const intermediateDistance = this.totalDistance(line.slice(0, i)) + intersectionDistance;
        return [insideDistance, intermediateDistance];
      }
    }

    // track never was inside bounds
    if (insideBounds === false) {
      return [0, 0];
    }

    // track ends inside of bounds.
    return [insideDistance, this.totalDistance(line)];
  },

  intersection(coord1, coord2, bounds) {
    // adapted from github.com/maxogden/geojson-js-utils/blob/master/geojson-utils.js
    const a1 = {x: coord1[0], y: coord1[1]};
    const a2 = {x: coord2[0], y: coord2[1]};

    for (let i = 0; i < bounds.length - 1; i++) {
      let b1 = {x: bounds[i][0], y: bounds[i][1]};
      let b2 = {x: bounds[i+1][0], y: bounds[i+1][1]};

      let u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
      if (u_b !== 0) {
        let ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / u_b;
        let ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / u_b;

        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
          return [a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)];
        }
      }
    }
    return false;
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
