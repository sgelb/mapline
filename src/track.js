import mapcutter from './mapcutter.js';
import trackutils from './trackutils.js';
import layers from './layers.js';

class Track {
  constructor(id, data) {
    this._id = id;
    this._data = data || {};
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get data() {
    return this._data;
  }

  set data(data) {
    this._data = data;
  }

  get features() {
    return this._data.features;
  }

  addLayer(map) {
    layers.add(map, track);
  }

  updateLayerData(map) {
    map.getSource(this._id).setData(this._data);
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
        "line-width": 4,
        "line-opacity": 0.6,
        "line-dasharray": [2, 1]
      },
    };
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
        "line-dasharray": [3, 2]
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
        "text-field": "{title} km",
        "text-anchor": "bottom",
        "text-size": 11.25,
        "icon-ignore-placement": true,
        "text-optional": true
      }
    };
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

export {Route, Cutouts, Milemarkers, Poi};
