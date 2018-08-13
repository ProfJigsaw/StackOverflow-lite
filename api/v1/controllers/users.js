import express from 'express';
import generateUniqueId from '../helpers/genUniqueId';
import getStoredUserId from '../helpers/getUserId';
import getStoredUserEmail from '../helpers/getUserEmail';
import dbpackage from '../model/dbstruct';
const router = express.Router();

/* 	CREATING THE SESSION AND USERS OBJECT FROM THE
	IMPORTED SCHEMA CREATED USING ES6 DESTRUCTURING 
*/
let { session, users } = dbpackage;

/* 	CREATING A ROUTE TO VERIFY THE LOGIN STATUS OF A USER
	BEFORE PROCEEDING TO SENSITIVE PARTS OF THE WEB APPLICATION 
*/
router.get('/getuser', (req, res)=>{
	res.json(session.user);
});

/* 	CHECKING THE HOME ROUTE TO MAKE A SURE THAT A USER IS STILL 
	LOGGED IN SINCE WE HAVE INFRASTRUCTURE SETUP LIKE STORING 
	COOKIES IF THE STATE RETURNS FALSE THEN WE REDIRECT THE 
	USER TO THE HOMEPAGE FOR GUESTS
*/
router.get('/', (req, res)=>{
	if(session.loginState == true){
		res.render('userlanding', {
			msg: {
				user: session.user.username
			}
		});
	}else{
		res.render('index', {
			msg: {
				user: "Guest"
			}
		});
	}
})

/*
	THIS ROUTE HANDLES THE REQUEST OF ADDING A QUESTION BY
	RENDERING A FORM FOR THE USER TO ASK A QUESTION
*/
router.get('/addquestion', (req, res)=>{
	res.render('addQuestion');
});

/*
	THIS ROUTE HANDLES THE REQUEST TO LOGIN INTO THE PLATFORM
	BY RENDERING A LOGIN FORM.
*/
router.get('/loginForm', (req, res)=>{
	res.render('form');
});

/*
	THIS ROUTE GET THE USER DETAILS FROM THE FORM AND MAKES A FEW VALIDATION
	AND THEN SUBSEQUENTLY SET THE SESSION STATE WITH THE LOGGED USER AND RENDERS
	THE LANDING PAGE FOR THE NEW GUEST.
*/
router.post('/login',(req, res)=>{
	let _username = req.body.username.toString();
	let _password = req.body.password.toString();
	let found = false;
	users.map(user=>{
		found = (user.username == _username && user.password == _password) ? true : found;
	});
	if(found == true){
		session.loginState = true;
		session.user = {
			username: _username,
			userId: getStoredUserId(users, _username),
			email: getStoredUserEmail(users, _username)
		}
		res.render('userlanding', {
			msg: {
				user: _username
			}
		});
	}else{
		res.render('error', {
			error: {
				errorMsg: "Sign up to create an account",
				errorType: "User Not Found"
			}
		});
	}
});

/*
	THIS ROUTES HANDLES THE SIGN UP REQUEST AND FOLLOWS THROUGH 
	BY RENDERING A FORM FOR THE USER TO ENTER DETAILS.
*/
router.get('/signUpForm', (req, res)=>{
	res.render('signup');
});

/*
	THIS ROUTES HAS THE SUBMITTED SIGNUP FORM, MAKES A FEW VALIDATION
	AND CREATES THE USER, AND SETS THE SESSION STATE.
*/
router.post('/signup',(req, res)=>{
	let username = req.body.username;
	let email = req.body.email;
	let password = req.body.password;
	let found = false;
	users.map(user=>{
		found = (user.username == username) ? true : found;
	});
	if(found == false){
		let tempUserId = generateUniqueId(users, "userId");
		users.push({
			username: username,
			email: email,
			password: password,
			userId: tempUserId
		});
		session.loginState = true;
		session.user = {
			username: username,
			userId: tempUserId,
			email: email,
			password: password
		}
		res.render('userlanding', {
			msg: {
				user: username
			}
		});
	}else{
		res.render('error', {
			error: {
				errorMsg: "Sign up with a different username",
				errorType: "Username Already Exists"
			}
		});
	}
});

/*
	THIS ROUTE RENDER THE USERS PROFILE 
	PAGE WITH INFO FROM SESSION OBJECT.
*/
router.get('/profile', (req, res)=>{
	res.render('userprofile', {
		user: session.user
	})
});

/*
	THIS ROUTE HANDLES THE LOG OUT REQUEST 
	AND LOGS THE USER OUT OF THE PLATFORM.
*/
router.get('/logout', (req, res)=>{
	session = [];
	res.redirect('/api/v1');
});

export default router;