function hasSource(map, id) {
  return map.getSource(id);
}

function addSource(map, id) {
  map.addSource(id, {
    type: "geojson",
    data: emptyFeatureCollection(),
  });
}

function emptyFeatureCollection() {
  return { type: "FeatureCollection", features: [] };
}

function getBeforeLayer(map) {
  // find specific layer to put overlay before. stack on top otherwise
  if (map.getLayer("housenum-label")) {
    return "housenum-label";
  }
  if (map.getLayer("motorway-junction")) {
    return "motorway-junction";
  }
}

const layers = {
  add(map, track) {
    const id = track.id;

    if (hasSource(map, id)) {
      return;
    }
    addSource(map, id);
    map.addLayer(track.layer, getBeforeLayer(map));
  },
  setVisibility(map, id, visibility) {
    map.setLayoutProperty(id, "visibility", visibility ? "visible" : "none");
  },
};

export default layers;
