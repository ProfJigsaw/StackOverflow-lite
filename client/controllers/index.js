import express from 'express';
import questionspage from './questions';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('welcome to StackOverflow-Lite');
});

router.use('/questions', questionspage);

export default router;
