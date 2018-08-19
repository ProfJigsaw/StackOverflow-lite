'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (users, username) {
  var email = '';
  users.map(function (obj) {
    email = obj.username === username ? obj.email : email;
    return false;
  });
  return email;
};
//# sourceMappingURL=getUserEmail.js.map