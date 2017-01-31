const pageformats = new Map();
pageformats.set('a0', [841, 1189])
  .set('a1', [594, 841])
  .set('a2', [420, 594])
  .set('a3', [297, 420])
  .set('a4', [210, 297])
  .set('a5', [148, 210])
  .set('a6', [105, 148])
  .set('letter', [216, 279])
  .set('legal', [216, 356])
  .set('tabloid', [279, 432]);

// MAX_RENDERBUFFER_SIZE -> max size in mm
// 2048  ->  55
// 4096  -> 110
// 8192  -> 221
// 16384 -> 443

const paperformat = {
  dimensions(format) {
    return pageformats.get(format);
  },
  validFormats(maxSize) {
    const formats = [];
    for (let [format, sizes] of pageformats) {
      if (Math.max(...sizes) <= maxSize) {
        formats.push(format);
      }
    }
    return formats;
  }
};

export default paperformat;
