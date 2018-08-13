import express from 'express';
import dbpackage from '../model/dbstruct';
import getUser from '../helpers/getSessionUser';
import generateUniqueId from '../helpers/genUniqueId';
import mode from '../helpers/mode';
const router = express.Router();

/*
	DESTRUCTURING AND SETTING THE INITIAL STATE OF 
	QUESTIONS AND ANSWERS USING THE SUGAR FLAVOURED ES6 SYNTAX
*/
let { questions, answers } = dbpackage;

/*
	ROUTE TO HANDLE THE PAGE THE USER SEES WHEN THEY REQUEST
	ALL THE QUESTIONS THAT HAS BEEN POSTED ON THE PLATFORM.
*/
router.get('/', (req, res)=>{
	res.render('questionsLog', {
		questions
	});
});

/*
	ROUTE TO HANDLE UNAUTHORIZED ATTEMPT TO SEARCH FOR QUESTIONS 
	ON THE PLATFORM WITH CREATING AN ACCOUNT OR LOGGING IN
*/
router.post('/error', (req, res)=>{
	res.render('error', {
		error: {
			errorMsg: 'Please log In or create an account to enable searching.',
			errorType: "Not Logged In Yet" 
		}
	})
})

/*
	ROUTE TO OBTAIN A PARTICULAR QUESTION POSTED 
	BASED ON THE ID PROVIDED BY THE USER.
*/
router.get('/:id', (req, res)=>{
	let id = req.params.id;
	let found = questions.filter(o=>o.questionId == id);
	if(found.length === 1){
		let qId = found[0].questionId;
		let answerForQuestion = answers.filter(o=>o.questionId === qId);
		res.render('questionsLog', {
			questions: found[0]
		});
	}else{
		res.render('usererror', {
			error: {
				errorMsg: `Question Id: ${id} does not exit`,
				errorType: "Invalid Question Id"
			}
		});
	}
});

/*
	HANDLING THE REQUEST TO VIEW A QUESTION THREAD
*/
router.get('/questionThread/:qId', (req, res)=>{
	let id = req.params.qId;
	let found = questions.filter(o=>o.questionId == id);
	if(found.length === 1){
		let qId = found[0].questionId;
		let answerForQuestion = answers.filter(o=>o.questionId === qId);
		res.render('threadlog', {
			questions: found[0],
			answers: answerForQuestion
		});
	}else{
		res.status(404).send();
	}
});

/*
	ROUTE TO HANDLE A SEARCH BY A LOGGED IN USER
*/
router.post('/findQuestion', (req, res)=>{
	let keyword = req.body.keyword;
	let found = questions.filter(o=>o.question.toLowerCase().indexOf(keyword.toLowerCase()) != -1);
	if(found.length != 0){
		res.render('questionsLog', {
			questions: found
		});
	}else{
		res.render('usererror', {
			error: {
				errorMsg: `${keyword} not found. Try a different keyword.`,
				errorType: "Keyword not found"
			}
		})
	}
})
 
/*
	FIND A GIVEN QUESTION BY THE ID PROVIDED
*/
router.post('/findQuestionById', (req, res)=>{
	let qId = req.body.qid;
	let found = questions.filter(question=>question.questionId == qId);
	if(found.length != 0){
		res.render('questionsLog', {
			questions: found
		});
	}else{
		res.render('usererror', {
			error: {
				errorMsg: `${qId} not found. Try a different question Id.`,
				errorType: "Question Id Not Found"
			}
		})
	}
});

/*
	THIS ROUTE RECEIVES AND ADDS A NEW QUESTION
*/
router.post('/', (req, res)=>{
	questions.unshift({
		questionId: Number(generateUniqueId(questions, "questionId")),
		userId: Number(req.body.userId),
		username: req.body.username,
		question: req.body.question
	});
	res.redirect('/api/v1/questions');
});

/*
	ROUTE TO HANDLE THE ANSWER ENTERED BY A USER
*/
router.post('/:id/answers', (req, res)=>{
	let questId = req.params.id;
	let entPut = req.body.answer;
	answers.push({
		answerId: generateUniqueId(answers, "answerId"),
		questionId : Number(questId),
		userId : req.body.userId,
		username: req.body.username,
		answer : entPut,
		answerState: "",
		votes: 0,
		comments: []
	});
	res.redirect(`/api/v1/questions/questionThread/${questId}`);
});

/*
	ROUTE TO HANDLE A DELETE REQUEST FOR A PARTICULAR 
	QUESTION FROM THE CERTIFIED USER. IT DOES THIS IN 
	A SERIES OF STEPS:
	1. VALIDATE THE USER, SO ONLY THE USER WHO CREATED THE
	QUESTION IN QUESTION (lol :-), pun intended ) CAN DELETE IT.
	2. FILTER THE QUESTIONS AND LEAVE OUT THE QUESTION TO BE DELETED
*/
router.post('/:id/delete', (req, res)=>{
	let questId = req.params.id;
	let userId = req.body.userId;
	let goAhead = false;
	questions.map(question=>{
		if(question.questionId == questId && question.userId == userId)
			goAhead = true;
	})
	if(goAhead == true){
		questions = questions.filter(question=>question.questionId != questId);
		answers = answers.filter(answer=>answer.questionId != questId);
		res.redirect(`/api/v1/questions`);
	}else{
		res.render('usererror', {
			error: {
				errorMsg: 'You are not the author of this question, therefore you cant delete it',
				errorType: 'Delete Not Allowed'
			}
		})
	}
	
});

