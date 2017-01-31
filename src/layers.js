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

  empty() {
    return emptyFeatureCollection();
  },

  // Cutouts layer
  addCutouts(map) {
    const id = "cutouts";

    if (hasSource(map, id)) {
      return;
    }
    addSource(map, id);

    map.addLayer({
      "id": "cutouts",
      "source": id,
      "type": "line",
      "paint": {
        "line-color": "#444444",
        "line-width": 2,
        "line-offset": -2,
        "line-opacity": 0.6,
        "line-dasharray": [3, 2]
      }
    }, "housenum-label");
  },

  // Track layer
  addTrack(map) {
    const id = "track";

    if (hasSource(map, id)) {
      return;
    }
    addSource(map, id);

    map.addLayer({
      "id": id,
      "source": id,
      "type": "line",
      "layout": {
        "line-join": "round",
        "line-cap": "square"
      },
      "paint": {
        "line-color": "#ff69b4",
        "line-width": 4,
        "line-opacity": 0.6,
        "line-dasharray": [2, 1]
      },
    }, "housenum-label");

  },

  // Milemarkers
  addMilemarkers(map) {
    const id = "milemarkers";

    if (hasSource(map, id)) {
      return;
    }
    addSource(map, id);

    map.addLayer({
      "id": id,
      "source": id,
      "type": "symbol",
      "layout": {
        "icon-image": "marker-11",
        "text-field": "{title} km",
        "text-anchor": "bottom",
        "text-size": 11.25
      }
    });
  }
};

export default layers;
