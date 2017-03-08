import mapcutter from './mapcutter.js';
import token from './mapboxtoken.js';
import layers from './layers.js';
import trackutils from './trackutils.js';
import paperformat from './paperformat.js';
import {Route, Cutouts, Milemarkers} from './track.js';

class Mapbox {
  constructor(args, tracks, details) {
    mapboxgl.accessToken = token;

    if (!mapboxgl.supported()) {
      throw Error("Your browser does not support MapboxGL.");
    }

    this._tracks = tracks || new Map();
    this._details = details || {};
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
    this._map.getSource(track.id).setData(track.geojson);
  }

  loadRoute(data, filename) {
    let ext = filename.split('.').pop().toLowerCase();
    this._details.filename = filename.substring(0, filename.lastIndexOf('.'));
    let geojson = trackutils.togeojson(ext, data);
    geojson = trackutils.reduce(geojson);
    this.addTrack(new Route("route", geojson));
    this.updateTrack(this._tracks.get("route"));
    [this._details.climb, this._details.descent] = trackutils.elevation(geojson);
    this._details.distance = trackutils.totalDistance(geojson);
  }

  _formatDetail(value, decimal, unit) {
    if (value !== undefined) {
      return `${value}${unit}`;
    }
    return "unknown";
  }

  getDetails() {
    let details = new Map();
    details.set("Length", this._addUnit(this._details.distance, "km"));
    details.set("Climb", this._addUnit(this._details.climb, "m"));
    details.set("Descent", this._addUnit(this._details.descent, "m"));
    details.set("Map sheets", this._details.mapCount);
    return details;
  }

  getPrintDetails() {
    let details = this.getDetails();
    let cutouts = this.cutouts.features;
    let route = this._tracks.get("route").geojson;
    let totalMapCount = details.get("Map sheets");
    let formatDetail = this._formatDetail;

    return function(mapCount) {
      let [localLength, intermediateLength] = trackutils.distanceInBounds(
        cutouts[mapCount-1], route);

      // Map 3 of 7 · 36.7km · 123.4 of 2156.5km total
      let text = `Map ${mapCount} of ${totalMapCount}`;
      text += ` · ${formatDetail(localLength, 2, "km")}`;
      text += ` · ${formatDetail(intermediateLength, 2, "km")} of ${details.get("Length")} total`;

      return text;
    };
  }

  updateCutouts(options) {
    this.addTrack(new Cutouts("cutouts", mapcutter(this._tracks.get("route").geojson, options)));
    this.updateTrack(this._tracks.get("cutouts"));
    this._details.mapCount = this._tracks.get("cutouts").features.length;
  }

  updateMilemarkers(interval) {
    this.addTrack(new Milemarkers("milemarkers", trackutils.milemarkers(this._tracks.get("route").geojson, interval)));
    this.updateTrack(this._tracks.get("milemarkers"));
  }

  updateBounds(options) {
    this._map.fitBounds(trackutils.bounds(this._tracks.get("cutouts").geojson), options);
  }

  get name() {
    return this._details.filename;
  }

  routeName() {
    return this._tracks.get("route").geojson.features[0].properties.name || this.name;
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
    }, this._tracks, this._details);
  }

  remove() {
    this._map.remove();
  }

  cutoutMap(feature, format, margin) {
    let orientation = (feature.properties.width > feature.properties.height) ? "l" : "p";
    let [width, height] = paperformat.dimensions(format, margin, orientation);

    // Details
    // create printDetails: use symbols, inline, etc
    let details = this.getPrintDetails();

    const map = this._map;
    return new Promise(function(resolve, reject) {
      resizeContainer(map.getContainer(), width, height);
      map.resize();
      map.setCenter(feature.bbox.getCenter());
      map.fitBounds(feature.bbox, {duration: 0});

      map.on('render', function listener() {
        if (map.loaded()) {
          let data = map.getCanvas().toDataURL('image/jpeg', 1.0);
          resolve({format, orientation, data, margin, width, height, details});
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