/*
	THIS ROUTE VALIDATES A USER WHO ISSUED AN ACCEPT ANSWER REQUEST
	AND CREATES AND ACCEPT-STATE BY ADDING AN ACCEPT CLASS WHICH 
	ADDS A GREEN BORDER TO THE ACCEPTED ANSWER.
*/
router.post('/:qId/:aId/accept', (req, res)=>{
	let questId = req.params.qId;
	let answerId = req.params.aId;
	let userId = req.body.userId;
	let goAhead = false;
	questions.map(question=>{
		if(question.questionId == questId && question.userId == userId)
			goAhead = true;
	})
	if(goAhead == true){
		answers.map(answer=>{
			if(answer.answerId == answerId){
				answer.acceptState = "accepted";
			}else{
				answer.acceptState = "";
			}
		});
		res.redirect(`/api/v1/questions/questionThread/${questId}`)
	}else{
		res.render('usererror', {
			error: {
				errorMsg: 'You are not the author of this question, therefore you can\'t accept it',
				errorType: 'Not Allowed'
			}
		})
	}
});

/*
	ROUTE TO HANDLE A VOTE UP REQUEST ON A PARTICULAR QUESTION
*/
router.get('/:qId/:aId/vote',(req, res)=>{
	answers.map(answer=>{
		if(answer.questionId == req.params.qId && answer.answerId == req.params.aId){
				answer.votes = answer.votes + 1;
		}
	});
	res.redirect(`/api/v1/questions/questionThread/${req.params.qId}`)
});

/*
	ROUTE TO HANDLE A VOTE DOWN REQUEST OF A PARTICULAR QUESTION,
	THIS ROUTE WILL NOT DO ANYTHING IF THE ANSWER VOTES ARE ALREADY AT ZERO
*/
router.get('/:downvote/:qId/:aId', (req, res)=>{
	answers.map(answer=>{
		if(answer.questionId == req.params.qId && answer.answerId == req.params.aId){
			if(answer.votes > 0){
				answer.votes = answer.votes - 1;
			}else{
				answer.votes = answer.votes;
			}
		}
	})
	res.redirect(`/api/v1/questions/questionThread/${req.params.qId}`)
})

/*
	ROUTE TO HANDLE REQUEST BY A USER TO SEE ALL THE
	QUESTIONS THAT THEY EVER POSTED ON THE PLATFOROM
*/
router.get('/user/:userId',(req, res)=>{
	let uId = req.params.userId;
	let userQuestions = questions.filter(qtn=>qtn.userId == uId);
	res.render('questionsLog', {
		questions: userQuestions
	});
});

/*
	ROUTE TO HANDLE REQUEST BY A USER TO SEE ALL THE 
	QUESTION THEY HAVE EVER GIVEN A RESPONSE TO.
*/
router.get('/questionsAnswered/:userId',(req, res)=>{
	let uId = req.params.userId;
	let qansd = [];
	answers.map(ans=>{
		if(ans.userId == uId)
			qansd.push(ans.questionId)
	});
	let foundquestions = [];
	qansd.map(id=>{
		questions.map(question=>{
			if(question.questionId == id)
				foundquestions.push(question);
		});
	});
	res.render('questionsLog', {
		questions: foundquestions
	});
});

/* 
	THIS ROUTE ALLOWS THE LOGGED USER TO VIEW THE QUESTION WITH 
	THE MOST ACTIVITY, THAT QUESTION WITH THE MOST ANSWERS/COMMENTS
*/
router.get('/top/question',(req, res)=>{
	let ansd_qtn = [];
	answers.map(answer=>ansd_qtn.push(answer.questionId));
	let modeqtn = mode(ansd_qtn);
	let topqtn = questions.filter(question=>question.questionId == modeqtn);
	res.render('questionsLog', {
		questions: topqtn
	});
});

/*
	ROUTE TO HANDLE ADDING OF COMMENTS TO A PARTICULAR ANSWER ON THE PLATFORM
*/
router.post('/addcomment/:qId/:answerId', (req, res)=>{
	let questId = req.params.qId;
	let ansId = req.params.answerId;
	let comment = req.body.comment;
	answers.map(ans=>{
		if(ans.questionId == questId && ans.answerId == ansId){
			ans.comments.push({
				commentId: generateUniqueId(ans.comments, "commentId"),
				comment: comment,
				userId : req.body.userId,
				username: req.body.username,
				questionId : questId
			});
		}
	});
	res.redirect(`/api/v1/questions/questionThread/${questId}`);
});


export default router