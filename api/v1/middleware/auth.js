import jwt from 'jsonwebtoken';
import express from 'express';
import pg from 'pg';

const router = express();
const pool = new pg.Pool({
  host: 'ec2-54-235-242-63.compute-1.amazonaws.com',
  user: 'qioqlpbhbvemko',
  database: 'd7asd2ddssh50j',
  password: '7f7c24035097e34629a30dbffb67ca3ba37e9296fd91258f8b7eb6ff02dba8d0',
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
  pool.connect((err, client, done) => {
    if (err) {
      return res.send('error fetching client from pool', err);
    }
    jwt.sign({
      user: {
        username: req.body.username,
      },
    }, 'elbicnivnisiwasgij', (error, token) => {
      client.query('SELECT * FROM users WHERE username=$1 AND password=$2', [
        req.body.username,
        req.body.password,
      ], (errors, result) => {
        if (result.rows.length === 1) {
          res.send(`User logged in successfully. Token is: ${token}`);
        } else {
          res.send('User was not found!');
        }
      });
    });
    done();
  });
});

router.post('/signup', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return res.send('error fetching client from pool', err);
    }
    jwt.sign({
      user: {
        username: req.body.username,
      },
    }, 'elbicnivnisiwasgij', (error, token) => {

      client.query('SELECT * FROM users WHERE username=$1', [req.body.username], (error, result) => {
        if (result.rows.length > 0) {
          return res.send('This username already exists, Please select another username');
        }
        client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [
          req.body.username,
          req.body.email,
          req.body.password,
        ]);
        res.send(`User created successfully. Token is: ${token}`);
      });
    });
    done();
  });
});

router.get('/signout', (req, res) => {
  res.send('You have bee successfully signed out of the platform.');
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
