var mapboxgl = require('mapbox-gl');
var mapboxToken = require('./mapboxToken.js');
mapboxgl.accessToken = mapboxToken();

//
// Interactive map
//

var map  = new mapboxgl.Map({
  container: 'map',
  center: [0, 0],
  zoom: 0.5,
  style: 'mapbox://styles/mapbox/outdoors-v9',
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(new mapboxgl.ScaleControl({maxWidth: 100, unit: 'metric',}));
