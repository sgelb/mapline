import FormValidator from "./formvalidator.js";
import Mapbox from "./mapbox.js";
import Printmap from "./printmap.js";
import I18n from "./i18n.js";
import overpass from "./overpass.js";
import paperformat from "./paperformat.js";
import exampleGpx from "../assets/example.gpx";

let map;
const form = document.getElementById("config");
const generatePdfBtn = document.getElementById("generate-btn");
const validator = new FormValidator();
const i18n = new I18n();

(function() {
  // Preview map
  try {
    map = new Mapbox({
      container: "map",
      style: toStyleURI("outdoors"),
      center: [14.8, 47.5],
      zoom: 7,
      hash: true
    });
    setPaperformatOptions();
  } catch (e) {
    document.getElementById("main").classList.add("hidden");
    showAlertBox(e.message);
    return;
  }

  validator.enableWhenAllValid(generatePdfBtn);
  initUI();
})();

function initUI() {
  // load example gpx file
  document.getElementById("example-gpx").addEventListener("click", () => {
    if (map.name) {
      validator.resetInvalidForms();
      toggleFormFields();
      map.clearTracks();
    }
    const xhr = new XMLHttpRequest();
    xhr.open("GET", exampleGpx, true);
    xhr.onload = function(e) {
      if (this.status == 200) {
        loadTrack(new Blob([this.response]), "example.gpx");
      }
    };
    xhr.send();
  });

  // track input button
  form.trackFile.addEventListener("change", function() {
    loadTrack(this.files[0]);
    // reset value. otherwise, this listener is not triggered when the same track
    // file is chosen immediately again after removing it
    this.value = null;
  });

  // "remove track"-button. visible after chosing a track
  form.querySelector("#remove-track").addEventListener("click", () => {
    map.name = "";
    validator.resetInvalidForms();
    toggleFormFields();
    map.clearTracks();
  });

  // map style
  form.style.addEventListener("change", function() {
    map.style = toStyleURI(this.value);
  });

  // map scale
  form.scale.addEventListener("change", () => reloadCutouts());
  validator.add({
    form: form.scale,
    validity: v => v >= 5000,
    msg: i18n.translateString("validate_scale")
  });

  // paper format
  form.paperformat.addEventListener("change", () => reloadCutouts());

  // milemarkers
  form.milemarkers.addEventListener("change", () =>
    map.updateMilemarkers(form.milemarkers.value)
  );
  validator.add({
    form: form.milemarkers,
    validity: v => v >= 0,
    msg: i18n.translateString("validate_milemarkers")
  });

  // margin
  form.margin.addEventListener("change", () => reloadCutouts());
  validator.add({
    form: form.margin,
    validity: v => v >= 0 && v <= 50,
    msg: i18n.translateString("validate_margin")
  });

  // dpi
  form.dpi.addEventListener("change", () => {
    setPaperformatOptions();
    reloadCutouts();
  });
  validator.add({
    form: form.dpi,
    validity: v => v > 0,
    msg: i18n.translateString("validate_dpi")
  });

  // track width
  form.trackWidth.addEventListener("change", () =>
    map.changeTrackStyle({
      property: "line-width",
      value: parseInt(form.trackWidth.value, 10)
    })
  );
  validator.add({
    form: form.trackWidth,
    validity: v => v > 0,
    msg: i18n.translateString("validate_width")
  });

  // track color
  form.trackColor.addEventListener("change", () =>
    map.changeTrackStyle({
      property: "line-color",
      value: form.trackColor.value
    })
  );

  // show waypoints
  form.showWaypoints.addEventListener("change", () =>
    map.toggleVisibility("waypoints", form.showWaypoints.checked)
  );

  // overpass checkboxes
  generateOverpassEntries();
  Array.from(
    document.getElementById("overpass").getElementsByTagName("input")
  ).forEach(field => {
    field.addEventListener("change", () => {
      map.loadPOIs(field.dataset.tag, field.checked);
    });
  });

  // generate button
  generatePdfBtn.addEventListener("click", generatePDF);

  // translation
  i18n.translateAll();
}

function generateOverpassEntries() {
  let count = 0;
  let overpassEntries = '<div class="row">';
  overpass.mapping().forEach((props, tag) => {
    overpassEntries += `<div class="col form-check form-check-inline">
      <input id="${tag}" data-tag="${tag}" type="checkbox" class="form-check-input disableable" disabled>
      <label class="form-check-label" for="${tag}" data-trn="${tag}"></label>
      </div>
      `;
    if (count++ % 2) {
      overpassEntries += '</div><div class="row">';
    }
  });
  overpassEntries += "</div>";

  document.getElementById("overpass").innerHTML = overpassEntries;
}

function loadTrack(file, fname) {
  const filename = fname || file.name;
  const reader = new FileReader();

  reader.onload = function() {
    let route = {};
    try {
      map.loadRoute(reader.result, filename);
    } catch (e) {
      showAlertBox("Loading " + filename + " failed. " + e.message);
      return;
    }

    // cutouts
    map.updateCutouts({
      scale: form.scale.value,
      format: form.paperformat.value,
      margin: form.margin.value,
      padding: 10
    });

    // milemarkers
    map.updateMilemarkers(form.milemarkers.value);

    // bounds
    map.updateBounds({
      padding: 10
    });

    // UI changes
    toggleFormFields();
    updateTrackDetails();
    form.trackFileName.value = map.routeName() || filename;
  };

  reader.readAsText(file);
}

