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

var _dbstruct = require('../model/dbstruct');

var _dbstruct2 = _interopRequireDefault(_dbstruct);

var _genUniqueId = require('../helpers/genUniqueId');

var _genUniqueId2 = _interopRequireDefault(_genUniqueId);

var _mode = require('../helpers/mode');

var _mode2 = _interopRequireDefault(_mode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('dotenv').config();

var router = _express2.default.Router();
var questions = _dbstruct2.default.questions,
    answers = _dbstruct2.default.answers;

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
      message: 'JWT Authentication Error'
    });
  }
};

router.get('/', verifyToken, function (req, res) {
  _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error) {
    if (error) {
      res.status(417).json({
        success: true,
        message: 'An error occured while verifying token'
      });
    } else {
      pool.connect(function (err, client, done) {
        if (err) {
          return res.status(200).json({
            success: false,
            message: err
          });
        }
        client.query('SELECT * FROM questions', function (bugFound, result) {
          res.status(200).json({
            success: true,
            message: 'All questions retrieved',
            questions: result.rows
          });
        });
        done();
      });
    }
  });
});

router.get('/:id', verifyToken, function (req, res) {
  _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error) {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token'
      });
    } else {
      var id = req.params.id;

      id = id.replace(/[^0-9]+/, '');
      id = Number(id);
      if (id) {
        pool.connect(function (err, client, done) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err
            });
          }
          client.query('SELECT * FROM questions WHERE questionid=$1', [id], function (error, result) {
            if (!result || result.rows.length === 0) {
              res.status(200).json({
                message: 'This question id does not exist in the database',
                success: false
              });
            } else {
              client.query('SELECT * FROM answers WHERE questionid=$1', [id], function (errForAns, answers) {
                if (answers.rows.length === 0) {
                  res.status(200).json({
                    message: 'Specified question retrieved',
                    success: true,
                    data: result.rows
                  });
                } else {
                  res.status(200).json({
                    msg: 'Specified question retrieved',
                    success: true,
                    data: {
                      question: result.rows,
                      answers: answers.rows
                    }
                  });
                }
              });
            }
          });
          done();
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Id must be a number'
        });
      }
    }
  });
});

router.post('/findQuestion', function (req, res) {
  var keyword = req.body.keyword;

  var found = questions.filter(function (o) {
    return o.question.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
  });
  if (found.length !== 0) {
    res.json(found);
  } else {
    res.send('Keyword not found!');
  }
});

router.post('/findQuestionById', function (req, res) {
  var qId = Number(req.body.qid);
  var found = questions.filter(function (question) {
    return question.questionId === qId;
  });
  if (found.length !== 0) {
    res.json(found);
  } else {
    res.send('Question id not found!');
  }
});

router.post('/', verifyToken, function (req, res) {
  if (!req.body.question || !req.body.title) {
    res.status(400).json({
      success: false,
      message: 'There is a missing field'
    });
  } else {
    _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error, userData) {
      if (error) {
        res.status(401).json({
          success: true,
          message: 'An error occured while verifying token'
        });
      } else {
        pool.connect(function (err, client, done) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err
            });
          }
          client.query('INSERT INTO questions(userid, username, question, title) VALUES($1, $2, $3, $4)', [Number(userData.authUser.userid), userData.authUser.username, req.body.question, req.body.title]);
          done();
          res.status(201).json({
            success: true,
            message: 'Question posted'
          });
        });
      }
    });
  }
});

router.post('/:id/answers', verifyToken, function (req, res) {
  if (!req.body.answer) {
    res.status(400).json({
      success: false,
      message: 'No answer was sent'
    });
  } else {
    _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error, userData) {
      if (error) {
        res.status(401).json({
          success: true,
          message: 'An error occured while verifying token'
        });
      } else {
        pool.connect(function (err, client, done) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err
            });
          }
          client.query('INSERT INTO answers(questionid, userid, username, answer, state, upvotes, downvotes) VALUES($1, $2, $3, $4, $5, $6, $7)', [req.params.id, userData.authUser.userid, userData.authUser.username, req.body.answer, 0, 0, 0]);
          done();
          res.status(201).json({
            success: true,
            message: 'Answer posted'
          });
        });
      }
    });
  }
});

router.delete('/:id', verifyToken, function (req, res) {
  _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error, userData) {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token'
      });
    } else {
      var questId = Number(req.params.id);
      pool.connect(function (err, client, done) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err
          });
        }
        client.query('SELECT * FROM questions WHERE questionid=$1 AND userid=$2', [questId, userData.authUser.userid], function (error, result) {
          if (error) {
            return res.status(500).json({
              success: false,
              message: error
            });
          }
          if (result.rows.length === 0) {
            res.status(401).json({
              success: false,
              message: 'You cannot delete this question'
            });
          } else {
            client.query('DELETE FROM questions WHERE questionid=$1', [questId]);
            res.status(200).json({
              success: true,
              message: 'Question deleted'
            });
          }
        });
        done();
      });
    }
  });
});

