function hasSource(map, id) {
  return map.getSource(id);
}

function addSource(map, id) {
  map.addSource(id, {
    "type": 'geojson',
    "data": emptyFeatureCollection()
  });
}

function emptyFeatureCollection() {
  return {"type": "FeatureCollection", "features": []};
}

const layers = {
  add(map, track) {
    const id = track.id;

    if (hasSource(map, id)) {
      return;
    }
    addSource(map, id);
    map.addLayer(track.layer, track.before);
  }
};

export default layers;
