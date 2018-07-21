import queryOverpass from "@derhuerst/query-overpass";

const mapping = {
  camping: { query: "tourism=camp_site", sym: "campsite-11" }
};

function queryPOI(bbox, tag) {
  return queryOverpass(query(bbox, tag))
    .then(elements => {
      let pois = [];
      elements.forEach(ele =>
        pois.push({
          coords: [ele.lon, ele.lat],
          props: {
            name: ele.tags.name || tag[0].toUpperCase() + tag.substr(1),
            symbol: mapping[tag].sym
          }
        })
      );
      return pois;
    })
    .catch(console.error);
}

function query(bbox, tag) {
  const box = [
    bbox.getSouth(),
    bbox.getWest(),
    bbox.getNorth(),
    bbox.getEast()
  ].join(",");

  return `\
    [out:json][timeout:25];
    node[${mapping[tag].query}](${box});
    out;`;
}

const overpass = {
  loadPOIs(features, tag) {
    const promises = [];
    features.forEach(feature => {
      promises.push(queryPOI(feature.bbox, tag));
    });

    return Promise.all(promises)
      .then(allElements => {
        return allElements.reduce((prev, cur) => {
          return prev.concat(cur);
        });
      })
      .catch(console.error);
  }
};

export default overpass;
