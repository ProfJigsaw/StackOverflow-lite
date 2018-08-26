import jwt from 'jsonwebtoken';
import express from 'express';
import pg from 'pg';
import dbpackage from '../model/dbstruct';
import generateUniqueId from '../helpers/genUniqueId';
import mode from '../helpers/mode';

require('dotenv').config();

const router = express.Router();
const { questions, answers } = dbpackage;
const pool = new pg.Pool({
  host: 'ec2-54-163-246-5.compute-1.amazonaws.com',
  user: 'kykzfypdroonqq',
  database: 'dbce24mref102i',
  password: 'bad3fc10cb046ef90a7bfa47eb4626a5900d498d69801a83ea6395ed15cff8ae',
  port: 5432,
  ssl: true,
});

function verifyToken(req, res, next) {
  const bearHeader = req.headers.authorization;
  if (bearHeader) {
    [, req.token] = bearHeader.split(' ');
    next();
  } else {
    res.sendStatus(403);
  }
}

router.get('/', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error) => {
    if (error) {
      res.sendStatus(403);
    } else {
      pool.connect((err, client, done) => {
        if (err) {
          return res.send('error fetching client from pool', err);
        }
        client.query('SELECT * FROM questions', (bugFound, result) => {
          res.send(result.rows);
        });
        done();
      });
    }
  });
});

router.get('/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error) => {
    if (error) {
      res.sendStatus(403);
    } else {
      let { id } = req.params;
      id = id.replace(/[^0-9]+/, '');
      id = Number(id);
      if (id) {
        pool.connect((err, client, done) => {
          if (err) {
            return res.send('error fetching client from pool', err);
          }
          client.query('SELECT * FROM questions WHERE questionid=$1', [id], (error, result) => {
            if (result.rows.length === 0) {
              res.send('This question id does not exist in the database');
            } else {
              client.query('SELECT * FROM answers WHERE questionid=$1', [id], (errForAns, answers) => {
                if (answers.rows.length === 0) {
                  res.send(['QUESTION:', ...result.rows, 'ANSWERS:', 'There are no answers for this question!']);
                } else {
                  res.send(['QUESTION:', ...result.rows, 'ANSWERS:', ...answers.rows]);
                }
              });
            }
          });
          done();
        });
      } else {
        res.send('Id must be a number');
      }
    }
  });
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

router.post('/', verifyToken, (req, res) => {
  if (!req.body.question) {
    res.send('No question was entered');
  } else {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
      if (error) {
        res.sendStatus(403);
      } else {
        pool.connect((err, client, done) => {
          if (err) {
            return res.send('Error fetching client from pool', err);
          }
          client.query('INSERT INTO questions(userid, username, question) VALUES($1, $2, $3)', [
            Number(userData.authUser.userid),
            userData.authUser.username,
            req.body.question,
          ]);
          done();
          res.send('Successfully inserted data into heroku postgres Database!');
        });
      }
    });
  }
});

router.post('/:id/answers', verifyToken, (req, res) => {
  if (!req.body.answer) {
    res.send('No answer was sent');
  } else {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
      if (error) {
        res.sendStatus(403);
      } else {
        pool.connect((err, client, done) => {
          if (err) {
            return res.send('error fetching client from pool', err);
          }
          client.query('INSERT INTO answers(questionid, userid, username, answer, state, upvotes, downvotes) VALUES($1, $2, $3, $4, $5, $6, $7)', [
            req.params.id,
            userData.authUser.userid,
            userData.authUser.username,
            req.body.answer,
            0,
            0,
            0,
          ]);
          done();
          res.send('Successfully inserted answer into Heroku postgres DB!');
        });
      }
    });
  }
});

router.delete('/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.sendStatus(403);
    } else {
      const questId = Number(req.params.id);
      pool.connect((err, client, done) => {
        if (err) {
          return res.send('Error fetching client from pool', err);
        }
        client.query('SELECT * FROM questions WHERE questionid=$1 AND userid=$2', [questId, userData.authUser.userid], (error, result) => {
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
    }
  });
});

router.put('/:qId/answers/:aId/', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    console.log(userData.authUser.userid);
    if (error) {
      res.sendStatus(403);
    } else {
      const questId = Number(req.params.qId);
      const answerId = Number(req.params.aId);
      pool.connect((err, client, done) => {
        if (err) {
          return res.send('error fetching client from pool', err);
        }
        client.query('SELECT * FROM questions WHERE questionid=$1 AND userid=$2', [questId, userData.authUser.userid], (error, result) => {
          if (error) {
            return res.send(error);
          } if (result.rows.length === 0) {
            return res.send('You cannot accept this question, you are not the author');
          }
          client.query('UPDATE answers SET state=$1 WHERE answerid=$2', [1, answerId]);
          done();
          res.send('Answer accepted');
        });
      });
    }
  });
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
