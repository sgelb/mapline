import mapboxgl from "mapbox-gl";
import CheapRuler from "cheap-ruler";

class BoundingBox {
  constructor(lat) {
    this._lat = lat;
    this._ruler = new CheapRuler(lat, "meters");
    this.bounds = new mapboxgl.LngLatBounds();
  }

  // return unprojected dimensions of bounds in meters
  _dimensions() {
    // TODO: replace distance() with own squaredDistance() and benchmark?
    // distance between nw and ne corner of bounds
    const w = this._ruler.distance(
      [this.bounds.getWest(), this.bounds.getNorth()],
      [this.bounds.getEast(), this.bounds.getNorth()]
    );
    // distance between nw and sw corner of bounds
    const h = this._ruler.distance(
      [this.bounds.getWest(), this.bounds.getNorth()],
      [this.bounds.getWest(), this.bounds.getSouth()]
    );
    return [w, h];
  }

  // return bounds as LineString array
  _linestring() {
    return [
      [this.bounds.getWest(), this.bounds.getNorth()],
      [this.bounds.getEast(), this.bounds.getNorth()],
      [this.bounds.getEast(), this.bounds.getSouth()],
      [this.bounds.getWest(), this.bounds.getSouth()],
      [this.bounds.getWest(), this.bounds.getNorth()],
    ];
  }

  // extend bounds to include coord
  extend(coord) {
    // slice possible altitude value from coord
    this.bounds.extend(coord.slice(0, 2));
  }

  // return if bounds width and height are larger than arguments
  largerThan(maxWidth, maxHeight) {
    let [width, height] = this._dimensions();
    return (
      (width > maxWidth || height > maxHeight) &&
      (height > maxWidth || width > maxHeight)
    );
  }

  // resize bounds to width and height
  resize(newWidth, newHeight) {
    const [width, height] = this._dimensions();
    let wDiff = 0.5 * (newWidth - width);
    let hDiff = 0.5 * (newHeight - height);

    if (height < width) {
      wDiff = 0.5 * (newHeight - width);
      hDiff = 0.5 * (newWidth - height);
    }

    // [w, s, e, n]
    let w = this._ruler.destination(
      [this.bounds.getWest(), this.bounds.getNorth()],
      wDiff,
      270
    )[0];
    let s = this._ruler.destination(
      [this.bounds.getWest(), this.bounds.getSouth()],
      hDiff,
      180
    )[1];
    let e = this._ruler.destination(
      [this.bounds.getEast(), this.bounds.getNorth()],
      wDiff,
      90
    )[0];
    let n = this._ruler.destination(
      [this.bounds.getWest(), this.bounds.getNorth()],
      hDiff,
      0
    )[1];

    this.bounds.setSouthWest([w, s]);
    this.bounds.setNorthEast([e, n]);
  }

  // revert to bounds
  revertTo(bounds) {
    this.bounds = bounds;
  }

  // return bounds as Feature
  toFeature() {
    const [width, height] = this._dimensions();
    return {
      type: "Feature",
      // FIXME: bbox is not a valid geojson bbox!
      // http://geojson.org/geojson-spec.html#bounding-boxes
      bbox: this.bounds,
      geometry: {
        type: "Polygon",
        coordinates: [this._linestring()],
      },
      properties: {
        width: width,
        height: height,
      },
    };
  }

  // return a clone of bounds
  cloneBounds() {
    if (this.bounds.isEmpty()) {
      return new mapboxgl.LngLatBounds();
    }

    return mapboxgl.LngLatBounds.convert(this.bounds.toArray());
  }
}

export default BoundingBox;
