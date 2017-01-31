"use strict";

function hasSource(map, id) {
  return map.getSource(id);
}

function addSource(map, id) {
  map.addSource(id, {
    "type": 'geojson',
    "data": layers.emptyData
  });
}


var layers = {};

layers.emptyData = {
  "type": "FeatureCollection",
  "features": []
};

// Cutouts layer
layers.addCutouts = function(map) {
  var id = "cutouts";

  if (hasSource(map, id)) {
    return;
  }
  addSource(map, id);

  map.addLayer({
    "id": "cutouts",
    "source": id,
    "type": "line",
    "paint": {
      "line-color": "#222222",
      "line-width": 2,
      "line-offset": -2,
      "line-opacity": 0.6,
    }
  });
};

// Track layer
layers.addTrack = function(map) {
  var id = "track";

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
  });

};

// Milemarkers
layers.addMilemarkers = function(map) {
  var id = "milemarkers";

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
			"text-anchor": "bottom"
		}
	});
};

export default layers;
