import mapcutter from './mapcutter.js';
import trackutils from './trackutils.js';
import layers from './layers.js';

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
      "type": "FeatureCollection",
      "features": []
    });
  }

  get before() {
    return "housenum-label";
  }

  get layer() {}
}


class Route extends Track {
  get layer() {
    return {
      "id": this._id,
      "source": this._id,
      "type": "line",
      "layout": {
        "line-join": "round",
        "line-cap": "square"
      },
      "paint": {
        "line-color": "#ff69b4",
        "line-width": 3,
        "line-opacity": 0.6,
      },
      "filter": ["!=", "alternative", true]
    };
  }
}

class Alternative extends Route {
  constructor(id, source, geojson) {
    super(id,geojson);
    this._source = source;
  }

  get layer() {
    let layer = super.layer;
    layer.paint["line-dasharray"] = [3, 2];
    layer.filter = ["==", "alternative", true];
    return layer;  
  }
}

class Cutouts extends Track {
  get layer() {
    return {
      "id": this._id,
      "source": this._id,
      "type": "line",
      "paint": {
        "line-color": "#444444",
        "line-width": 2,
        "line-offset": -3,
        "line-opacity": 0.6,
        "line-dasharray": {
          "stops": [
            [0, [1000, 0]],
            [12, [3, 2]]
          ]
        }
      }
    };
  }

}

class Milemarkers extends Track {
  get layer() {
    return {
      "id": this._id,
      "source": this._id,
      "type": "symbol",
      "layout": {
        "icon-image": "marker-11",
        "icon-offset": [0, -5],
        "text-field": "{title} km",
        "text-anchor": "bottom",
        "text-offset": [0, -0.5],
        "text-size": 11,
        "icon-ignore-placement": true,
        "text-optional": true,
      },
      "paint": {
	"text-color": "#000000",
      },
      "filter": ["!=", "alternative", true]
    };
  }
}

class AlternativeMilemarkers extends Milemarkers {
  constructor(id, source, geojson) {
    super(id,geojson);
    this._source = source;
  }

  get layer() {
    let layer = super.layer;
    layer.paint["text-color"] = "#a0a0a0";
    layer.filter = ["==", "alternative", true];
    return layer;  
  }
}

class Poi extends Track {
  get layer() {
    return {
      "id": this._id,
      "source": this._id,
      "type": "symbol",
      "layout": {
        "icon-image": this._id,  // TODO: create map of poi icons
        "icon-ignore-placement": true,
      }
    };
  }
}

export {Route, Alternative, Cutouts, Milemarkers, AlternativeMilemarkers, Poi};
