var mapboxgl = require('mapbox-gl');
var mapboxToken = require('./mapboxToken.js');
mapboxgl.accessToken = mapboxToken();

//
// Helper
//

var toStyleURI = function(style) {
  return 'mapbox://styles/mapbox/' + style + '-v9?optimize=true';
}


//
// Input forms
//

var form = document.getElementById('config');
var trackData;

form.trackFile.addEventListener('change', function(e) {
  console.log("Load track");
  var reader = new FileReader();
  reader.onload = function(e) {
    trackData = JSON.parse(reader.result);
    addTrackLayer();
  }
  reader.readAsText(this.files[0]);
}, false);

form.style.addEventListener('change', function(e) {
  map.setStyle(toStyleURI(this.value));
});

form.scale.addEventListener('change', function() {
  console.log("Changed scale: " + this.value);
});

form.paperformat.addEventListener('change', function(e) {
  console.log("Changed paper format: " + this.value);
});


//
// Track layer
//

function addTrackLayer() {
  map.addSource('route', {
    type: 'geojson',
    data: trackData,
  });

  map.addLayer({
    "id": "route",
    "type": "line",
    "source": "route",
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

}

//
// Preview map
//

var map  = new mapboxgl.Map({
  container: 'map',
  center: [0, 0],
  zoom: 0.5,
  style: toStyleURI(form.style.value),
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(new mapboxgl.ScaleControl());
map.on('style.load', function() {
  if (trackData) addTrackLayer();
});

