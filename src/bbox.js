import cheapruler from 'cheap-ruler';

class Bbox {

  constructor(lat) {
    this.lat = lat;
    this.ruler = cheapruler(lat, "meters");
    // new bbox [w, s, e, n]
    this.bbox = [ Infinity, Infinity, -Infinity, -Infinity ];
  }

  // extent bbox to include coordinate
  include(ll) {
    this.bbox[0] = Math.min(this.bbox[0], ll[0]);
    this.bbox[1] = Math.min(this.bbox[1], ll[1]);
    this.bbox[2] = Math.max(this.bbox[2], ll[0]);
    this.bbox[3] = Math.max(this.bbox[3], ll[1]);
  }

  // return unprojected dimensions of bbox in meters
  dimensions() {
    // distance between nw and ne corner of bbox
    // TODO: replace distance() with own squaredDistance() and benchmark
    const w = this.ruler.distance(
      [ this.bbox[0], this.bbox[3] ],
      [ this.bbox[2], this.bbox[3] ]);
    // distance between nw and sw corner of bbox
    const h = this.ruler.distance(
      [ this.bbox[0], this.bbox[3] ],
      [ this.bbox[0], this.bbox[1] ]);
    return [w, h];
  }

  // return if bbox width and height are larger than arguments
  largerThan(maxWidth, maxHeight) {
    let [w, h] = this.dimensions();
    return (w > maxWidth || h > maxHeight) && (h > maxWidth || w > maxHeight);
  }

  // resize bbox to width and height
  resize(newWidth, newHeight) {
    const [w, h] = this.dimensions();
    let wDiff = 0.5 * (newWidth - w);
    let hDiff = 0.5 * (newHeight - h);

    if (h <= newWidth && w <= newHeight) {
      wDiff = 0.5 * (newHeight - w);
      hDiff = 0.5 * (newWidth- h);
    }

    this.bbox[0] = this.ruler.destination(
      [this.bbox[0], this.bbox[3]], wDiff, 270)[0];
    this.bbox[1] = this.ruler.destination(
      [this.bbox[0], this.bbox[1]], hDiff, 180)[1];
    this.bbox[2] = this.ruler.destination(
      [this.bbox[2], this.bbox[3]], wDiff, 90)[0];
    this.bbox[3] = this.ruler.destination(
      [this.bbox[0], this.bbox[3]], hDiff, 0)[1];
  }

  // revert to bbox
  revertTo(bbox) {
    this.bbox = bbox;
  }

  // return bbox as LineString array
  linestring() {
    return [
      [ this.bbox[0], this.bbox[3] ],
      [ this.bbox[2], this.bbox[3] ],
      [ this.bbox[2], this.bbox[1] ],
      [ this.bbox[0], this.bbox[1] ],
      [ this.bbox[0], this.bbox[3] ]
    ];
  }

  // return bbox as Feature
  toFeature() {
    const [width, height] = this.dimensions();
    return {
      "type": "Feature",
      "bbox": this.bbox,
      "geometry": {
        "type": "Polygon",
        "coordinates": [this.linestring()]
      },
      "properties": {
        "name": "cutout",
        "width": width,
        "height": height
      }
    };
  }
}

export default Bbox;
