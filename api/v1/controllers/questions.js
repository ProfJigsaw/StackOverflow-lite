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
      message: 'JWT Authentication Error',
    });
  }
};

router.get('/', (req, res) => {
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
});

router.get('/:id', (req, res) => {
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
            client.query('SELECT * FROM answers WHERE questionid=$1 ORDER BY answerid ASC', [id], (errForAns, answers) => {
              if (!answers || answers.rows.length === 0) {
                res.status(200).json({
                  message: 'Specified question retrieved',
                  success: true,
                  data: result.rows,
                });
              } else {
                res.status(200).json({
                  msg: 'Specified question retrieved',
                  success: true,
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
  if (!req.body.question || !req.body.title) {
    res.status(400).json({
      success: false,
      message: 'There is a missing field',
    });
  } else {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
      if (error) {
        res.status(401).json({
          success: false,
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
          client.query('INSERT INTO questions(userid, username, question, title) VALUES($1, $2, $3, $4)', [
            Number(userData.authUser.userid),
            userData.authUser.username,
            req.body.question,
            req.body.title,
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
    res.status(400).json({
      success: false,
      message: 'No answer was sent',
    });
  } else {
    jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
      if (error) {
        res.status(401).json({
          success: false,
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
        success: false,
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
        success: false,
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
              message: 'This answer can only be accepted by the questions author.',
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

router.put('/:qId/:aId/upvote', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(200).json({
        message: err,
        success: false,
      });
    }
    client.query('UPDATE answers SET upvotes = upvotes + 1 WHERE questionid = $1 AND answerid = $2',
    [req.params.qId, req.params.aId], (error) => {
      if (error) {
        console.log(error);
      } else {
        res.status(201).json({
          success: true,
          message: 'Answer upvoted',
        });
      }
    });
  done();
  });
});

router.put('/:qId/:aId/downvote', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(200).json({
        message: err,
        success: false,
      });
    }
    client.query('UPDATE answers SET downvotes = downvotes + 1 WHERE questionid = $1 AND answerid = $2',
      [req.params.qId, req.params.aId], (error) => {
        if (error) {
          console.log(error);
        } else {
          res.status(201).json({
            success: true,
            message: 'Answer downvoted',
          });
        }
      });
    done();
  });
});

router.get('/user/asked', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.status(401).json({
        success: false,
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
            res.status(200).json({
              success: false,
              message: 'You dont have any question on the this platform, try adding one',
            });
          } else {
            res.status(200).json({
              message: 'Your questions retrieved successfully',
              success: true,
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
        success: false,
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
        client.query('SELECT * FROM answers WHERE userid=$1', [userData.authUser.userid], (errForAns, answerStack) => {
          if (!answerStack || answerStack.rows.length === 0) {
            res.status(200).json({
              success: false,
              message: 'You havent answered any questions on this platform, try adding some answers',
            });
          } else {
            client.query('SELECT * FROM questions', (err, result) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: err,
                });
              }
              res.status(200).json({
                message: 'All Info retrieved successfully',
                success: true,
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

router.get('/stack/topquestion', (req, res) => {
  pool.connect()
  .then(async (client) => {
    const questions = await client.query('SELECT * FROM questions');
    const answers = await client.query('SELECT * FROM answers');
    return res.status(200).json({
      success: true,
      message: 'All data retrieved successfully',
      questions: questions.rows,
      answers: answers.rows,
    });
  })
  .catch((error) => {
    res.status(200).json({
      success: false,
      message: 'An error occured',
      error,
    });
  });
});

router.get('/:qid/answers/:aid/comments', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(200).json({
        message: err,
        success: false,
      });
    }
    client.query('SELECT * FROM comments WHERE questionid = $1 AND answerid = $2',
      [req.params.qid, req.params.aid], (error, result) => {
        if (error) {
          res.status(200).json({
            message: 'An internal error occurred. Refresh page and retry',
            success: false,
          });
        } else {
          res.status(200).json({
            success: true,
            message: 'Comments retrieved successfully',
            comments: result.rows,
          });
        }
      });
    done();
  });
});

router.post('/:qid/answers/:aid/comments', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.status(401).json({
        success: false,
        message: 'An error occured while verifying token',
      });
    } else {
      const { comment } = req.body;
      if (!comment) {
        return res.status(400).json({
          success: false,
          message: 'Comment must not be empty',
        });
      }
      pool.connect((err, client, done) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err,
          });
        }
        client.query('INSERT INTO comments(answerid, questionid, username, comment) VALUES($1, $2, $3, $4)',
        [req.params.aid, req.params.qid, userData.authUser.username, comment], (err) => {
          if (err) {
            res.status(500).json({
              success: false,
              message: err,
            });
          } else {
            return res.status(201).json({
              success: true,
              message: 'Comment Inserted',
            });
          }
        });
        done();
      });
    }
  });
});

export default router;
