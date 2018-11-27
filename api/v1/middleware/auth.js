import jwt from 'jsonwebtoken';
import express from 'express';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const saltRounds = 1;

dotenv.config();

const router = express();
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
      message: 'Unauthorized',
    });
  }
};


router.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.json({
      success: false,
      message: 'Your entry contains a missing field.',
    });
  }
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err,
      });
    }
    client.query('SELECT userid, username, password FROM users WHERE username=$1', [
        req.body.username,
      ], (errors, result) => {
        if (result && result.rows.length === 1) {
            bcrypt.compare(req.body.password, result.rows[0].password, (err, bcryptres) => {
              if (bcryptres) {
                const authUser = result.rows[0];
                jwt.sign({
                  authUser,
                }, process.env.JWT_SECRET_KEY, (jwerror, jwtoken) => {
                  if (jwerror) {
                    return res.status(200).json({
                      success: false,
                      message: 'An error occured',
                    });
                  }
                  return res.status(201).json({
                    success: true,
                    message: 'Login success',
                    token: jwtoken,
                  });
                });
              } else {
                return res.status(401).json({
                  success: false,
                  message: 'The Password supplied does not match the username',
                });
              }
            });
          } else {
          res.status(404).json({
            success: false,
            message: 'User was not found!',
          });
        }
      });
    done();
  });
});

const testEmail = (email) => {
  const emailregex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailregex.test(email);
};

const testUsername = (username) => {
  const usernameregex = /^[a-zA-Z]+[a-zA-Z0-9_]+$/;
  return usernameregex.test(username);
};

router.post('/signup', (req, res) => {
  if (!req.body.username || !req.body.email || !req.body.password) {
    return res.status(400).json({
      success: false,
      message: 'Your entry contains a missing field.',
    });
  }
  if (!req.body.username.trim() || !req.body.email.trim() || !req.body.password.trim()) {
    return res.status(400).json({
      success: false,
      message: 'One of your entries is empty.',
    });
  }
  if (!testEmail(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'The email that you entered is invalid',
    });
  }
  if (!testUsername(req.body.username)) {
    return res.status(400).json({
      success: false,
      message: 'Usernames must start with alphabets and should not contain wilcards',
    });
  }
    pool.connect((err, client, done) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err,
        });
      }
      client.query('SELECT * FROM users WHERE username=$1', [req.body.username], (error, result) => {
        if (result && result.rows.length > 0) {
          res.status(400).json({
            success: false,
            message: 'This username already exists, Please select another username',
          });
        } else {
          bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
              return res.status(417).json({
                success: false,
                message: 'There was a hashing error',
              });
            }
            pool.connect((error, client, done) => {
              client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [
                req.body.username,
                req.body.email,
                hash,
              ]);
              client.query('SELECT userid, username, password FROM users WHERE username=$1', [req.body.username], (err, result) => {
              const authUser = result.rows[0];
              jwt.sign({
                authUser,
              }, process.env.JWT_SECRET_KEY, (jwterror, jwtoken) => {
                if (jwterror) {
                  return res.status(417).json({
                    success: false,
                    message: err,
                  });
                }
                return res.status(201).json({
                  success: true,
                  message: 'Signup success',
                  token: jwtoken,
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

router.get('/signout', (req, res) => {
  res.status(200).json({
    message: 'You have been successfully signed out of the platform.',
    success: true,
  });
});

router.get('/users', verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.JWT_SECRET_KEY, (error, userData) => {
    if (error) {
      res.status(401).json({
        success: true,
        message: 'An error occured while verifying token',
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Retrieve Success',
        username: userData.authUser.username,
        userid: userData.authUser.userid,
      });
    }
  });
});

export default router;
