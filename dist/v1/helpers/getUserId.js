"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (users, username) {
  var id = 0;
  users.map(function (obj) {
    id = obj.username === username ? obj.userId : id;
    return false;
  });
  return id;
};
//# sourceMappingURL=getUserId.js.map