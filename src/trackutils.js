import mapboxgl from "mapbox-gl";
import cheapruler from "cheap-ruler";
import normalize from "@mapbox/geojson-normalize";
import toGeoJSON from "@mapbox/togeojson";
import profile from "./profile.js";

// copied from https://github.com/mapbox/cheap-ruler
function interpolate(a, b, t) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return [a[0] + dx * t, a[1] + dy * t];
}

function createFeature(type, coords, props = {}) {
  return {
    type: "Feature",
    geometry: {
      type: type,
      coordinates: coords
    },
    properties: props
  };
}

function createPoint(coords, props) {
  return createFeature("Point", coords, props);
}

function createLineString(coords) {
  return createFeature("LineString", coords);
}

function featureCollection(features) {
  return { type: "FeatureCollection", features: features };
}

function insideBounds(point, bbox) {
  return (
    point[0] >= bbox.getWest() &&
    point[0] <= bbox.getEast() &&
    point[1] >= bbox.getSouth() &&
    point[1] <= bbox.getNorth()
  );
}

function intersect(coord1, coord2, bounds) {
  // adapted from github.com/maxogden/geojson-js-utils/blob/master/geojson-utils.js
  const a1 = { x: coord1[0], y: coord1[1] };
  const a2 = { x: coord2[0], y: coord2[1] };

  for (let i = 0; i < bounds.length - 1; i++) {
    let b1 = { x: bounds[i][0], y: bounds[i][1] };
    let b2 = { x: bounds[i + 1][0], y: bounds[i + 1][1] };

    let u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (u_b !== 0) {
      let ua =
        ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / u_b;
      let ub =
        ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / u_b;

      if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        return [a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)];
      }
    }
  }
  return false;
}

function prepare(geojson) {
  geojson = normalize(geojson);
  // geojson = complexify(geojson, 1);
  return geojson;
}

// return FeatureCollection with a maximum distance between points
// FIXME: make obsolete by improving cutting of track in boxes
function complexify(track, interval) {
  let coordinates = track.features[0].geometry.coordinates.slice();
  const ruler = cheapruler(coordinates[Math.trunc(coordinates.length / 2)][1]);
  let result = [];

  while (coordinates.length > 1) {
    let endpt = ruler.along(coordinates, interval);
    let tempcoords = [];

    for (let i = 0; i < coordinates.length; i++) {
      tempcoords.push(coordinates[i]);

      if (ruler.lineDistance(tempcoords) >= interval) {
        tempcoords.pop();
        tempcoords.push(endpt);
        coordinates = coordinates.slice(i);
        coordinates.unshift(endpt);
        result.push(tempcoords);
        break;
      }

      if (i == coordinates.length - 1) {
        coordinates = [];
        result.push(tempcoords);
      }
    }
  }

  return normalize(createFeature("LineString", [].concat(...result)));
}

// return track reduced to FeatureCollection of "type" features
function reduce(track, type) {
  track = normalize(track);
  const reducedFeatures = track.features.filter(feature => {
    if (feature.geometry) {
      return feature.geometry.type.endsWith(type);
    }
  });

  if (reducedFeatures.length === 0 && type === "LineString") {
    console.log("No track or route found.");
    throw new Error("No track or route found.");
  }

  return featureCollection(reducedFeatures);
}

