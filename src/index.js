import Printmap from './printmap.js';
import paperformat from './paperformat.js';
import Mapbox from './mapbox.js';
import FormValidator from './formvalidator.js';

let map;
const form = document.getElementById("config");
const generatePdfBtn = document.getElementById("generate-btn");
const validator = new FormValidator();
validator.enableWhenAllValid(generatePdfBtn);

// UI options
setPaperformatOptions();

// Preview map
try {
  map = new Mapbox({
    container: 'map',
    style: toStyleURI("outdoors"),
    center: [13.463, 47.386],
    zoom: 11
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
  validator.resetInvalidForms();
  toggleFormFields();
  map.clearTracks();
});

// map style
form.style.addEventListener('change', function() {
  map.style = toStyleURI(this.value);
});

// map scale
form.scale.addEventListener('change', () => reloadCutouts());
validator.add({form: form.scale, validity: v => v >= 5000,
  msg: "Scale must be 5000 or larger!"});

// paper format
form.paperformat.addEventListener('change', () => reloadCutouts());

// margin
form.margin.addEventListener('change', () => reloadCutouts());
validator.add({form: form.margin, validity: v => v >= 0 && v <= 50,
  msg: "Margin must be between 0 and 50!"});

// milemarkers
form.milemarkers.addEventListener('change', () =>
  map.updateMilemarkers(form.milemarkers.value));
validator.add({form: form.milemarkers, validity: v => v >= 0,
  msg: "Milemarkers must be 0 or larger!"});

// generate button
generatePdfBtn.addEventListener("click", generatePDF);

function loadTrack(file) {
  const filename = file.name;
  const reader = new FileReader();

  reader.onload = function() {
    let route = {};
    try {
      map.loadRoute(reader.result, filename);
    } catch (e) {
      showAlertBox("Converting " + filename + " failed. " + e);
      return;
    }

    // cutouts
    map.updateCutouts({scale: form.scale.value, format: form.paperformat.value,
      margin: form.margin.value, padding: 10});

    // milemarkers
    map.updateMilemarkers(form.milemarkers.value);

    // bounds
    map.updateBounds({padding: 10});

    // UI changes
    toggleFormFields();
    updateTrackDetails();
    form.trackFileName.value = map.routeName() || filename;
  };

  reader.readAsText(file);
}

function toggleFormFields() {
  // hide/unhide everything with class 'hidable'
  form.querySelectorAll('.hidable').forEach(field =>
    field.classList.toggle('hidden')
  );

  // disable/enable everything with class 'disableable'
  form.querySelectorAll('.disableable').forEach(field =>
    toggleField(field)
  );

  // generatePdfBtn
  toggleGenerateButtonField();
}

function toggleGenerateButtonField() {
  if (generatePdfBtn.hasAttribute("disabled")) {
    if (validator.allValid()) {
      generatePdfBtn.removeAttribute("disabled");
    }
  } else {
    generatePdfBtn.setAttribute("disabled", true);
  }
}

function toggleField(field) {
  if (field.hasAttribute("disabled")) {
    field.removeAttribute("disabled");
  } else {
    field.setAttribute("disabled", true);
  }
}

function updateTrackDetails(details) {
  let table = form.querySelector('#trackDetailsTable');
  table.innerHTML = "";
  for (let [k, v] of map.getDetails()) {
    let row = table.insertRow();
    row.insertCell(0).innerHTML = k;
    row.insertCell(1).innerHTML = v;
  }
}

function reloadCutouts() {
  if (validator.allValid()) {
    map.updateCutouts({scale: form.scale.value, format: form.paperformat.value,
      margin: form.margin.value, padding: 10});
    updateTrackDetails();
  }
}

function generatePDF() {
  const printmap = new Printmap();
  const progressbarUpdater = initProgressbarUpdater(printmap);

  printmap.generatePDF(
    map.copyTo('hidden-map'),
    { format: form.paperformat.value,
      margin: parseInt(form.margin.value, 10),
      dpi: 300
    }, progressbarUpdater
  );
}

function initProgressbarUpdater(printmap) {
  const progresstext = document.querySelector('#progress-text');
  const progressbar = document.querySelector('#progress-bar');
  const modal = document.querySelector("#modal");
  const modalOverlay = document.querySelector("#modal-overlay");
  const closeButton = document.querySelector("#cancel-button");

  modal.classList.remove("hidden");
  modalOverlay.classList.remove("hidden");

  closeButton.addEventListener("click", function() {
    printmap.cancel();
  });

  return function(currentItem, maxItems, isCanceled) {
    let percent = Math.trunc(100 / maxItems * (currentItem+1)) + "%";
    progressbar.style.width = percent;
    progressbar.innerHTML = percent;
    let text = `Map ${currentItem + 1} of ${maxItems}`;

    if (isCanceled) {
      text = "Canceling";
    }

    if (currentItem === maxItems) {
      modal.classList.add("hidden");
      modalOverlay.classList.add("hidden");
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

