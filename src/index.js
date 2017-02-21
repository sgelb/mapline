import printmap from './printmap.js';
import paperformat from './paperformat.js';
import Mapbox from './mapbox.js';

let map;
const form = document.getElementById("config");
const generatePdfBtn = document.getElementById("generate-btn");

// UI options
setPaperformatOptions();

// Preview map
try {
  map = new Mapbox({
    container: 'map',
    style: toStyleURI("outdoors"),
    center: [0, 0],
    zoom: 1.5
  });
} catch(e) {
  showAlertBox("Initiating MapboxGL failed. " + e);
}

// UI

// track input button
form.trackFile.addEventListener('change', function() {
  loadTrack(this.files[0]);
  // reset value. otherwise, this listener is not triggered when the same track
  // file is chosen immediately again after removing it
  this.value = null;
});

// "remove track"-button. visible after chosing a track
form.querySelector('#remove-track').addEventListener('click', () => {
  toggleFileInputVisibility();
  map.clearTracks();
});

// map style
form.style.addEventListener('change', function() {
  map.style = toStyleURI(this.value);
});

// map scale
form.scale.addEventListener('change', () => reloadCutouts());

// paper format
form.paperformat.addEventListener('change', () => reloadCutouts());

// margin
form.margin.addEventListener('change', () => reloadCutouts());

// milemarkers
form.milemarkers.addEventListener('change', () => map.updateMilemarkers(form.milemarkers.value));

// generate button
generatePdfBtn.setAttribute("disabled", true);
generatePdfBtn.addEventListener("click", generatePDF);


function loadTrack(file) {
  const filename = file.name;
  const reader = new FileReader();

  reader.onload = function() {
    let route = {};
    try {
      let ext = filename.split('.').pop().toLowerCase();
      map.loadRoute(reader.result, ext);
    } catch (e) {
      showAlertBox("Converting " + filename + " failed. " + e);
      return;
    }

    // cutouts
    map.updateCutouts({scale: form.scale.value, format: form.paperformat.value,
      margin: form.margin.value});

    // milemarkers
    map.updateMilemarkers(form.milemarkers.value);

    // bounds
    map.updateBounds({padding: 10});

    // UI changes
    toggleFileInputVisibility();
    form.trackFileName.value = map.routeName() || filename;
  };

  reader.readAsText(file);
}

function toggleFileInputVisibility() {
  form.querySelector('#trackBtn').classList.toggle('hidden');
  form.querySelector('#trackField').classList.toggle('hidden');
  if (generatePdfBtn.hasAttribute("disabled")) {
    generatePdfBtn.removeAttribute("disabled");
  } else {
    generatePdfBtn.setAttribute("disabled", true);
  }
}

function reloadCutouts() {
  map.updateCutouts({scale: form.scale.value, format: form.paperformat.value,
    margin: form.margin.value});
}

function generatePDF() {
  // TODO: validate if all neccessary inputs are valid
  const progressbarUpdater = initProgressbarUpdater();
  printmap.generatePDF(
    map.copyTo('hidden-map'),
    { format: form.paperformat.value,
      margin: parseInt(form.margin.value, 10),
      dpi: 300
    }, progressbarUpdater);
}

function initProgressbarUpdater() {
  const progress = generatePdfBtn.querySelector('#progress');
  const progresstext = generatePdfBtn.querySelector('#progress-text');
  progress.classList.remove('hidden');

  return function(currentItem, maxItems) {
    let text = "Generating ... " + Math.trunc(100 / maxItems * currentItem) + "%";
    if (currentItem === maxItems) {
      text = "Generate PDF";
      progress.classList.add('hidden');
    }
    progresstext.innerHTML = text;
  };
}

function setPaperformatOptions() {
  // XXX: this seems to work and i think it's correct, but i do not know for sure
  // http://webglstats.com/webgl/parameter/MAX_RENDERBUFFER_SIZE

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext('experimental-webgl');
  // maxSize in mm = (max renderbuffer in mm) / new devicePixelRatio
  const maxSize = (25.4 * (gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) / 300 ) / (300 / 96);
  const validFormats = paperformat.validFormats(maxSize);

  if (validFormats.length < 2) {
    showAlertBox(`Sorry, you can only create maps in ${capitalize(validFormats[0])}
    format. Try a computer with a more powerful graphics card for more formats.`);
  }

  const paperform = form.paperformat;
  paperform.remove(0);  // remove placeholder option
  validFormats.forEach(function(format) {
    let option = document.createElement("option");
    option.text = capitalize(format);
    option.value = format;
    paperform.add(option);
  });
  // if available, set a5 as default. otherwise, use last (smallest) entry
  paperform.value = validFormats.includes("a5") ? "a5" :
    validFormats[validFormats.length - 1];
}

// Helper functions

function toStyleURI(style) {
  return 'mapbox://styles/mapbox/' + style + '-v9?optimize=true';
}

function showAlertBox(message) {
  const alertBox = document.getElementById('alertbox');
  alertBox.querySelector('.close').addEventListener('click', function() {
    alertBox.classList.add('hidden');
  });

  const alert = alertBox.querySelector('#alert-msg');
  alert.innerHTML = message;
  alertBox.classList.remove('hidden');
}

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}
