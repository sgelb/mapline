const t = {
  // page content
  subtitle: {
    en: "Create maps along a track in print quality.",
    de: "Erstelle druckbare Karten entlang deiner Route."
  },
  track: {
    en: "Track",
    de: "Route"
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
    en: "Distance",
    de: "Länge"
  },
  track_ascent_descent: {
    en: "Ascent/Descent",
    de: "Auf- und Abstieg"
  },
  track_ascent: {
    en: "Ascent",
    de: "Aufstieg"
  },
  track_descent: {
    en: "Descent",
    de: "Abstieg"
  },
  track_min_max_elevation: {
    en: "Min/Max elevation",
    de: "Niedrigster/höchster Punkt"
  },
  map: {
    en: "Map",
    de: "Karte"
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
    en: "Scale",
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
    de: "Abstandsmarker"
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
    en: "Show POIs",
    de: "POIs anzeigen"
  },
  show_waypoints: {
    en: "Show GPX waypoints",
    de: "GPX-Wegpunkte anzeigen"
  },
  pois_header: {
    en:
      "Points of Interest. Downloading may take a while. Only the printable areas are searched for POIs. Toggle to refresh.",
    de:
      "Points of Interest. " +
      "Das Herunterladen kann etwas dauern, bitte Geduld. Es wird nur für die druckbaren Bereiche gesucht. " +
      "Zum Aktualisieren ab- und wieder anwählen."
  },
  generate: {
    en: "Generate PDF",
    de: "PDF erstellen"
  },
  generating_pdf: {
    en: "Generating PDF",
    de: "Erstelle PDF"
  },
  initializing: {
    en: "Initializing&hellip;",
    de: "Initialisiere&hellip;"
  },
  cancel: {
    en: "Cancel",
    de: "Abbrechen"
  },
  // messages
  msg_js_required: {
    en: "This site requires JavaScript",
    de: "Diese Seite benötigt JavaScript."
  },
  msg_render_a6: {
    en:
      "Your device can only render PDFs in A6. For larger formats, try a device with a better graphics card.",
    de:
      "Dein Rechner kann nur PDFs in A6 erstellen. Nutze ein Gerät mit besserer Grafikkarte für größere Formate."
  },
  msg_no_render: {
    en:
      "Sorry, your device can't render high-res maps. Please try a device with a better graphics card.",
    de:
      "Leider kann dein Gerät keine hochauflösenden Karten erstellen. Nutze ein Gerät mit besserer Grafikkarte."
  },
  msg_mapbox_error: {
    en: "I'm sorry, your browser ist not support by Mapline.",
    de: "Es tut uns leid, dein Browser wird von Mapline nicht unterstützt."
  },
  msg_canceling: {
    en: "Canceling",
    de: "Abbrechen"
  },
  msg_of: {
    en: "of",
    de: "von"
  },
  // validation messages
  validate_scale: {
    en: "Scale must be 1:5000 or larger!",
    de: "Maßstab muß mindestens 1:5000 betragen!"
  },
  validate_milemarkers: {
    en: "Milemarkers must be 0 or larger!",
    de: "Kilometersteine muß mindestens 0 betragen!"
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

class I18n {
  constructor() {
    this._defaultLanguage = "en";
    this._supportedLanguages = ["en", "de"];
    this._lang = this._getSupportedBrowserLanguage();
  }

  _getSupportedBrowserLanguage() {
    const lang = navigator.languages.find(lang =>
      this._supportedLanguages.includes(lang.substring(0, 2))
    );
    return lang === undefined ? this._defaultLanguage : lang.substring(0, 2);
  }

  _translateTitleFields(scope) {
    const title_trn = scope.querySelectorAll("[data-title-trn]");
    title_trn.forEach(item => {
      if (t[item.dataset.titleTrn] === undefined) {
        console.error("No translation for " + item.dataset.titleTrn);
      } else {
        item.setAttribute("title", this.translateString(item.dataset.titleTrn));
      }
    });
  }

  translateAll() {
    this.translate(document);
    this._translateTitleFields(document);
  }

  translate(scope) {
    const trn = scope.querySelectorAll("[data-trn]");
    trn.forEach(item => {
      if (t[item.dataset.trn] === undefined) {
        console.error("No translation for " + item.dataset.trn);
        return;
      }

      // FIXME: this breaks very easily, an <a> in the string is sufficient
      if (item.hasChildNodes()) {
        item.childNodes[0].nodeValue = this.translateString(item.dataset.trn);
        return;
      }

      item.innerHTML = this.translateString(item.dataset.trn);
    });
  }

  translateString(string) {
    return t[string][this._lang];
  }

  currentLanguage() {
    return this._lang;
  }
}

export default I18n;
