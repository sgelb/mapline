'use strict';

import mapboxgl from 'mapbox-gl';
import layers from './layers.js';
import mapcutter from './mapcutter.js';
import printmap from './printmap.js';
import token from './mapboxtoken.js';
import trackutils from './trackutils.js';
import paperformat from './paperformat.js';

mapboxgl.accessToken = token;

if (!mapboxgl.supported()) {
  showAlertBox("Sorry, your browser does not support Mapbox GL JS.");
}

//
// user input
//

var form = document.getElementById("config");


// Track

var track = {};
form.trackFile.addEventListener('change', function() {
  loadTrack(this.files[0]);
});

form.trackFile.addEventListener('click', function() {
  this.value = null;
});


function loadTrack(file) {
  console.log("Load track");
  var reader = new FileReader();
  var filename = file.name;
  var ext = filename.split('.').pop().toLowerCase();

  reader.onload = function() {
    try {
      track.data = trackutils.togeojson(ext, reader.result);
    } catch (e) {
      showAlertBox("Converting " + filename + " failed. " + e);
      return;
    }

    // track
    track.data = trackutils.reduce(track.data)
    map.getSource("track").setData(track.data);

    // cutouts
    track.cutouts = mapcutter.featurecollection(track.data, {
      scale: form.scale.value, format: form.paperformat.value,
      margin: form.margin.value});
    map.getSource("cutouts").setData(track.cutouts);

    // milemarkers
    track.milemarkers = trackutils.milemarkers(track.data, form.milemarkers.value);
    map.getSource("milemarkers").setData(track.milemarkers);

    // bounds
    track.bounds = trackutils.bounds(track.cutouts);
    map.fitBounds(track.bounds, {padding: 10});

    // track info
    track.totalDistance = trackutils.totalDistance(track.data);
    console.log(track.totalDistance + "km");

    // UI changes
    toggleFileInputVisibility();
    form.trackFileName.value = track.data.features[0].properties.name || filename;
  };

  reader.readAsText(file);

}

form.querySelector('#trackField .input-group-addon').style.cursor = 'pointer';
form.querySelector('#trackField .input-group-addon').addEventListener('click', function() {
  toggleFileInputVisibility();
  delete track.data;
  map.getSource("track").setData(layers.emptyData);
  map.getSource("cutouts").setData(layers.emptyData);
  map.getSource("milemarkers").setData(layers.emptyData);
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
  reloadCutouts();
});

// paper format
form.paperformat.addEventListener('change', function() {
  reloadCutouts();
});

function setPaperformatOptions() {
  const gl = map.getCanvas().getContext("webgl") ||
    map.getCanvas().getContext('experimental-webgl');

  // XXX: this seems to work and i think it's correct, but i do not know for sure
  // maxSize in mm = (max renderbuffer in mm) / new devicePixelRatio
  // http://webglstats.com/webgl/parameter/MAX_RENDERBUFFER_SIZE
  const maxSize = ((gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) / 300 * 25.4) / (300 / 96);
  const validFormats = paperformat.validFormats(maxSize);

  if (validFormats.length < 2) {
    showAlertBox(`Sorry, you can only create maps in ${capitalize(validFormats[0])}
    format. Try a computer with a more powerful graphics card for more formats.`);
  }

  form.paperformat.remove(0);  // remove placeholder option
  validFormats.forEach(function(format) {
    const option = document.createElement("option");
    option.text = capitalize(format);
    option.value = format;
    form.paperformat.add(option);
  });
  form.paperformat.value = validFormats.includes("a5") ? "a5" : 
    validFormats[validFormats.length - 1];
}


// milemarkers
form.milemarkers.addEventListener('change', function() {
  if (track.data) {
    track.milemarkers = trackutils.milemarkers(track.data, form.milemarkers.value);
    map.getSource("milemarkers").setData(track.milemarkers);
  }
});

// margin
form.margin.addEventListener('change', function() {
  reloadCutouts();
});

function reloadCutouts() {
  if (track.data) {
    track.cutouts = mapcutter.featurecollection(track.data, {
      scale: form.scale.value, format: form.paperformat.value,
      margin: form.margin.value});
    map.getSource("cutouts").setData(track.cutouts);
  }
}

// generate button
var generatePdfBtn = document.getElementById("generate-btn");
generatePdfBtn.setAttribute("disabled", true);
generatePdfBtn.addEventListener("click", generatePDF);

function generatePDF() {
  // TODO: validate if all neccessary inputs are valid
  var progressbarUpdater = initProgressbarUpdater();
  printmap.generatePDF(track,
    { style: toStyleURI(form.style.value),
      format: form.paperformat.value,
      margin: parseInt(form.margin.value, 10),
      dpi: 300
    }, progressbarUpdater);
};

function initProgressbarUpdater() {
  const progress = generatePdfBtn.querySelector('#progress');
  const progresstext = generatePdfBtn.querySelector('#progress-text');
  progress.classList.remove('hidden');

  return function(currentItem, maxItems) {
    let text = "Generating ... " + Math.trunc(100 / maxItems * currentItem) + "%";

    if (currentItem === maxItems) {
      text = "Generate PDF"
      progress.classList.add('hidden');
    }
    progresstext.innerHTML = text;
  };
}


//
// Preview map
//

var map;
try {
  map = new mapboxgl.Map({
    container: 'map',
    style: toStyleURI(form.style.value),
    center: [0, 0],
    zoom: 1.5
  });
} catch(e) {
  showAlertBox("Initiating MapboxGL failed. " + e);
}

setPaperformatOptions();

map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(new mapboxgl.ScaleControl());

map.on('styledata', function() {
  layers.addTrack(map);
  layers.addCutouts(map);
  layers.addMilemarkers(map);

  if (track.data) {
    map.getSource("track").setData(track.data);
  }
  if (track.cutouts) {
    map.getSource("cutouts").setData(track.cutouts);
  }
  if (track.milemarkers) {
    map.getSource("milemarkers").setData(track.milemarkers);
  }
});

//
// Helper functions
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

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}
