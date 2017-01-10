'use strict';

const mapboxgl = require('mapbox-gl');
const trackTools = require('./trackTools.js');

mapboxgl.accessToken = require('./mapboxToken.js');

//
// Helper
//

var toStyleURI = function(style) {
  return 'mapbox://styles/mapbox/' + style + '-v9?optimize=true';
}

var alertBox = document.getElementById('alertbox');
alertBox.querySelector('.close').addEventListener('click', function() {
  alertBox.classList.add('hidden');
});

function showAlertBox(message) {
  var alert = alertBox.querySelector('#alert-msg');
  alert.innerHTML = message;
  alertBox.classList.remove('hidden');
}


//
// Input forms
//

var form = document.getElementById('config');


// track data

var track = {};
form.trackFile.addEventListener('change', function() {
  console.log("Load track");
  var reader = new FileReader();
  var filename = this.files[0].name;
  var ext = filename.split('.').pop().toLowerCase();

  reader.onload = function(e) {
    try {
      track.data = trackTools.togeojson(ext, reader.result);
    } catch (e) {
      showAlertBox("Converting " + filename + " failed. " + e);
      return;
    }
    track.data = trackTools.reduce(track.data)
    addTrackLayer();
    if (!track.bounds) {
      track.bounds = trackTools.bounds(track.data);
    }
    track.totalDistance = trackTools.totalDistance(track.data);
    console.log(track.totalDistance + "km");
    map.fitBounds(track.bounds, {padding: 10});
    toggleFileInputVisibility();
    form.trackFileName.value = filename;
  }

  reader.readAsText(this.files[0]);
});

form.querySelector('#trackField .input-group-addon').style.cursor = 'pointer';
form.querySelector('#trackField .input-group-addon').addEventListener('click', function() {
  toggleFileInputVisibility();
  map.removeLayer('route');
  map.removeSource('route');
})

function toggleFileInputVisibility() {
  form.querySelector('#trackBtn').classList.toggle('hidden');
  form.querySelector('#trackField').classList.toggle('hidden');
}

// map style

form.style.addEventListener('change', function(e) {
  map.setStyle(toStyleURI(this.value));
});

// map scale

form.scale.addEventListener('change', function() {
  console.log("Changed scale: " + this.value);
});

// paper format

form.paperformat.addEventListener('change', function(e) {
  console.log("Changed paper format: " + this.value);
});

//
// Track layer
//

function addTrackLayer() {
  console.log("addTrackLayer");
  map.addSource('route', {
    type: 'geojson',
    data: track.data,
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

var map;
try {
  map = new mapboxgl.Map({
    container: 'map',
    center: [0, 0],
    zoom: 0.5,
    style: toStyleURI(form.style.value)
  });
} catch(e) {
  showAlertBox("Initiating MapboxGL failed. " + e);
  return;
}
map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(new mapboxgl.ScaleControl());
map.on('style.load', function() {
  // reload existing tracklayer after switching styles
  if (track.data) {
    addTrackLayer();
  }
});

