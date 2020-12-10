const pageformats = new Map();
pageformats.set("a0", [841, 1189]);
pageformats.set("a1", [594, 841]);
pageformats.set("a2", [420, 594]);
pageformats.set("a3", [297, 420]);
pageformats.set("a4", [210, 297]);
pageformats.set("a5", [148, 210]);
pageformats.set("a6", [105, 148]);
pageformats.set("tabloid", [279, 432]);
pageformats.set("legal", [216, 356]);
pageformats.set("letter", [216, 279]);

const paperformat = {
  dimensions(format, margin = 0, orientation = "p") {
    let [w, h] = pageformats.get(format).map((x) => (x -= 2 * margin));
    if (orientation === "l") {
      [w, h] = [h, w];
    }
    return [w, h];
  },

  validFormats(maxArea) {
    const formats = [];
    for (let [format, sizes] of pageformats) {
      if (sizes[0] * sizes[1] <= maxArea) {
        formats.push(format);
      }
    }
    return formats;
  },
};

export default paperformat;
