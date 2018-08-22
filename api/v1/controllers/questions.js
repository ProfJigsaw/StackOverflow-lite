import express from 'express';
import pg from 'pg';
import dbpackage from '../model/dbstruct';
import generateUniqueId from '../helpers/genUniqueId';
import mode from '../helpers/mode';

const router = express.Router();
const { questions, answers } = dbpackage;
const pool = new pg.Pool({
  host: 'ec2-54-235-242-63.compute-1.amazonaws.com',
  user: 'qioqlpbhbvemko',
  database: 'd7asd2ddssh50j',
  password: '7f7c24035097e34629a30dbffb67ca3ba37e9296fd91258f8b7eb6ff02dba8d0',
  port: 5432,
  ssl: true,
});

router.get('/', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
        return console.error('error fetching client from pool', err);
    }
    client.query('SELECT * FROM questions', (err, result) => {
    	res.send(result.rows);
    });
    done();
	});
});

router.post('/error', (req, res) => {
  res.send('There was an error!');
});

router.get('/:id', (req, res) => {
  let id = req.params.id;
  id = id.replace(/[^0-9]+/, '');
  id = Number(id);
  if (id) {
    pool.connect((err, client, done) => {
      if (err) {
        return res.send('error fetching client from pool', err);
      }
      client.query('SELECT * FROM questions WHERE questionid=$1', [id], (err, result) => {
        if (result.rows.length === 0) {
          res.send('This question id does not exist in the database');
        } else {
          res.send(result.rows);
        }
      });
      done();
    });
  } else {
    res.send('Id must be a number');
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
    res.send('This question id was not found');
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
    res.send('Keyword not found!');
  }
});

router.post('/findQuestionById', (req, res) => {
  const qId = Number(req.body.qid);
  const found = questions.filter(question => question.questionId === qId);
  if (found.length !== 0) {
    res.json(found);
  } else {
    res.send('Question id not found!');
  }
});

router.post('/', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return console.error('error fetching client from pool', err);
    }
    client.query('INSERT INTO questions(userid, username, question) VALUES($1, $2, $3)', [
      Number(req.body.userId),
      req.body.username,
      req.body.question,
    ]);
    done();
    res.send('Successfully inserted data into heroku postgres!');
  });
});

router.post('/:id/answers', (req, res) => {
  pool.connect((err, client, done) => {
      if (err) {
        return res.send('error fetching client from pool', err);
      }
      client.query('INSERT INTO answers(questionid, userid, username, answer, state, upvotes, downvotes) VALUES($1, $2, $3, $4, $5, $6, $7)', [
        req.params.id,
        req.body.userId,
        req.body.username,
        req.body.answer,
        0,
        0,
        0,
      ]);
      done();
      res.send('Successfully inserted answer into heroku postgres DB!');
    });
});

router.delete('/:id', (req, res) => {
  const questId = Number(req.params.id);
  const { userId } = req.body;
  if (!userId) {
    return res.send('You must send along your user Id');
  }
  pool.connect((err, client, done) => {
    if (err) {
      return res.send('Error fetching client from pool', err);
    }
    client.query('SELECT * FROM questions WHERE questionid=$1 AND userid=$2', [questId, userId], (error, result) => {
      if (error) {
        res.send(error);
      } if (result.rows.length === 0) {
        res.send('You cannot delete this question');
      } else {
        client.query('DELETE FROM questions WHERE questionid=$1', [questId]);
        res.send('Successfully DELETED data from heroku postgres!');
      }
    });
    done();
  });
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
    res.json(answers);
  } else {
    res.send('You cant accept this, you didnt create the question');
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
  res.json(answers);
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
  res.json(answers);
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
  res.json(answers);
});


export default router;
