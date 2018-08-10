import mapboxgl from "mapbox-gl";
import MapBoxLanguage from "@mapbox/mapbox-gl-language";

import layers from "./layers.js";
import mapcutter from "./mapcutter.js";
import overpass from "./overpass.js";
import paperformat from "./paperformat.js";
import token from "./mapboxtoken.js";
import trackutils from "./trackutils.js";
import { Route, Cutouts, Milemarkers, POIs } from "./track.js";

class Mapbox {
  constructor(options, tracks, details) {
    mapboxgl.accessToken = token;

    if (!mapboxgl.supported()) {
      throw Error("Your browser does not support MapboxGL.");
    }

    this._tracks = tracks || new Map();
    this._details = details || {};
    try {
      this._map = new mapboxgl.Map(options);
    } catch (e) {
      throw Error(`Your browser does not support MapboxGL.`);
    }
    this._map.on("styledata", () => this._updateAllTracks());
    this._addControls();
  }

  _addControls() {
    this._map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false })
    );
    this._map.addControl(new mapboxgl.ScaleControl());
    this._map.addControl(new MapBoxLanguage());
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

  toggleVisibility(trackName, visibility) {
    if (this._tracks.has(trackName)) {
      layers.setVisibility(
        this._map,
        this._tracks.get(trackName).id,
        visibility
      );
    }
  }

  changeTrackStyle(option) {
    // option = {property: "line-color", value: "#ff0000"};
    this._map.setPaintProperty("route", option.property, option.value);
  }

  loadRoute(data, filename) {
    let ext = filename
      .split(".")
      .pop()
      .toLowerCase();
    this._details.filename = filename.substring(0, filename.lastIndexOf("."));
    const geojson = trackutils.togeojson(ext, data);

    this.addTrack(new Route("route", trackutils.tracks(geojson)));
    this.updateTrack(this._tracks.get("route"));

    this.addTrack(new POIs("waypoints", trackutils.waypoints(geojson)));

    [
      this._details.ascent,
      this._details.descent,
      this._details.min_ele,
      this._details.max_ele
    ] = trackutils.elevation(geojson);
    this._details.distance = trackutils.totalDistance(geojson);
  }

  loadPOIs(category, visibility) {
    if (!this._tracks.has(category)) {
      this.addTrack(new POIs(category, trackutils.emptyFeatureCollection()));
    }
    this.toggleVisibility(category, visibility);
    if (visibility) {
      overpass
        .loadPOIs(this.cutouts.features, category)
        .then(result => {
          console.log("Found " + result.length + " results for " + category);
          this.addTrack(new POIs(category, trackutils.pois(result)));
          this.updateTrack(this._tracks.get(category));
        })
        .catch(e => {
          console.error(
            "Error fetching POIs for " + category + ": " + e.message
          );
        });
    }
  }

  roundWithUnit(value, decimal_part, unit = "") {
    if (value === undefined) {
      return "unknown";
    }
    return `${value.toFixed(decimal_part)}${unit}`;
  }

  getDetails() {
    let details = new Map();
    details.set(
      "track_length",
      this.roundWithUnit(this._details.distance, 2, "km")
    );
    details.set(
      "track_ascent_descent",
      "&nearr;" +
        this.roundWithUnit(this._details.ascent, 0, "m") +
        ", &searr;" +
        this.roundWithUnit(this._details.descent, 0, "m")
    );
    details.set(
      "track_min_max_elevation",
      "&DownArrowBar;" +
      this.roundWithUnit(this._details.min_ele, 0, "m") +
        ", &UpArrowBar;" +
        this.roundWithUnit(this._details.max_ele, 0, "m")
    );
    details.set("map_sheets", this._details.mapCount);
    return details;
  }

  getPrintDetails() {
    let details = this.getDetails();
    let cutouts = this.cutouts.features;
    let route = this._tracks.get("route").geojson;
    let totalMapCount = details.get("Map sheets");
    let formatDetail = this.roundWithUnit;

    return function(mapCount) {
      let [localLength, intermediateLength] = trackutils.distanceInBounds(
        cutouts[mapCount - 1],
        route
      );

      // Map 3 of 7 · 36.7km · 123.4 of 2156.5km total
      let text = `Map ${mapCount} of ${totalMapCount}`;
      text += ` · ${formatDetail(localLength, 2, "km")}`;
      text += ` · ${formatDetail(intermediateLength, 2, "km")} of ${details.get(
        "Length"
      )} total`;

      return text;
    };
  }

  updateCutouts(options) {
    this.addTrack(
      new Cutouts(
        "cutouts",
        mapcutter(this._tracks.get("route").geojson, options)
      )
    );
    this.updateTrack(this._tracks.get("cutouts"));
    this._details.mapCount = this._tracks.get("cutouts").features.length;
  }

  updateMilemarkers(interval) {
    this.addTrack(
      new Milemarkers(
        "milemarkers",
        trackutils.milemarkers(this._tracks.get("route").geojson, interval)
      )
    );
    this.updateTrack(this._tracks.get("milemarkers"));
  }

  updateBounds(options) {
    this._map.fitBounds(
      trackutils.bounds(this._tracks.get("cutouts").geojson),
      options
    );
  }

  get name() {
    return this._details.filename;
  }

  set name(filename) {
    this._details.filename = filename;
  }

  routeName() {
    return (
      this._tracks.get("route").geojson.features[0].properties.name || this.name
    );
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
    return new Mapbox(
      {
        container: container,
        style: this._map.getStyle(),
        interactive: false,
        renderWorldCopies: false
      },
      this._tracks,
      this._details
    );
  }

  remove() {
    this._map.remove();
  }

  cutoutMap(feature, format, margin) {
    let orientation =
      feature.properties.width > feature.properties.height ? "l" : "p";
    let [width, height] = paperformat.dimensions(format, margin, orientation);
    let details = this.getPrintDetails();

    const map = this._map;
    return new Promise(function(resolve, reject) {
      resizeContainer(map.getContainer(), width, height);
      map.resize();
      map.setCenter(feature.bbox.getCenter());
      map.fitBounds(feature.bbox, { duration: 0 });

      map.on("render", function listener() {
        if (map.loaded()) {
          let data = map.getCanvas().toDataURL("image/jpeg", 0.9);
          resolve({
            format,
            orientation,
            data,
            margin,
            width,
            height,
            details
          });
          map.off("render", listener);
        }
      });

      map.on("error", function(e) {
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
  return (96 / 25.4) * length + "px";
}

export default Mapbox;
