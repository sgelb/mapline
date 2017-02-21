import mapboxgl from 'mapbox-gl';
import mapcutter from './mapcutter.js';
import token from './mapboxtoken.js';
import layers from './layers.js';
import trackutils from './trackutils.js';
import paperformat from './paperformat.js';
import {Route, Cutouts, Milemarkers} from './track.js';

class Mapbox {
  constructor(args, tracks) {
    mapboxgl.accessToken = token;

    if (!mapboxgl.supported()) {
      throw Error("Your browser does not support MapboxGL.");
    }

    this._tracks = tracks || new Map();
    this._map = new mapboxgl.Map(args);
    this._map.on('styledata', () => this._updateAllTracks());
    this._addControls();
  }

  _addControls() {
    this._map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this._map.addControl(new mapboxgl.ScaleControl());
  }

  _updateAllTracks() {
    this._tracks.forEach(track => {
      this.addTrack(track);
      this.updateTrack(track);
    });
  }

  addTrack(track) {
    this._tracks.set(track.id, track);
    layers.add(this._map, track);
  }

  updateTrack(track) {
    this._map.getSource(track.id).setData(track.data);
  }


  loadRoute(rawdata, ext) {
    let data = trackutils.togeojson(ext, rawdata);
    data = trackutils.reduce(data);
    this.addTrack(new Route("route", data));
    this.updateTrack(this._tracks.get("route"));
  }

  updateCutouts(options) {
    this.addTrack(new Cutouts("cutouts", mapcutter(this._tracks.get("route").data, options)));
    this.updateTrack(this._tracks.get("cutouts"));
  }

  updateMilemarkers(interval) {
    this.addTrack(new Milemarkers("milemarkers", trackutils.milemarkers(this._tracks.get("route").data, interval)));
    this.updateTrack(this._tracks.get("milemarkers"));
  }

  updateBounds(options) {
    this._map.fitBounds(trackutils.bounds(this._tracks.get("cutouts").data, options));
  }

  routeName() {
    return this._tracks.get("route").data.features[0].properties.name;
  }

  get cutouts() {
    return this._tracks.get("cutouts");
  }

  set style(style) {
    this._map.setStyle(style);
  }

  clearTracks() {
    this._tracks.forEach(track => track.clearLayerData(this._map));
  }

  copyTo(container) {
    return new Mapbox({
      container: container,
      style: this._map.getStyle(),
      interactive: false,
      renderWorldCopies: false
    }, this._tracks);
  }

  remove() {
    this._map.remove();
  }

  cutoutMap(feature, format, margin) {
    let orientation = (feature.properties.width > feature.properties.height) ? "l" : "p";
    let [width, height] = paperformat.dimensions(format, margin, orientation);

    const map = this._map;
    return new Promise(function(resolve, reject) {
      resizeContainer(map.getContainer(), width, height);
      map.resize();
      map.setCenter(feature.bbox.getCenter());
      map.fitBounds(feature.bbox, {duration: 0});

      map.on('render', function listener() {
        if (map.loaded()) {
          let data = map.getCanvas().toDataURL('image/jpeg', 1.0);
          resolve({format, orientation, data, margin, width, height});
          map.off('render', listener);
        }
      });

      map.on('error', function(e) {
        map.getContainer().parentNode.removeChild(map.getContainer());
        reject(Error(e.message));
      });

    });
  }

}

function resizeContainer(container, width, height) {
  container.style.width = toPixels(width);
  container.style.height = toPixels(height);
}

function toPixels(length) {
  // 96 dpi / 25.4mm/in = dots per mm
  return (96 / 25.4 ) * length + 'px';
}

function toStyleURI(style) {
  return 'mapbox://styles/mapbox/' + style + '-v9?optimize=true';
}

export default Mapbox;
