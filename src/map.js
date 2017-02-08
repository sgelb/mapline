import mapboxgl from 'mapbox-gl';
import mapcutter from './mapcutter.js';
import token from './mapboxtoken.js';
import layers from './layers.js';
import trackutils from './trackutils.js';

class Map {
  constructor(args) {
    mapboxgl.accessToken = token;

    if (!mapboxgl.supported()) {
      throw Error("Your browser does not support MapboxGL.");
    }

    this._route = {};
    this._cutouts = {};
    this._bounds = {};
    this._milemarkers = {};

    this._map = new mapboxgl.Map(args);
    this._map.on('styledata', () => this._styleupdate());
    this._addControls();
  }

  _styleupdate() {
    layers.addRoute(this._map);
    layers.addCutouts(this._map);
    layers.addMilemarkers(this._map);

    if (this._route.features) {
      this._map.getSource("route").setData(this._route);
    }
    if (this._cutouts.features) {
      this._map.getSource("cutouts").setData(this._cutouts);
    }
    if (this._milemarkers.features) {
      this._map.getSource("milemarkers").setData(this._milemarkers);
    }
  }

  _addControls() {
    this._map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this._map.addControl(new mapboxgl.ScaleControl());
  }

  _reset(source) {
    this._map.getSource(source).setData(layers.empty());
  }

  loadRoute(rawdata, ext) {
    this._route = trackutils.togeojson(ext, rawdata);
    this._route = trackutils.reduce(this._route);
    this._map.getSource("route").setData(this._route);
  }

  reset() {
    this._reset("route");
    this._reset("cutouts");
    this._reset("milemarkers");
  }

  updateCutouts(options) {
    this._cutouts = mapcutter.featurecollection(this._route, options);
    this._map.getSource("cutouts").setData(this._cutouts);
  }

  updateMilemarkers(interval) {
    this._milemarkers = trackutils.milemarkers(this._route, interval);
    this._map.getSource("milemarkers").setData(this._milemarkers);
  }

  updateBounds(options) {
    this._bounds = trackutils.bounds(this._cutouts);
    this._map.fitBounds(this._bounds, options);
  }

  routeName() {
    return this._route.features[0].properties.name;
  }

  style(style) {
    this._map.setStyle(style);
  }

}

function toStyleURI(style) {
  return 'mapbox://styles/mapbox/' + style + '-v9?optimize=true';
}

export default Map;
