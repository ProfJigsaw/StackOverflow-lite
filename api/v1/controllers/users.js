import express from 'express';
import generateUniqueId from '../helpers/genUniqueId';
import getStoredUserId from '../helpers/getUserId';
import getStoredUserEmail from '../helpers/getUserEmail';
import dbpackage from '../model/dbstruct';

const router = express.Router();

let { session } = dbpackage;
const { users } = dbpackage;

router.get('/getuser', (req, res) => {
  res.json(session.user);
});

router.get('/', (req, res) => {
  if (session.loginState === true) {
    res.render('userlanding', {
      msg: {
       user: session.user.username,
      },
    });
  } else {
    res.render('index', {
      msg: {
        user: 'Guest',
      },
    });
  }
});

router.get('/addquestion', (req, res) => {
  res.render('addQuestion');
});

router.get('/loginForm', (req, res) => {
  res.render('form');
});

router.post('/login', (req, res) => {
  const username = req.body.username.toString();
  const password = req.body.password.toString();
  let found = false;
  users.map((user) => {
    found = (user.username === username && user.password === password) ? true : found;
    return false;
  });
  if (found === true) {
    session.loginState = true;
    session.user = {
      username,
      userId: getStoredUserId(users, username),
      email: getStoredUserEmail(users, username),
    };
    res.render('userlanding', {
      msg: {
        user: username,
      },
    });
  } else {
    res.render('error', {
      error: {
        errorMsg: 'Sign up to create an account',
        errorType: 'User Not Found',
      },
    });
  }
});

router.get('/signUpForm', (req, res) => {
  res.render('signup');
});

router.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  let found = false;
  users.map((user) => {
    found = (user.username === username) ? true : found;
    return false;
  });
  if (found === false) {
    const tempUserId = generateUniqueId(users, 'userId');
    users.push({
      username,
      email,
      password,
      userId: tempUserId,
    });
    session.loginState = true;
    session.user = {
      userId: tempUserId,
      username,
      email,
      password,
    };
    res.render('userlanding', {
      msg: {
        user: username,
      },
    });
  } else {
    res.render('error', {
      error: {
        errorMsg: 'Sign up with a different username',
        errorType: 'Username Already Exists',
      },
    });
  }
});

router.get('/profile', (req, res) => {
  res.render('userprofile', {
    user: session.user,
  });
});

router.get('/logout', (req, res) => {
  session = [];
  res.redirect('/api/v1');
});

export default router;
