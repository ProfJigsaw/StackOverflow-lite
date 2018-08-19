'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _genUniqueId = require('../helpers/genUniqueId');

var _genUniqueId2 = _interopRequireDefault(_genUniqueId);

var _getUserId = require('../helpers/getUserId');

var _getUserId2 = _interopRequireDefault(_getUserId);

var _getUserEmail = require('../helpers/getUserEmail');

var _getUserEmail2 = _interopRequireDefault(_getUserEmail);

var _dbstruct = require('../model/dbstruct');

var _dbstruct2 = _interopRequireDefault(_dbstruct);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

var session = _dbstruct2.default.session;
var users = _dbstruct2.default.users;


router.get('/getuser', function (req, res) {
  res.json(session.user);
});

router.get('/', function (req, res) {
  if (session.loginState === true) {
    res.render('userlanding', {
      msg: {
        user: session.user.username
      }
    });
  } else {
    res.render('index', {
      msg: {
        user: 'Guest'
      }
    });
  }
});

router.get('/addquestion', function (req, res) {
  res.render('addQuestion');
});

router.get('/loginForm', function (req, res) {
  res.render('form');
});

router.post('/login', function (req, res) {
  var username = req.body.username.toString();
  var password = req.body.password.toString();
  var found = false;
  users.map(function (user) {
    found = user.username === username && user.password === password ? true : found;
    return false;
  });
  if (found === true) {
    session.loginState = true;
    session.user = {
      username: username,
      userId: (0, _getUserId2.default)(users, username),
      email: (0, _getUserEmail2.default)(users, username)
    };
    res.render('userlanding', {
      msg: {
        user: username
      }
    });
  } else {
    res.render('error', {
      error: {
        errorMsg: 'Sign up to create an account',
        errorType: 'User Not Found'
      }
    });
  }
});

router.get('/signUpForm', function (req, res) {
  res.render('signup');
});

router.post('/signup', function (req, res) {
  var _req$body = req.body,
      username = _req$body.username,
      email = _req$body.email,
      password = _req$body.password;

  var found = false;
  users.map(function (user) {
    found = user.username === username ? true : found;
    return false;
  });
  if (found === false) {
    var tempUserId = (0, _genUniqueId2.default)(users, 'userId');
    users.push({
      username: username,
      email: email,
      password: password,
      userId: tempUserId
    });
    session.loginState = true;
    session.user = {
      userId: tempUserId,
      username: username,
      email: email,
      password: password
    };
    res.render('userlanding', {
      msg: {
        user: username
      }
    });
  } else {
    res.render('error', {
      error: {
        errorMsg: 'Sign up with a different username',
        errorType: 'Username Already Exists'
      }
    });
  }
});

router.get('/profile', function (req, res) {
  res.render('userprofile', {
    user: session.user
  });
});

router.get('/logout', function (req, res) {
  session = [];
  res.redirect('/api/v1');
});

exports.default = router;
//# sourceMappingURL=users.js.map