const trackutils = {
  // return bounds of track
  bounds(track) {
    const bounds = new mapboxgl.LngLatBounds();
    track.features.forEach(feature => bounds.extend(feature.bbox));
    return bounds;
  },

  // return total distance of track in kilometer
  totalDistance(track) {
    let totalDistance = 0;
    for (const feature of track.features) {
      const line = feature.geometry.coordinates;
      const ruler = cheapruler(line[Math.trunc(line.length / 2)][1]);
      totalDistance += parseFloat(ruler.lineDistance(line));
    }
    return totalDistance;
  },

  // return cumulated ascent and descent and min/max elevation of track in meter
  elevation(track) {
    let ascent = 0;
    let descent = 0;
    let min_ele = Infinity;
    let max_ele = -Infinity;
    for (const feature of track.features) {
      const line = feature.geometry.coordinates;
      if (line[0].length < 3) {   // no elevation data
        return [NaN, NaN, NaN, NaN];
      }
      let last = line[0][2];
      line.forEach(coord => {
        min_ele = Math.min(min_ele, coord[2]);
        max_ele = Math.max(max_ele, coord[2]);
        let diff = coord[2] - last;
        if (diff > 0) {
          ascent += diff;
        } else {
          descent -= diff;
        }
        last = coord[2];
      });
    }
    return [ascent, descent, min_ele, max_ele];
  },

  // return distance of first track section within bounds
  distanceInBounds(bounds, track) {
    let insideDistance = 0;
    let intermediateDistance = 0;
    let previousDistance = 0;
    for (const feature of track.features) {
      const line = feature.geometry.coordinates;
      const ruler = cheapruler(bounds.bbox.getCenter().lat);
      let lastInBounds = insideBounds(line[0], bounds.bbox);
      for (let i = 1; i < line.length - 1; i++) {
        // inside bounds
        let thisInBounds = insideBounds(line[i], bounds.bbox);
        if (thisInBounds) {
          if (lastInBounds) {
            insideDistance += ruler.distance(line[i - 1], line[i]);
          } else {
            // last point was outside bounds, add distance to intersection
            const intersection = intersect(line[i - 1], line[i], bounds.geometry.coordinates[0]);
            const intersectionDistance = ruler.distance(line[i], intersection);
            insideDistance += intersectionDistance;
          }
        } else {
          // outside bounds
          if (lastInBounds) {
            // last point was inside these bounds, find intersection
            const intersection = intersect(line[i - 1], line[i], bounds.geometry.coordinates[0]);
            const intersectionDistance = ruler.distance(line[i - 1], intersection);
            insideDistance += intersectionDistance;

            intermediateDistance = previousDistance + ruler.lineDistance(line.slice(0, i)) + intersectionDistance;
          }
        }
        lastInBounds = thisInBounds;
      }

      if (intermediateDistance == 0 || lastInBounds) {
        intermediateDistance = previousDistance + ruler.lineDistance(line);
      }
      previousDistance += ruler.lineDistance(line);
    }

    if (insideDistance == 0) {
      return [0, 0];
    }

    return [insideDistance, intermediateDistance];
  },

  // return FeatureCollection with Points in given interval along given line
  milemarkers(track, interval) {
    if (interval <= 0) {
      return featureCollection([]);
    }

    const points = [];
    let count = 0;
    let intermediateDistance = 0;
    let nextPoint = track.features[0].geometry.coordinates[0];
    points.push(createPoint(nextPoint, interval * count++));
    for (const feature of track.features) {
      const line = feature.geometry.coordinates;
      const ruler = cheapruler(line[Math.trunc(line.length / 2)][1]);
      for (let i = 0; i < line.length - 1; i++) {
        let currentPoint = line[i];
        nextPoint = line[i + 1];
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
    }
    points.push(createPoint(nextPoint, Math.trunc(this.totalDistance(track))));
    return featureCollection(points);
  },

  // convert data to geojson
  togeojson(format, data) {
    if (format === "geojson") {
      return prepare(JSON.parse(data));
    }

    if (format === "gpx" || format === "kml") {
      data = new DOMParser().parseFromString(data, "text/xml");
      return prepare(toGeoJSON[format](data));
    }

    throw "Unknown file format: " + format;
  },

  // return featureCollection of linestrings
  tracks(track) {
    return reduce(track, "LineString");
  },

  // return featureCollection of waypoints
  waypoints(track) {
    track = reduce(track, "Point");
    const points = track.features.map(feature => {
      return createPoint(feature.geometry.coordinates, {
        title: feature.properties.name,
        symbol: feature.properties.sym
          ? feature.properties.sym.toLowerCase()
          : "embassy-11"
      });
    });

    return featureCollection(points);
  },

  pois(pois) {
    const points = pois.map(poi => {
      return createPoint(poi.coords, poi.props);
    });

    return featureCollection(points);
  },

  emptyFeatureCollection() {
    return featureCollection([]);
  },

  slopes(track) {
    let result = featureCollection([]);
    for (const feature of track.features) {
      let line = feature.geometry.coordinates;

      // find the section with significant slope
      let slopeSegments = profile.slopes(line);

      // create features
      for (const part of slopeSegments) {
        let newFeature = createFeature("LineString", line.slice(part.start, part.end));
        newFeature.properties.slopesign = Math.sign(part.slope);
        newFeature.properties.slope = Math.abs(part.slope);
        if (newFeature.properties.slope >= 10) {
          newFeature.properties.symbol = "gradient-steep";
        } else {
          newFeature.properties.symbol = "gradient";
        }
        result.features.push(newFeature);
      }
    }

    return result;
  },
};

export default trackutils;
