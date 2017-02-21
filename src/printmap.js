import jspdf from 'jspdf';
import layers from './layers.js';

function timer(name) {
  const start = performance.now();
  return {
    stop() {
      const end  = performance.now();
      console.log(
        (name + " ".repeat(15)).slice(0, 15),
        (" ".repeat(6) + Math.trunc(end - start)).slice(-6), 'ms');
    }
  };
}

const printmap = {

  setPixelRatio(dpi) {
    this.actualPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => dpi / 96
    });
  },

  resetPixelRatio() {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => this.actualPixelRatio
    });
  },

  generatePDF(map, options, progressfn) {
    // Calculate pixel ratio
    this.setPixelRatio(options.dpi);

    let totalTime = timer("PDF generation");

    // initialise pdf. delete first page to simplify addImage-loop
    const pdf = new jspdf({compress: true});
    pdf.deletePage(1);

    // generate functions
    const loadMapImage = loadMap(map, options.format, options.margin);
    const addMapImage = addMap(pdf);

    let count = 0;
    const totalMaps = map.cutouts.features.length;
    progressfn(count, totalMaps);

    map.cutouts.features.reduce(
      (sequence, feature) => {
        return sequence
          .then(() => loadMapImage(feature))
          .then((image) => {
          let t = timer("Load map image");
          addMapImage(image);
          t.stop();
          progressfn(count++, totalMaps);
        });
      }, Promise.resolve())
      .then(() => {
        let t = timer("Save PDF");
        pdf.save();
        progressfn(totalMaps, totalMaps);
        map.remove();
        t.stop();
        totalTime.stop();
        this.resetPixelRatio();
      });
  }
};

function loadMap(map, format, margin) {
  return (feature) => map.cutoutMap(feature, format, margin);
}

function addMap(pdf) {
  var count = 0;
  return (img) => {
    pdf.addPage(img.format, img.orientation);
    pdf.addImage({
      imageData: img.data,
      x: img.margin,
      y: img.margin,
      w: img.width,
      h: img.height,
      compression: 'FAST',
      alias: "map" + count++  // setting alias improves speed ~2x
    });
  };
}

export default printmap;

