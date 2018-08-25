import jwt from 'jsonwebtoken';
import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

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
    return res.send('Your entry contains a missing field.');
  }
  pool.connect((err, client, done) => {
    if (err) {
      return res.send('error fetching client from pool', err);
    }
    client.query('SELECT userid, username FROM users WHERE username=$1 AND password=$2', [
        req.body.username,
        req.body.password,
      ], (errors, result) => {
        if (result.rows.length === 1) {
          const authUser = result.rows[0];
          jwt.sign({
            authUser,
          }, process.env.JWT_SECRET_KEY, (jwerror, jwtoken) => {
            if (jwerror) {
              res.send('An error occured');
            }
            res.send(`User logged in successfully. Token is: ${jwtoken}`);
          });
        } else {
          res.send('User was not found!');
        }
      });
    done();
  });
});

const testEmail = (email) => {
  const emailregex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailregex.test(email);
};

router.post('/signup', (req, res) => {
  if (!req.body.username.trim() || !req.body.email.trim() || !req.body.password.trim()) {
    return res.send('Your entry contains a missing field.');
  }
  if (!testEmail(req.body.email)) {
    return res.send('The email that you entered is invalid');
  }
    pool.connect((err, client, done) => {
      if (err) {
        return res.send('error fetching client from pool', err);
      }
      client.query('SELECT * FROM users WHERE username=$1', [req.body.username], (error, result) => {
        if (result.rows.length > 0) {
          return res.send('This username already exists, Please select another username');
        }
        client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [
          req.body.username,
          req.body.email,
          req.body.password,
        ]);
        client.query('SELECT userid, username FROM users WHERE username=$1', [req.body.username], (err, result) => {
          const authUser = result.rows[0];
          jwt.sign({
            authUser,
          }, process.env.JWT_SECRET_KEY, (jwterror, jwtoken) => {
            if (jwterror) {
              return res.send('There was an error', err);
            }
            return res.send(`User created successfully. Your token is ${jwtoken}`);
          });
        });
      });
      done();
    });
});

router.get('/signout', (req, res) => {
  res.send('You have been successfully signed out of the platform.');
});

router.get('/users', verifyToken, (req, res) => {
  jwt.verify(req.token, 'elbicnivnisiwasgij', (error) => {
    if (error) {
      res.sendStatus(403);
    } else {
      pool.connect((err, client, done) => {
        if (err) {
          return res.send('Error fetching client from pool', err);
        }
        client.query('SELECT * FROM users', (errorbug, result) => {
          if (errorbug) {
            res.send(errorbug);
          }
          res.send(result.rows);
        });
        done();
      });
    }
  });
});

export default router;
