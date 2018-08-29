import jwt from 'jsonwebtoken';
import express from 'express';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const saltRounds = 1;

dotenv.config();

const router = express();
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

router.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.json({
      msg: 'Your entry contains a missing field.',
      loginstate: false,
    });
  }
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(200).json({
        msg: err,
        loginstate: false,
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
                }, 'elbicnivnisiwasgij', (jwerror, jwtoken) => {
                  if (jwerror) {
                    return res.status(200).json({
                      msg: 'An error occured',
                      loginstate: false,
                    });
                  }
                  return res.status(200).json({
                    msg: 'Login success',
                    loginstate: true,
                    token: jwtoken,
                  });
                });
              } else {
                return res.status(200).json({
                  msg: 'The Password supplied does not match the username',
                  loginstate: false,
                });
              }
            });
          } else {
            res.status(200).json({
              msg: 'User was not found!',
              loginstate: false,
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
    return res.status(200).json({
      msg: 'Your entry contains a missing field.',
      loginstate: false,
    });
  }
  if (!req.body.username.trim() || !req.body.email.trim() || !req.body.password.trim()) {
    return res.status(200).json({
      msg: 'One of your entries is empty.',
      loginstate: false,
    });
  }
  if (!testEmail(req.body.email)) {
    return res.status(200).json({
      msg: 'The email that you entered is invalid',
      loginstate: false,
    });
  }
  if (!testUsername(req.body.username)) {
    return res.status(200).json({
      msg: 'Usernames must start with alphabets and should not contain wilcards',
      loginstate: false,
    });
  }
    pool.connect((err, client, done) => {
      if (err) {
        return res.status(200).json({
          msg: err,
          loginstate: false,
        });
      }
      client.query('SELECT * FROM users WHERE username=$1', [req.body.username], (error, result) => {
        if (result && result.rows.length > 0) {
          res.status(200).json({
            msg: 'This username already exists, Please select another username',
            loginstate: false,
          });
        } else {
          bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
              return res.status(200).json({
                msg: 'There was a hashing error',
                loginstate: false,
              });
            }
            pool.connect((error, client, done) => {
              client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [
                req.body.username,
                req.body.email,
                hash,
              ]);
              done();
            });
          });
          pool.connect((error, client, done) => {
            client.query('SELECT userid, username FROM users WHERE username=$1', [req.body.username], (err, result) => {
              const authUser = result.rows[0];
              jwt.sign({
                authUser,
              }, 'elbicnivnisiwasgij', (jwterror, jwtoken) => {
                if (jwterror) {
                  return res.status(200).json({
                    msg: err,
                    loginstate: false,
                  });
                }
                return res.status(200).json({
                  msg: 'signup success',
                  loginstate: true,
                  token: jwtoken,
                });
              });
            });
            done();
          });
        }
      });
      done();
    });
});

router.get('/signout', (req, res) => {
  res.status(200).json({
    msg: 'You have been successfully signed out of the platform.',
    loginstate: false,
  });
});

router.get('/users', verifyToken, (req, res) => {
  jwt.verify(req.token, 'elbicnivnisiwasgij', (error, userData) => {
    if (error) {
      res.sendStatus(403);
    } else {
      res.status(200).json({
        msg: 'Retrieve Success',
        username: userData.authUser.username,
        userid: userData.authUser.userid,
      });
    }
  });
});

export default router;
