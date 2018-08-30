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
  host: process.env.POSTGRES_AWS_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: true,
});

const verifyToken = (req, res, next) => {
  const bearHeader = req.headers.authorization;
  if (bearHeader) {
    [, req.token] = bearHeader.split(' ');
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Recipe does not exist',
    });
  }
};

router.get('/', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error) => {
    if (error) {
      res.status(417).json({
        success: true,
        message: 'An error occured while verifying token',
      });
    } else {
      pool.connect((err, client, done) => {
        if (err) {
          return res.status(200).json({
            success: false,
            message: err,
          });
        }
        client.query('SELECT * FROM questions', (bugFound, result) => {
          res.status(200).json({
            success: true,
            message: 'All questions retrieved',
            questions: result.rows,
          });
        });
        done();
      });
    }
  });
});

router.get('/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error) => {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token',
      });
    } else {
      let { id } = req.params;
      id = id.replace(/[^0-9]+/, '');
      id = Number(id);
      if (id) {
        pool.connect((err, client, done) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err,
            });
          }
          client.query('SELECT * FROM questions WHERE questionid=$1', [id], (error, result) => {
            if (!result || result.rows.length === 0) {
              res.status(200).json({
                message: 'This question id does not exist in the database',
                success: false,
              });
            } else {
              client.query('SELECT * FROM answers WHERE questionid=$1', [id], (errForAns, answers) => {
                if (answers.rows.length === 0) {
                  res.status(200).json({
                    message: 'Specified question retrieved',
                    sucess: true,
                    data: result.rows,
                  });
                } else {
                  res.status(200).json({
                    msg: 'Specified question retrieved',
                    getstate: true,
                    data: {
                      question: result.rows,
                      answers: answers.rows,
                    },
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
          message: 'Id must be a number',
        });
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
    res.json({
      success: false,
      message: 'No question was entered',
    });
  } else {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
      if (error) {
        res.status(401).json({
          success: true,
          message: 'An error occured while verifying token',
        });
      } else {
        pool.connect((err, client, done) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err,
            });
          }
          client.query('INSERT INTO questions(userid, username, question) VALUES($1, $2, $3)', [
            Number(userData.authUser.userid),
            userData.authUser.username,
            req.body.question,
          ]);
          done();
          res.status(201).json({
            success: true,
            message: 'Question posted',
          });
        });
      }
    });
  }
});

router.post('/:id/answers', verifyToken, (req, res) => {
  if (!req.body.answer) {
    res.status(200).json({
      success: false,
      message: 'No answer was sent',
    });
  } else {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
      if (error) {
        res.status(401).json({
          success: true,
          message: 'An error occured while verifying token',
        });
      } else {
        pool.connect((err, client, done) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err,
            });
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
          res.status(201).json({
            success: true,
            message: 'Answer posted',
          });
        });
      }
    });
  }
});

router.delete('/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token',
      });
    } else {
      const questId = Number(req.params.id);
      pool.connect((err, client, done) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err,
          });
        }
        client.query('SELECT * FROM questions WHERE questionid=$1 AND userid=$2', [questId, userData.authUser.userid], (error, result) => {
          if (error) {
            return res.status(500).json({
              success: false,
              message: error,
            });
          }
          if (result.rows.length === 0) {
            res.status(401).json({
              success: false,
              message: 'You cannot delete this question',
            });
          } else {
            client.query('DELETE FROM questions WHERE questionid=$1', [questId]);
            res.status(200).json({
              success: true,
              message: 'Question deleted',
            });
          }
        });
        done();
      });
    }
  });
});

router.put('/:qId/answers/:aId/', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token',
      });
    } else {
      const questId = Number(req.params.qId);
      const answerId = Number(req.params.aId);
      pool.connect((err, client, done) => {
        if (err) {
          return res.status(200).json({
            message: err,
            success: false,
          });
        }
        client.query('SELECT * FROM questions WHERE questionid=$1 AND userid=$2', [questId, userData.authUser.userid], (error, result) => {
          if (error) {
            return res.status(200).json({
              success: false,
              message: error,
            });
          }
          if (result.rows.length === 0) {
            return res.status(200).json({
              success: false,
              message: 'You cannot accept this question, you are not the author',
            });
          }
          client.query('UPDATE answers SET state=$1 WHERE answerid=$2', [1, answerId]);
          done();
          res.status(202).json({
            success: true,
            message: 'Answer accepted',
          });
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

router.get('/user/asked', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token',
      });
    } else {
      pool.connect((err, client, done) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err,
          });
        }
        client.query('SELECT * FROM questions WHERE userid=$1', [userData.authUser.userid], (errForAns, result) => {
          if (!result || result.rows.length === 0) {
            res.status(204).json({
              success: false,
              message: 'You dont have any question on the this platform, try adding one',
            });
          } else {
            res.status(200).json({
              msg: 'Your questions retrieved successfully',
              getstate: true,
              questions: result.rows,
            });
          }
        });
        done();
      });
    }
  });
});

router.get('/user/answered', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token',
      });
    } else {
      pool.connect((err, client, done) => {
        if (err) {
          return res.status(500).json({
            success: false,
            msg: err,
          });
        }
        client.query('SELECT * FROM answers WHERE userid=$1', [userData.authUser.userid], (errForAns, answerStack) => {
          if (!answerStack || answerStack.rows.length === 0) {
            res.status(204).json({
              success: false,
              message: 'You havent answered any questions on this platform, try ',
            });
          } else {
            client.query('SELECT * FROM questions', (err, result) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  msg: err,
                });
              }
              res.status(200).json({
                msg: 'All Info retrieved successfully',
                getstate: true,
                data: {
                  answers: answerStack.rows,
                  questions: result.rows,
                },
              });
            });
          }
        });
        done();
      });
    }
  });

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