router.put('/:qId/answers/:aId/', verifyToken, function (req, res) {
  _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error, userData) {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token'
      });
    } else {
      var questId = Number(req.params.qId);
      var answerId = Number(req.params.aId);
      pool.connect(function (err, client, done) {
        if (err) {
          return res.status(200).json({
            message: err,
            success: false
          });
        }
        client.query('SELECT * FROM questions WHERE questionid=$1 AND userid=$2', [questId, userData.authUser.userid], function (error, result) {
          if (error) {
            return res.status(200).json({
              success: false,
              message: error
            });
          }
          if (result.rows.length === 0) {
            return res.status(200).json({
              success: false,
              message: 'You cannot accept this question, you are not the author'
            });
          }
          client.query('UPDATE answers SET state=$1 WHERE answerid=$2', [1, answerId]);
          done();
          res.status(202).json({
            success: true,
            message: 'Answer accepted'
          });
        });
      });
    }
  });
});

router.get('/:qId/:aId/vote', function (req, res) {
  answers.map(function (answer) {
    if (answer.questionId === Number(req.params.qId) && answer.answerId === Number(req.params.aId)) {
      answer.votes += 1;
    }
    return false;
  });
  res.json(answers);
});

router.get('/:downvote/:qId/:aId', function (req, res) {
  answers.map(function (answer) {
    if (answer.questionId === Number(req.params.qId) && answer.answerId === Number(req.params.aId)) {
      if (answer.votes > 0) {
        answer.votes -= 1;
      } else {
        answer.votes = answer.votes;
      }
    }
    return false;
  });
  res.json(answers);
});

router.get('/user/asked', verifyToken, function (req, res) {
  _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error, userData) {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token'
      });
    } else {
      pool.connect(function (err, client, done) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err
          });
        }
        client.query('SELECT * FROM questions WHERE userid=$1', [userData.authUser.userid], function (errForAns, result) {
          if (!result || result.rows.length === 0) {
            res.status(200).json({
              success: false,
              message: 'You dont have any question on the this platform, try adding one'
            });
          } else {
            res.status(200).json({
              message: 'Your questions retrieved successfully',
              success: true,
              questions: result.rows
            });
          }
        });
        done();
      });
    }
  });
});

router.get('/user/answered', verifyToken, function (req, res) {
  _jsonwebtoken2.default.verify(req.token, process.env.JWT_SECRET_KEY, function (error, userData) {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token'
      });
    } else {
      pool.connect(function (err, client, done) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err
          });
        }
        client.query('SELECT * FROM answers WHERE userid=$1', [userData.authUser.userid], function (errForAns, answerStack) {
          if (!answerStack || answerStack.rows.length === 0) {
            res.status(200).json({
              success: false,
              message: 'You havent answered any questions on this platform, try '
            });
          } else {
            client.query('SELECT * FROM questions', function (err, result) {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: err
                });
              }
              res.status(200).json({
                message: 'All Info retrieved successfully',
                success: true,
                data: {
                  answers: answerStack.rows,
                  questions: result.rows
                }
              });
            });
          }
        });
        done();
      });
    }
  });
});

router.get('/topquestion/:uId', function (req, res) {
  var uId = Number(req.params.uId);
  var userQuestions = questions.filter(function (qtn) {
    return Number(qtn.userId) === uId;
  });
  var questionsAnswered = [];
  userQuestions.map(function (question) {
    answers.map(function (answer) {
      if (answer.questionId === question.questionId) {
        questionsAnswered.push(question.questionId);
      }
      return false;
    });
    return false;
  });
  var modeqtn = (0, _mode2.default)(questionsAnswered);
  var topqtn = userQuestions.filter(function (question) {
    return question.questionId === modeqtn;
  });
  res.json(topqtn);
});

router.post('/addcomment/:qId/:answerId', function (req, res) {
  var questId = Number(req.params.qId);
  var ansId = Number(req.params.answerId);
  var comment = req.body.comment;

  answers.map(function (ans) {
    if (ans.questionId === questId && ans.answerId === ansId) {
      ans.comments.push({
        commentId: (0, _genUniqueId2.default)(ans.comments, 'commentId'),
        comment: comment,
        userId: req.body.userId,
        username: req.body.username,
        questionId: questId
      });
    }
    return false;
  });
  res.json(answers);
});

exports.default = router;
//# sourceMappingURL=questions.js.map