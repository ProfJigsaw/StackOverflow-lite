import express from 'express';
import dbpackage from '../model/dbstruct';
import generateUniqueId from '../helpers/genUniqueId';
import mode from '../helpers/mode';

const router = express.Router();
let { questions, answers } = dbpackage;

router.get('/', (req, res) => {
  res.json(questions);
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
    res.json(found[0]);
  } else {
    res.send(`This question id [ ${id} ] doesnt exit yet, create it by posting at "/questions"`);
  }
});

router.get('/questionThread/:qId', (req, res) => {
  const id = Number(req.params.qId);
  const found = questions.filter(o => o.questionId === id);
  if (found.length === 1) {
    const qId = found[0].questionId;
    const answerForQuestion = answers.filter(o => o.questionId === qId);
    res.json(answerForQuestion);
  } else {
    res.send('This thread does not exist');
  }
});

router.post('/findQuestion', (req, res) => {
  const { keyword } = req.body;
  const found = questions.filter(
    o => o.question.toLowerCase().indexOf(keyword.toLowerCase()) !== -1,
  );
  if (found.length !== 0) {
    res.json(found);
  } else {
    res.send('Keyword not found on the platform');
  }
});

router.post('/findQuestionById', (req, res) => {
  const qId = req.body.qid;
  const found = questions.filter(question => question.questionId === qId);
  if (found.length !== 0) {
    res.json(found);
  } else {
    res.send('This question id does not exist!');
  }
});

router.post('/', (req, res) => {
  questions.unshift({
    questionId: Number(generateUniqueId(questions, 'questionId')),
    userId: Number(req.body.userId),
    username: req.body.username,
    question: req.body.question,
  });
  res.json(questions);
});

router.post('/:id/answers', (req, res) => {
  const questId = Number(req.params.id);
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
  res.json(answers);
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
    res.send('Question deleted successfully');
  } else {
    res.send('You cant delete this question, you didnt create it!');
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
    res.send('Answer accepted');
  } else {
    res.send('You cannot accept this answer, you didnt ask the question!');
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
  res.send('Answer voted up!');
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
  res.send('Answer voted down!');
});

router.get('/user/:userId', (req, res) => {
  const uId = Number(req.params.userId);
  const userQuestions = questions.filter(qtn => qtn.userId === uId);
  res.json(userQuestions);
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
  res.json(foundquestions);
});

router.get('/topquestion/:uId', (req, res) => {
  const uId = Number(req.params.uId);
  const userQuestions = questions.filter(qtn => Number(qtn.userId) === uId);
  const questionsAnswered = [];
  userQuestions.map((question) => {
    answers.map((answer) => {
      if (answer.questionId === question.questionId) {
        questionsAnswered.push(question.questionId);
      }
      return false;
    });
    return false;
  });
  const modeqtn = mode(questionsAnswered);
  const topqtn = userQuestions.filter(question => question.questionId === modeqtn);
  res.json(topqtn);
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
  res.send('Comment added successfully!');
});


export default router;
