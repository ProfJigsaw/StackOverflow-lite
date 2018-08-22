"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (arrayOfObjects, key) {
  var max = 0;
  arrayOfObjects.map(function (obj) {
    max = obj[key] > max ? obj[key] : max;
    return false;
  });
  return max + 1;
};
//# sourceMappingURL=genUniqueId.js.map