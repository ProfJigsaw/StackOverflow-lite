'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var saltRounds = 1;

_dotenv2.default.config();

var router = (0, _express2.default)();
var pool = new _pg2.default.Pool({
  host: process.env.POSTGRES_AWS_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: true
});

var verifyToken = function verifyToken(req, res, next) {
  var bearHeader = req.headers.authorization;
  if (bearHeader) {
    var _bearHeader$split = bearHeader.split(' ');

    var _bearHeader$split2 = _slicedToArray(_bearHeader$split, 2);

    req.token = _bearHeader$split2[1];

    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Recipe does not exist'
    });
  }
};

router.post('/login', function (req, res) {
  if (!req.body.username || !req.body.password) {
    return res.json({
      success: false,
      message: 'Your entry contains a missing field.'
    });
  }
  pool.connect(function (err, client, done) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }
    client.query('SELECT userid, username, password FROM users WHERE username=$1', [req.body.username], function (errors, result) {
      if (result && result.rows.length === 1) {
        _bcrypt2.default.compare(req.body.password, result.rows[0].password, function (err, bcryptres) {
          if (bcryptres) {
            var authUser = result.rows[0];
            _jsonwebtoken2.default.sign({
              authUser: authUser
            }, process.env.JWT_SECRET_KEY, function (jwerror, jwtoken) {
              if (jwerror) {
                return res.status(200).json({
                  success: false,
                  message: 'An error occured'
                });
              }
              return res.status(201).json({
                success: true,
                message: 'Login success',
                token: jwtoken
              });
            });
          } else {
            return res.status(401).json({
              success: false,
              message: 'The Password supplied does not match the username'
            });
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User was not found!'
        });
      }
    });
    done();
  });
});

var testEmail = function testEmail(email) {
  var emailregex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailregex.test(email);
};

var testUsername = function testUsername(username) {
  var usernameregex = /^[a-zA-Z]+[a-zA-Z0-9_]+$/;
  return usernameregex.test(username);
};

router.post('/signup', function (req, res) {
  if (!req.body.username || !req.body.email || !req.body.password) {
    return res.status(400).json({
      success: false,
      message: 'Your entry contains a missing field.'
    });
  }
  if (!req.body.username.trim() || !req.body.email.trim() || !req.body.password.trim()) {
    return res.status(400).json({
      success: false,
      message: 'One of your entries is empty.'
    });
  }
  if (!testEmail(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'The email that you entered is invalid'
    });
  }
  if (!testUsername(req.body.username)) {
    return res.status(400).json({
      success: false,
      message: 'Usernames must start with alphabets and should not contain wilcards'
    });
  }
  pool.connect(function (err, client, done) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }
    client.query('SELECT * FROM users WHERE username=$1', [req.body.username], function (error, result) {
      if (result && result.rows.length > 0) {
        res.status(400).json({
          success: false,
          message: 'This username already exists, Please select another username'
        });
      } else {
        _bcrypt2.default.hash(req.body.password, saltRounds, function (err, hash) {
          if (err) {
            return res.status(417).json({
              success: false,
              message: 'There was a hashing error'
            });
          }
          pool.connect(function (error, client, done) {
            client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [req.body.username, req.body.email, hash]);
            client.query('SELECT userid, username, password FROM users WHERE username=$1', [req.body.username], function (err, result) {
              var authUser = result.rows[0];
              _jsonwebtoken2.default.sign({
                authUser: authUser
              }, process.env.JWT_SECRET_KEY, function (jwterror, jwtoken) {
                if (jwterror) {
                  return res.status(417).json({
                    success: false,
                    message: err
                  });
                }
                return res.status(201).json({
                  success: true,
                  message: 'Signup success',
                  token: jwtoken
                });
              });
            });
            done();
          });
        });
      }
    });
    done();
  });
});

router.get('/signout', function (req, res) {
  res.status(200).json({
    message: 'You have been successfully signed out of the platform.',
    success: true
  });
});

router.get('/users', verifyToken, function (req, res) {
  _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error, userData) {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token'
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Retrieve Success',
        username: userData.authUser.username,
        userid: userData.authUser.userid
      });
    }
  });
});

exports.default = router;
//# sourceMappingURL=auth.js.map