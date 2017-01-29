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
      "line-width": 4,
      "line-opacity": 0.6
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
      "line-cap": "round"
    },
    "paint": {
      "line-color": "#888888",
      "line-width": 8,
      "line-opacity": 0.6,
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
			"text-field": "{title}km",
			"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
			"text-offset": [0, 0],
			"text-anchor": "bottom"
		}
	});

};

export default layers;
