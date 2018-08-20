"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (arr) {
  return arr.reduce(function (current, item) {
    current.numMapping[item] = (current.numMapping[item] || 0) + 1;
    var val = current.numMapping[item];
    if (val > current.greatestFreq) {
      current.greatestFreq = val;
      current.mode = item;
    }
    return current;
  }, { mode: null, greatestFreq: -Infinity, numMapping: {} }).mode;
};
//# sourceMappingURL=mode.js.map