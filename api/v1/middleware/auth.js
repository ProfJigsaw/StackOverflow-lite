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

router.post('/signup', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return res.send('error fetching client from pool', err);
    }
    client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [
      req.body.username,
      req.body.email,
      req.body.password,
    ]);
    done();
    res.send('User created successfully');
  });
});

router.get('/signout', (req, res) => {
  res.send('You have bee successfully signed out of the platform.');
});

router.get('/users', (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return res.send('error fetching client from pool', err);
    }
    client.query('SELECT * FROM users', (error, result) => {
      if (error) {
        res.send(error);
      }
      res.send(result.rows);
    });
    done();
  });
});

export default router;
