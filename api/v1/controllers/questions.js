import express from 'express';
import dbpackage from '../model/dbstruct';
import generateUniqueId from '../helpers/genUniqueId';
import mode from '../helpers/mode';

const router = express.Router();
let { questions, answers } = dbpackage;

router.get('/', (req, res) => {
  res.render('questionsLog', {
    questions,
  });
});

router.post('/error', (req, res) => {
  res.render('error', {
    error: {
      errorMsg: 'Please log In or create an account to enable searching.',
      errorType: 'Not Logged In Yet',
    },
  });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const found = questions.filter(o => o.questionId === id);
  if (found.length === 1) {
    res.render('questionsLog', {
      questions: found[0],
    });
  } else {
    res.render('usererror', {
      error: {
        errorMsg: `Question Id: ${id} does not exit`,
        errorType: 'Invalid Question Id',
      },
    });
  }
});

router.get('/questionThread/:qId', (req, res) => {
  const id = Number(req.params.qId);
  const found = questions.filter(o => o.questionId === id);
  if (found.length === 1) {
    const qId = found[0].questionId;
    const answerForQuestion = answers.filter(o => o.questionId === qId);
    res.render('threadlog', {
      questions: found[0],
      answers: answerForQuestion,
    });
  } else {
    res.status(404).send();
  }
});

router.post('/findQuestion', (req, res) => {
  const { keyword } = req.body;
  const found = questions.filter(
    o => o.question.toLowerCase().indexOf(keyword.toLowerCase()) !== -1,
  );
  if (found.length !== 0) {
    res.render('questionsLog', {
      questions: found,
    });
  } else {
    res.render('usererror', {
      error: {
        errorMsg: `${keyword} not found. Try a different keyword.`,
        errorType: 'Keyword not found',
      },
    });
  }
});

router.post('/findQuestionById', (req, res) => {
  const qId = Number(req.body.qid);
  const found = questions.filter(question => question.questionId === qId);
  if (found.length !== 0) {
    res.render('questionsLog', {
      questions: found,
    });
  } else {
    res.render('usererror', {
      error: {
        errorMsg: `${qId} not found. Try a different question Id.`,
        errorType: 'Question Id Not Found',
      },
    });
  }
});

router.post('/', (req, res) => {
  questions.unshift({
    questionId: Number(generateUniqueId(questions, 'questionId')),
    userId: Number(req.body.userId),
    username: req.body.username,
    question: req.body.question,
  });
  res.redirect('/api/v1/questions');
});

router.post('/:id/answers', (req, res) => {
  const questId = req.params.id;
  const entPut = req.body.answer;
  answers.push({
    answerId: generateUniqueId(answers, 'answerId'),
    questionId: Number(questId),
    userId: Number(req.body.userId),
    username: req.body.username,
    answer: entPut,
    answerState: '',
    votes: 0,
    comments: [],
  });
  res.redirect(`/api/v1/questions/questionThread/${questId}`);
});

router.post('/:id/delete', (req, res) => {
  const questId = Number(req.params.id);
  const { userId } = req.body;
  let goAhead = false;
  questions.map((question) => {
    if (question.questionId === questId && question.userId === Number(userId)) {
      goAhead = true;
    }
    return true;
  });
  if (goAhead === true) {
    questions = questions.filter(question => question.questionId !== questId);
    answers = answers.filter(answer => answer.questionId !== questId);
    res.redirect('/api/v1/questions');
  } else {
    res.render('usererror', {
      error: {
        errorMsg: 'You are not the author of this question, therefore you cant delete it',
        errorType: 'Delete Not Allowed',
      },
    });
  }
});

router.post('/:qId/:aId/accept', (req, res) => {
  const questId = Number(req.params.qId);
  const answerId = Number(req.params.aId);
  const uId = req.body.userId;
  let goAhead = false;
  questions.map((question) => {
    if (question.questionId === questId && question.userId === Number(uId)) {
      goAhead = true;
    }
    return true;
  });
  /* eslint-disable no-param-reassign */
  if (goAhead === true) {
    answers.map((ans) => {
      if (ans.answerId === answerId) {
        ans.acceptState = 'accepted';
      } else {
        ans.acceptState = '';
      }
      return true;
    });
    res.redirect(`/api/v1/questions/questionThread/${questId}`);
  } else {
    res.render('usererror', {
      error: {
        errorMsg: 'You are not the author of this question, therefore you can\'t accept it',
        errorType: 'Not Allowed',
      },
    });
  }
});

router.get('/:qId/:aId/vote', (req, res) => {
  answers.map((answer) => {
    if (answer.questionId === Number(req.params.qId)
    && answer.answerId === Number(req.params.aId)) {
      answer.votes += 1;
    }
    return false;
  });
  res.redirect(`/api/v1/questions/questionThread/${req.params.qId}`);
});

router.get('/:downvote/:qId/:aId', (req, res) => {
  answers.map((answer) => {
    if (answer.questionId === Number(req.params.qId)
    && answer.answerId === Number(req.params.aId)) {
      if (answer.votes > 0) {
        answer.votes -= 1;
      } else {
        answer.votes = answer.votes;
      }
    }
    return false;
  });
  res.redirect(`/api/v1/questions/questionThread/${req.params.qId}`);
});

router.get('/user/:userId', (req, res) => {
  const uId = Number(req.params.userId);
  const userQuestions = questions.filter(qtn => qtn.userId === uId);
  res.render('questionsLog', {
    questions: userQuestions,
  });
});

router.get('/questionsAnswered/:userId', (req, res) => {
  const uId = Number(req.params.userId);
  const qansd = [];
  answers.map((ans) => {
    if (ans.userId === uId) {
      qansd.push(ans.questionId);
    }
    return false;
  });
  const foundquestions = [];
  qansd.map((id) => {
    questions.map((question) => {
      if (question.questionId === id) {
        foundquestions.push(question);
      }
      return false;
    });
    return false;
  });
  res.render('questionsLog', {
    questions: foundquestions,
  });
});

router.get('/top/question', (req, res) => {
  const ansdqtn = [];
  answers.map(answer => ansdqtn.push(answer.questionId));
  const modeqtn = mode(ansdqtn);
  const topqtn = questions.filter(question => question.questionId === modeqtn);
  res.render('questionsLog', {
    questions: topqtn,
  });
});

router.post('/addcomment/:qId/:answerId', (req, res) => {
  const questId = Number(req.params.qId);
  const ansId = Number(req.params.answerId);
  const { comment } = req.body;
  answers.map((ans) => {
   if (ans.questionId === questId && ans.answerId === ansId) {
      ans.comments.push({
        commentId: generateUniqueId(ans.comments, 'commentId'),
        comment,
        userId: req.body.userId,
        username: req.body.username,
        questionId: questId,
      });
    }
    return false;
  });
  res.redirect(`/api/v1/questions/questionThread/${questId}`);
});


export default router;
