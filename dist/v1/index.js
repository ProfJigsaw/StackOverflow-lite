'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require('./controllers/index');

var _index2 = _interopRequireDefault(_index);

var _questions = require('./controllers/questions');

var _questions2 = _interopRequireDefault(_questions);

var _users = require('./controllers/users');

var _users2 = _interopRequireDefault(_users);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (app) {
  app.use('/api/v1', _index2.default);
  app.use('/api/v1/questions', _questions2.default);
  app.use('/api/v1/user', _users2.default);
};
//# sourceMappingURL=index.js.map