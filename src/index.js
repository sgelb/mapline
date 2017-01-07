var mapboxgl = require('mapbox-gl');
var mapboxToken = require('./mapboxToken.js');
mapboxgl.accessToken = mapboxToken();

var form = document.getElementById('config');
var mapStyle = 'mapbox://styles/mapbox/' + form.style.value + '-v9?optimize=true';

//
// Preview map
//

var map  = new mapboxgl.Map({
  container: 'map',
  center: [0, 0],
  zoom: 0.5,
  style: mapStyle,
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(new mapboxgl.ScaleControl());
