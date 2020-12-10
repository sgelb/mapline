import queryOverpass from "@derhuerst/query-overpass";

// For queries, see https://wiki.openstreetmap.org/wiki/
// All icon names from https://www.mapbox.com/maki-icons/ are valid sym names
// The menu entries for POIs are automatically generated from this Map.
const mapping = new Map();
mapping.set("atm", {
  query: "amenity~'atm|bank'",
  sym: "bank-11",
});
mapping.set("bakery", {
  query: "shop=bakery",
  sym: "bakery-11",
});
mapping.set("bike_shop", {
  query: "shop=bicycle",
  sym: "bicycle-11",
});
mapping.set("cafe", {
  query: "amenity=cafe",
  sym: "cafe-11",
});
mapping.set("camping", {
  query: "tourism=camp_site",
  sym: "campsite-11",
});
mapping.set("drinking_water", {
  query: "amenity=drinking_water",
  sym: "drinking-water-11",
});
mapping.set("graveyard", {
  query: "landuse=cemetery][amenity=grave_yard",
  sym: "cemetery-11",
});
mapping.set("hospitals", {
  query: "amenity=hospital",
  sym: "hospital-11",
});
mapping.set("information", {
  query: "information=office",
  sym: "information-11",
});
mapping.set("pharmacy", {
  query: "amenity=pharmacy",
  sym: "pharmacy-11",
});
mapping.set("picnic", {
  query: "tourism=picnic_site",
  sym: "picnic-site-11",
});
mapping.set("restaurant", {
  query: "amenity=restaurant",
  sym: "restaurant-11",
});
mapping.set("shelter", {
  query: "amenity=shelter",
  sym: "shelter-11",
});
mapping.set("supermarket", {
  query: "shop~'supermarket|convenience'",
  sym: "grocery-11",
});

function queryPOI(bbox, tag) {
  if (!mapping.has(tag)) {
    throw new Error("Tag " + tag + " unknown");
  }

  return queryOverpass(query(bbox, tag), { fetchmode: "cors" })
    .then((elements) => {
      let pois = [];
      elements.forEach((ele) =>
        pois.push({
          coords: [ele.lon, ele.lat],
          props: {
            name: ele.tags.name || tag[0].toUpperCase() + tag.substr(1),
            symbol: mapping.get(tag).sym,
          },
        })
      );
      return pois;
    })
    .catch((e) => {
      throw e;
    });
}

function query(bbox, tag) {
  const box = [
    bbox.getSouth(),
    bbox.getWest(),
    bbox.getNorth(),
    bbox.getEast(),
  ].join(",");

  return `\
    [out:json][timeout:25];
    node[${mapping.get(tag).query}](${box});
    out;`;
}

const overpass = {
  loadPOIs(features, tag) {
    const promises = [];
    features.forEach((feature) => {
      promises.push(queryPOI(feature.bbox, tag));
    });

    return Promise.all(promises)
      .then((allElements) => {
        return allElements.reduce((prev, cur) => {
          return prev.concat(cur);
        });
      })
      .catch((e) => {
        throw e;
      });
  },

  mapping() {
    return mapping;
  },
};

export default overpass;
