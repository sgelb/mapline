"use strict";


const paperformats = {
  "a3": [ 297, 420 ],
  "a4": [ 210, 297 ],
  "a5": [ 148, 210 ],
  "a6": [ 104, 148 ],
  "letter": [ 210, 279 ],
  "legal": [ 216, 356 ]
};


var paperformat = {
  dimensions: function(format) {
    return paperformats[format];
  }
}

export default paperformat;
