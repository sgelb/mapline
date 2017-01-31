import paperformat from './paperformat.js';
import Bbox from './bbox.js';

function featurecollection(features) {
  return {
    "type": "FeatureCollection",
    "features": features
  };
}

var mapcutter = {

  // return array of sheet bboxes in specified scale and format along track
  featurecollection(track, options) {

    let [width, height] = paperformat.dimensions(options.format);
    width -= 2 * options.margin;
    height -= 2 * options.margin;

    // real world width and height of map on cutout in meter
    const rw = width / 1000 * options.scale;
    const rh = height / 1000 * options.scale;

    // add padding around track in mm TODO: get as argument
    const padding = 10;
    const rwp = (width - 2*padding) / 1000 * options.scale;
    const rhp = (height - 2*padding) / 1000 * options.scale;

    var bboxes = [];

    for (let feature of track.features) {
      let bbox = new Bbox(feature.geometry.coordinates[0][1]);
      for (let coord of feature.geometry.coordinates) {
        let oldBbox = bbox.bbox;
        bbox.include(coord);
        if (bbox.largerThan(rwp, rhp)) {
          // FIXME: edge case of distance between coords > max(rwp, rhp)?
          bbox.revertTo(oldBbox);
          bbox.resize(rw, rh);

          bboxes.push(bbox.toFeature());

          bbox = new Bbox(coord[1]);
          bbox.include(coord);
        }
      }

      bbox.resize(rw, rh);
      bboxes.push(bbox.toFeature());
    }

    return featurecollection(bboxes);
  }

};

export default mapcutter;