function toggleFormFields() {
  toggleHiddenForm(".hidable");

  // disable/enable everything with class 'disableable'
  form.querySelectorAll(".disableable").forEach(field => toggleField(field));

  // generatePdfBtn
  toggleGenerateButtonField();
}

function toggleHiddenForm(id) {
  form.querySelectorAll(id).forEach(field => {
    field.classList.toggle("hidden");
  });
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
  let table = form.querySelector("#trackDetailsTable");
  table.innerHTML = "";
  for (let [k, v] of map.getDetails()) {
    let row = table.insertRow();
    row.insertCell(0).dataset.trn = k;
    row.insertCell(1).innerHTML = v;
  }
  i18n.translate(table);
}

function reloadCutouts() {
  if (validator.allValid()) {
    map.updateCutouts({
      scale: form.scale.value,
      format: form.paperformat.value,
      margin: form.margin.value,
      padding: 10
    });
    updateTrackDetails();
  }
}

function generatePDF() {
  const printmap = new Printmap();
  const progressbarUpdater = initProgressbarUpdater(printmap);

  printmap.generatePDF(
    map.copyTo("hidden-map"),
    {
      format: form.paperformat.value,
      margin: parseInt(form.margin.value, 10),
      dpi: parseInt(form.dpi.value, 10)
    },
    progressbarUpdater
  );
}

function initProgressbarUpdater(printmap) {
  const progresstext = document.querySelector("#progress-text");
  const progressbar = document.querySelector("#progress-bar");
  const modal = document.querySelector("#modal");
  const modalOverlay = document.querySelector("#modal-overlay");
  const closeButton = document.querySelector("#cancel-button");

  modal.classList.remove("hidden");
  modalOverlay.classList.remove("hidden");

  closeButton.addEventListener("click", function() {
    printmap.cancel();
  });

  return function(currentItem, maxItems, isCanceled) {
    let percent = Math.trunc((100 / maxItems) * (currentItem + 1)) + "%";
    progressbar.style.width = percent;
    progressbar.innerHTML = percent;
    let text = i18n.translateString("map");
    text += ` ${currentItem + 1} ${i18n.translateString("msg_of")} ${maxItems}`;

    if (isCanceled) {
      text = i18n.translateString("msg_canceling");
    }

    if (currentItem === maxItems) {
      modal.classList.add("hidden");
      modalOverlay.classList.add("hidden");
    }

    progresstext.innerHTML = text;
  };
}

function setPaperformatOptions() {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  // Engines may set limits to maximum size of canvas dimensions are area, e.g.
  // - WebKit limits length of width and height to 4096
  // - Blink limits to area of 4096*4096, allowing lengths larger than 4096
  // - Gecko and EdgeHTML?

  // For now, we go with Blink's limit, see
  // src.chromium.org/viewvc/blink/trunk/Source/modules/webgl/WebGLRenderingContextBase.cpp?pathrev=202517#l1286
  // TODO: factor paper margins into calculation of maxSize. this may enable a3 for sufficient margins.

  const maxBuffer = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

  if (maxBuffer < 2048) {
    throw new Error(i18n.translateString("msg_no_render"));
  }

  if (maxBuffer === 2048) {
    showAlertBox(i18n.translateString("msg_render_a6"));
  }

  const maxSize =
    (25.4 * Math.min(maxBuffer, 4096)) / parseInt(form.dpi.value, 10);
  const validFormats = paperformat.validFormats(maxSize * maxSize);

  const paperform = form.paperformat;
  paperform.options.length = 0; // remove placeholder option
  validFormats.forEach(format => {
    let option = document.createElement("option");
    option.text = capitalize(format);
    option.value = format;
    paperform.add(option);
  });

  // if available, set a5 as default. otherwise, use last entry
  paperform.value =
    validFormats.indexOf("a5") >= 0
      ? "a5"
      : validFormats[validFormats.length - 1];
}

// Helper functions

function showAlertBox(message) {
  const alertBox = document.getElementById("alertbox");
  alertBox.querySelector(".close").addEventListener("click", function() {
    alertBox.classList.add("hidden");
  });

  const alert = alertBox.querySelector("#alert-msg");
  alert.innerHTML = message;
  alertBox.classList.remove("hidden");
}

function toStyleURI(style) {
  const enableOptimize = i18n.currentLanguage() === "en";
  switch (style) {
    case "streets":
    case "outdoors":
    case "satellite-streets":
      return (
        "mapbox://styles/mapbox/" + style + "-v10?optimize=" + enableOptimize
      );
    case "navigation-guidance-day":
    case "navigation-guidance-night":
      return (
        "mapbox://styles/mapbox/" + style + "-v2?optimize=" + enableOptimize
      );
    default:
      return (
        "mapbox://styles/mapbox/" + style + "-v9?optimize=" + enableOptimize
      );
  }
}

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}
