import paperformat from "./paperformat.js";
import BoundingBox from "./boundingbox.js";
import trackutils from "./trackutils.js";

// return FeatureCollection of bounds in specified scale and format along route
const mapcutter = function(route, options) {
  let [width, height] = paperformat.dimensions(options.format);
  width -= 2 * options.margin;
  height -= 2 * options.margin;

  // real world width and height of map on cutout in meter
  const rw = (width / 1000) * options.scale;
  const rh = (height / 1000) * options.scale;

  // add padding around route on print map in mm
  const rwp = ((width - 2 * options.padding) / 1000) * options.scale;
  const rhp = ((height - 2 * options.padding) / 1000) * options.scale;

  const bounds = [];
  let bbox = new BoundingBox(route.features[0].geometry.coordinates[0][1]);
  for (const feature of route.features) {
    for (const coord of feature.geometry.coordinates) {
      if(alreadyCovered(bounds,coord)) {
          continue;
      }
      let oldBbox = bbox.cloneBounds();
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
  }

  bbox.resize(rw, rh);
  bounds.push(bbox.toFeature());

  return {"type": "FeatureCollection", "features": bounds};
};

function alreadyCovered(bounds, coord)
{
    if(bounds.length == 0) {
        return false;
    }

    for (const bound of bounds) {
        if (coord[1] >= bound.bbox.getSouth() && coord[1] <= bound.bbox.getNorth() && coord[0] >= bound.bbox.getWest() && coord[0] <= bound.bbox.getEast()) {
            return true;
        }
    }

    return false;
}

export default mapcutter;
