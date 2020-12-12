import layers from "./layers.js";

class Printmap {
  constructor() {
    this.actualPixelRatio = window.devicePixelRatio;
    this.canceled = false;
  }

  setPixelRatio(dpi) {
    Object.defineProperty(window, "devicePixelRatio", {
      get: () => dpi / 96,
    });
  }

  resetPixelRatio() {
    Object.defineProperty(window, "devicePixelRatio", {
      get: () => this.actualPixelRatio,
    });
  }

  cancel() {
    console.log("Canceling");
    this.canceled = true;
  }

  generatePDF(map, options, progressfn) {
    // Calculate pixel ratio
    this.setPixelRatio(options.dpi);

    console.time("PDF generation");

    import("jspdf")
      .then((module) => {
        // initialise pdf. delete first page to simplify addImage-loop
        const pdf = new module.jsPDF({ compress: true });
        pdf.setFontSize(9);
        pdf.deletePage(1);

        // generate functions
        const loadMapImage = loadMap(map, options.format, options.margin);
        const addMapImage = addMap(pdf);

        let count = 0;
        const totalMaps = map.cutouts.features.length;
        progressfn(count, totalMaps);

        map.cutouts.features
          .reduce((sequence, feature) => {
            return sequence
              .then(() => {
                return this.canceled
                  ? Promise.reject(new Error("canceled by user"))
                  : loadMapImage(feature);
              })
              .then((image) => {
                progressfn(count++, totalMaps, this.canceled);
                addMapImage(image);
                console.log(`Generated map #${count}/${totalMaps}`);
              });
          }, Promise.resolve())
          .then(() => {
            if (!this.canceled) {
              const pdfname = `${map.name}.pdf`;
              console.log(`Saving ${pdfname}`);
              pdf.save(pdfname);
            }
          })
          .catch((e) => {
            console.log("PDF generation failed: " + e.name);
          })
          .then(() => {
            console.timeEnd("PDF generation");
            console.log("Clean up");
            progressfn(totalMaps, totalMaps, this.canceled);
            map.remove();
          });
      })
      .catch((e) => {
        console.log("PDF generation failed: " + e.name);
      });
  }
}

function loadMap(map, format, margin) {
  return (feature) => map.cutoutMap(feature, format, margin);
}

function addMap(pdf) {
  var count = 0;
  const copyright = "© Mapbox © OpenStreetMap";
  const factor = pdf.internal.getFontSize() / pdf.internal.scaleFactor;
  const copyrightWidth = pdf.getStringUnitWidth(copyright) * factor;

  return (img) => {
    pdf.addPage(img.format, img.orientation);
    pdf.addImage({
      imageData: img.data,
      x: img.margin,
      y: img.margin,
      w: img.width,
      h: img.height,
      compression: "FAST",
      alias: "map" + count++, // setting alias improves speed ~2x
    });
    let y = img.margin + img.height + factor;
    pdf.setTextColor(0, 0, 0);
    pdf.text(img.details(count), img.margin, y);
    pdf.setTextColor(105, 105, 105);
    pdf.text(copyright, img.margin + img.width - copyrightWidth, y);
  };
}

export default Printmap;
