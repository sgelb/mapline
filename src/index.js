'use strict';

const mapboxgl = require('mapbox-gl');
const trackUtils = require('./trackutils.js');
const mapcutter = require('./mapcutter.js');

mapboxgl.accessToken = require('./mapboxtoken.js');

if (!mapboxgl.supported()) {
  showAlertBox("Sorry, your browser does not support Mapbox GL JS.");
}

//
// Input forms
//
var form = document.getElementById("config");
var generatePdfBtn = document.getElementById("generate-btn");

// Track

var track = {};
form.trackFile.addEventListener('change', function() {
  loadTrack(this.files[0]);
});

var emptyData = {
  "type": "FeatureCollection",
  "features": []
};


function loadTrack(file) {
  console.log("Load track");
  var reader = new FileReader();
  var filename = file.name;
  var ext = filename.split('.').pop().toLowerCase();

  reader.onload = function() {
    try {
      track.data = trackUtils.togeojson(ext, reader.result);
    } catch (e) {
      showAlertBox("Converting " + filename + " failed. " + e);
      return;
    }

    // track
    track.data = trackUtils.reduce(track.data)
    map.getSource("track").setData(track.data);

    // cutouts
    track.cutouts = mapcutter.featurecollection(track.data, form.scale.value,
      form.paperformat.value);
    map.getSource("cutouts").setData(track.cutouts);

    // bounds
    if (!track.bounds) {
      track.bounds = trackUtils.bounds(track.cutouts);
    }
    map.fitBounds(track.bounds, {padding: 10});

    // track info
    track.totalDistance = trackUtils.totalDistance(track.data);
    console.log(track.totalDistance + "km");

    // UI change
    toggleFileInputVisibility();
    form.trackFileName.value = filename;

  };

  reader.readAsText(file);

}

form.querySelector('#trackField .input-group-addon').style.cursor = 'pointer';
form.querySelector('#trackField .input-group-addon').addEventListener('click', function() {
  toggleFileInputVisibility();
  // remove track data
  map.getSource("track").setData(emptyData);
  map.getSource("cutouts").setData(emptyData);
})

function toggleFileInputVisibility() {
  form.querySelector('#trackBtn').classList.toggle('hidden');
  form.querySelector('#trackField').classList.toggle('hidden');
  if (generatePdfBtn.hasAttribute("disabled")) {
    generatePdfBtn.removeAttribute("disabled");
  } else {
    generatePdfBtn.setAttribute("disabled", true);
  }
}

// map style

form.style.addEventListener('change', function() {
  map.setStyle(toStyleURI(this.value));
});

// map scale

form.scale.addEventListener('change', function() {
  if (track.data) {
    track.cutouts = mapcutter.featurecollection(track.data, form.scale.value,
      form.paperformat.value);
    map.getSource("cutouts").setData(track.cutouts);
  }
});

// paper format

form.paperformat.addEventListener('change', function() {
  if (track.data) {
    track.cutouts = mapcutter.featurecollection(track.data, form.scale.value,
      form.paperformat.value);
    map.getSource("cutouts").setData(track.cutouts);
  }
});

// generate button
generatePdfBtn.setAttribute("disabled", true);
generatePdfBtn.addEventListener("click", generatePDF);

function generatePDF() {
  console.log("TODO: generate PDF");
}

// Cutouts layer
function addCutoutsLayer() {
  map.addSource("cutouts", {
    "type": "geojson",
    "data": emptyData
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
}

// Track layer
function addTrackLayer() {
  map.addSource('track', {
    type: 'geojson',
    "data": emptyData
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
  // (re-)load custom layers
  addTrackLayer();
  addCutoutsLayer();

  if (track.data) {
    map.getSource("track").setData(track.data);
  }
  if (track.cutouts) {
    map.getSource("cutouts").setData(track.cutouts);
  }
});

map.on("mousedown", function(e) {
  var features = map.queryRenderedFeatures(e.point, {layers: ['cutouts-fill']});
  if (features.length) {
    document.getElementById("info").innerHTML =
    JSON.stringify(features[0].geometry.coordinates, null, 2);
  }
});

//
// Helper
//

function toStyleURI(style) {
  return 'mapbox://styles/mapbox/' + style + '-v9?optimize=true';
}

function showAlertBox(message) {
  var alertBox = document.getElementById('alertbox');
  alertBox.querySelector('.close').addEventListener('click', function() {
    alertBox.classList.add('hidden');
  });

  var alert = alertBox.querySelector('#alert-msg');
  alert.innerHTML = message;
  alertBox.classList.remove('hidden');
}

