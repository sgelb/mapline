import mapcutter from "./mapcutter.js";
import trackutils from "./trackutils.js";
import layers from "./layers.js";

class Track {
  constructor(id, geojson) {
    this._id = id;
    this._geojson = geojson || {};
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get minzoom() {
    return 0;
  }

  get geojson() {
    return this._geojson;
  }

  set geojson(geojson) {
    this._geojson = geojson;
  }

  get features() {
    return this._geojson.features;
  }

  addLayer(map) {
    layers.add(map, track);
  }

  updateLayerData(map) {
    map.getSource(this._id).setData(this._geojson);
  }

  clearLayerData(map) {
    map.getSource(this._id).setData({
      type: "FeatureCollection",
      features: [],
    });
  }

  get layer() {}
}

class Route extends Track {
  get layer() {
    return {
      id: this._id,
      source: this._id,
      type: "line",
      layout: {
        "line-join": "round",
        "line-cap": "square",
      },
      paint: {
        "line-color": "#ff69b4",
        "line-width": 3,
        "line-opacity": 0.6,
      },
    };
  }
}

class Cutouts extends Track {
  get layer() {
    return {
      id: this._id,
      source: this._id,
      type: "line",
      paint: {
        "line-color": "#444444",
        "line-width": 2,
        "line-offset": -3,
        "line-opacity": 0.6,
        "line-dasharray": {
          stops: [
            [0, [1000, 0]],
            [12, [3, 2]],
          ],
        },
      },
    };
  }
}

class Milemarkers extends Track {
  get layer() {
    return {
      id: this._id,
      source: this._id,
      type: "symbol",
      layout: {
        "icon-image": "marker-11",
        "icon-offset": [0, -5],
        "icon-ignore-placement": true,
        "text-field": "{title} km",
        "text-anchor": "bottom",
        "text-offset": [0, -0.5],
        "text-size": 11,
        "text-optional": true,
      },
    };
  }
}

class POIs extends Track {
  get layer() {
    return {
      id: this._id,
      source: this._id,
      type: "symbol",
      layout: {
        "icon-image": "{symbol}",
        "icon-ignore-placement": true,
        "icon-allow-overlap": true,
        "text-field": "{title}",
        "text-anchor": "top",
        "text-offset": [0, 0.5],
        "text-size": 11,
        "text-allow-overlap": true,
        "text-optional": true,
      },
    };
  }
}

export { Route, Cutouts, Milemarkers, POIs };
