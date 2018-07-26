const t = {
  // page content
  subtitle: {
    en: "Create maps along a track in print quality.",
    de: "Erstelle druckbare Karten entlang deiner Route."
  },
  js_required: {
    en: "This site requires JavaScript",
    de: "Diese Seite benötigt JavaScript."
  },
  track: {
    en: "Track"
  },
  example: {
    en: "Example",
    de: "Beispiel"
  },
  open_file: {
    en: "Open gpx or kml file",
    de: "Öffne gpx- oder kml-Datei"
  },
  track_length: {
    en: "Length",
    de: "Länge"
  },
  map_sheets: {
    en: "Map sheets",
    de: "Kartenteile"
  },
  map_style: {
    en: "Map style",
    de: "Kartenstil"
  },
  scale: {
    en: "scale",
    de: "Maßstab"
  },
  pdf_format: {
    en: "PDF format",
    de: "PDF-Format"
  },
  advanced: {
    en: "Advanced options",
    de: "Erweiterte Optionen"
  },
  milemarkers: {
    en: "Distance markers",
    de: "Kilometermarkierungen"
  },
  margin: {
    en: "Margin",
    de: "Rand"
  },
  dpi: {
    en: "Resolution",
    de: "Auflösung"
  },
  track_width: {
    en: "Track width",
    de: "Trackbreite"
  },
  track_color: {
    en: "Track color",
    de: "Trackfarbe"
  },
  pois: {
    en: "POIs"
  },
  show_waypoints: {
    en: "Show GPX waypoints",
    de: "GPX-Wegpunkte anzeigen"
  },
  pois_header: {
    en:
      "Points of Interest. " +
      'Downloaded via <a href="https://wiki.openstreetmap.org/wiki/Overpass_API">Overpass</a>, ' +
      "this may take a while. Only the printable areas are searched for POIs. Toggle to refresh.",
    de:
      "Points of Interest. " +
      'Das Herunterladen über <a href="https://wiki.openstreetmap.org/wiki/Overpass_API">Overpass</a> ' +
      "kann etwas dauern, bitte Geduld. Es wird nur für die druckbaren Bereiche gesucht. " +
      "Zum Aktualisieren ab- und wieder anwählen."
  },
  generate: {
    en: "Generate PDF",
    de: "PDF erstellen"
  },
  // error messages
  msg_render_a6: {
    en:
      "Your device can only render PDFs in A6. For larger formats, try a device with a better graphics card."
  },
  msg_no_render: {
    en:
      "Sorry, your device can't render high-res maps. Please try a device with a better graphics card."
  },
  // validation messages
  validate_scale: {
    en: "Scale must be 1:5000 or larger!",
    de: "Maßstab muß mindestens 1:5000 betragen!"
  },
  validate_milemarkers: {
    en: "Milemarkers must be 0 or larger!",
    de: "Kilometermarkierung muß mindestens 0 betragen!"
  },
  validate_margin: {
    en: "Margin must be between 0 and 50!",
    de: "Rand muß zwischen 0 - 50 sein!"
  },
  validate_dpi: {
    en: "Resolution must be larger than 0!",
    de: "Auflösung muß größer 0 sein!"
  },
  validate_width: {
    en: "Track width must be larger than 0!",
    de: "Die Trackbreite muß größer 0 sein!"
  },
  // poi titles
  atm: {
    en: "ATM/Bank",
    de: "Bank/-automat"
  },
  bakery: {
    en: "Bakery",
    de: "Bäckerei"
  },
  bike_shop: {
    en: "Bike shop",
    de: "Fahrradladen"
  },
  cafe: {
    en: "Café"
  },
  camping: {
    en: "Camping site",
    de: "Zeltplatz"
  },
  drinking_water: {
    en: "Drinking water",
    de: "Trinkwasser"
  },
  graveyard: {
    en: "Cemetery",
    de: "Friedhof"
  },
  hospitals: {
    en: "Hospital",
    de: "Krankenhaus"
  },
  information: {
    en: "Tourist information",
    de: "Touristinformation"
  },
  pharmacy: {
    en: "Pharmacy",
    de: "Apotheke"
  },
  picnic: {
    en: "Picnic site",
    de: "Picknickplatz"
  },
  restaurant: {
    en: "Restaurant"
  },
  shelter: {
    en: "Shelter",
    de: "Unterstand"
  },
  supermarket: {
    en: "Supermarket",
    de: "Supermarkt"
  }
};

const i18n = {
  translateAll() {
    this.translate(document);
  },

  translate(scope) {
    const lang = navigator.language.substring(0, 2);
    const defaultLang = "en";
    const trn = scope.querySelectorAll("[data-trn]");
    trn.forEach(item => {
      if (t[item.dataset.trn] === undefined) {
        console.error("No translation for " + item.dataset.trn);
      } else {
        item.innerHTML =
          t[item.dataset.trn][lang] || t[item.dataset.trn][defaultLang];
      }
    });
  },

  translateString(string) {
    const lang = navigator.language.substring(0, 2);
    const defaultLang = "en";
    return t[string][lang] || t[string][defaultLang];
  },

  translateTitleFields() {
    // <label data-trn="track" title="Load local gpx- or geojson file"</label>
  }
};

export default i18n;
