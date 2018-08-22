'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _dbstruct = require('../model/dbstruct');

var _dbstruct2 = _interopRequireDefault(_dbstruct);

var _genUniqueId = require('../helpers/genUniqueId');

var _genUniqueId2 = _interopRequireDefault(_genUniqueId);

var _mode = require('../helpers/mode');

var _mode2 = _interopRequireDefault(_mode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();
var questions = _dbstruct2.default.questions,
    answers = _dbstruct2.default.answers;


router.get('/', function (req, res) {
  res.json(questions);
});

router.post('/error', function (req, res) {
  res.send('There was an error!');
});

router.get('/:id', function (req, res) {
  var id = Number(req.params.id);
  var found = questions.filter(function (o) {
    return o.questionId === id;
  });
  if (found.length === 1) {
    res.json(found[0]);
  } else {
    res.send('This question id [ ' + id + ' ] doesnt exit yet, create it by posting at "/questions"');
  }
});

router.get('/questionThread/:qId', function (req, res) {
  var id = Number(req.params.qId);
  var found = questions.filter(function (o) {
    return o.questionId === id;
  });
  if (found.length === 1) {
    var qId = found[0].questionId;
    var answerForQuestion = answers.filter(function (o) {
      return o.questionId === qId;
    });
    res.json(answerForQuestion);
  } else {
    res.send('This question id was not found');
  }
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

router.post('/', function (req, res) {
  questions.unshift({
    questionId: Number((0, _genUniqueId2.default)(questions, 'questionId')),
    userId: Number(req.body.userId),
    username: req.body.username,
    question: req.body.question
  });
  res.json(questions);
});

router.post('/:id/answers', function (req, res) {
  var questId = req.params.id;
  var entPut = req.body.answer;
  answers.push({
    answerId: (0, _genUniqueId2.default)(answers, 'answerId'),
    questionId: Number(questId),
    userId: Number(req.body.userId),
    username: req.body.username,
    answer: entPut,
    answerState: '',
    votes: 0,
    comments: []
  });
  res.json(answers);
});

router.post('/:id/delete', function (req, res) {
  var questId = Number(req.params.id);
  var userId = req.body.userId;

  var goAhead = false;
  questions.map(function (question) {
    if (question.questionId === questId && question.userId === Number(userId)) {
      goAhead = true;
    }
    return true;
  });
  if (goAhead === true) {
    questions = questions.filter(function (question) {
      return question.questionId !== questId;
    });
    answers = answers.filter(function (answer) {
      return answer.questionId !== questId;
    });
    res.redirect('/api/v1/questions');
  } else {
    res.render('usererror', {
      error: {
        errorMsg: 'You are not the author of this question, therefore you cant delete it',
        errorType: 'Delete Not Allowed'
      }
    });
  }
});

router.post('/:qId/:aId/accept', function (req, res) {
  var questId = Number(req.params.qId);
  var answerId = Number(req.params.aId);
  var uId = req.body.userId;
  var goAhead = false;
  questions.map(function (question) {
    if (question.questionId === questId && question.userId === Number(uId)) {
      goAhead = true;
    }
    return true;
  });
  /* eslint-disable no-param-reassign */
  if (goAhead === true) {
    answers.map(function (ans) {
      if (ans.answerId === answerId) {
        ans.acceptState = 'accepted';
      } else {
        ans.acceptState = '';
      }
      return true;
    });
    res.json(answers);
  } else {
    res.send('You cant accept this, you didnt create the question');
  }
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

router.get('/user/:userId', function (req, res) {
  var uId = Number(req.params.userId);
  var userQuestions = questions.filter(function (qtn) {
    return qtn.userId === uId;
  });
  res.json(userQuestions);
});

router.get('/questionsAnswered/:userId', function (req, res) {
  var uId = Number(req.params.userId);
  var qansd = [];
  answers.map(function (ans) {
    if (ans.userId === uId) {
      qansd.push(ans.questionId);
    }
    return false;
  });
  var foundquestions = [];
  qansd.map(function (id) {
    questions.map(function (question) {
      if (question.questionId === id) {
        foundquestions.push(question);
      }
      return false;
    });
    return false;
  });
  res.json(foundquestions);
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