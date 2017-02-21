import paperformat from './paperformat.js';
import BoundingBox from './boundingbox.js';

// return array of sheet bounds in specified scale and format along route
var mapcutter = function(route, options) {
  // TODO: get padding in options
  options.padding = 10;

  let [width, height] = paperformat.dimensions(options.format);
  width -= 2 * options.margin;
  height -= 2 * options.margin;

  // real world width and height of map on cutout in meter
  const rw = width / 1000 * options.scale;
  const rh = height / 1000 * options.scale;

  // add padding around route in mm
  const rwp = (width - 2*options.padding) / 1000 * options.scale;
  const rhp = (height - 2*options.padding) / 1000 * options.scale;

  var bounds = [];

  for (let feature of route.features) {
    let bbox = new BoundingBox(feature.geometry.coordinates[0][1]);
    for (let coord of feature.geometry.coordinates) {
      let oldBbox= bbox.bounds;
      bbox.extend(coord);
      if (bbox.largerThan(rwp, rhp)) {
        // FIXME: edge case of distance between coords > max(rwp, rhp)?
        bbox.revertTo(oldBbox);
        bbox.resize(rw, rh);

        bounds.push(bbox.toFeature());

        bbox = new BoundingBox(coord[1]);
        bbox.extend(coord);
      }
    }

    bbox.resize(rw, rh);
    bounds.push(bbox.toFeature());
  }

  return {
    "type": "FeatureCollection",
    "features": bounds
  };
};

export default mapcutter;
