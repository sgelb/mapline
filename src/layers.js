"use strict";

var layers = {};

layers.emptyData = {
  "type": "FeatureCollection",
  "features": []
};

// Cutouts layer
layers.addCutouts = function(map) {
  map.addSource("cutouts", {
    "type": "geojson",
    "data": layers.emptyData
  });

  map.addLayer({
    "id": "cutouts-outline",
    "type": "line",
    "source": "cutouts",
    "layout": {
      "line-join": "round"
    },
    "paint": {
      "line-color": "#ffcocb",
      "line-width": 8,
      "line-opacity": 0.6
    }
  });

  map.addLayer({
    "id": "cutouts-fill",
    "type": "fill",
    "source": "cutouts",
    "paint": {
      "fill-opacity": 0
    }
  });
};

// Track layer
layers.addTrack = function(map) {
  map.addSource('track', {
    "type": 'geojson',
    "data": layers.emptyData
  });

  map.addLayer({
    "id": "track",
    "type": "line",
    "source": "track",
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
  map.addSource('milemarkers', {
    "type": "geojson",
    "data": layers.emptyData  
  });

	map.addLayer({
		"id": "milemarkers",
		"type": "symbol",
    "source": "milemarkers",
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
