import express from 'express';
import questionspage from './questions';

const router = express.Router();

router.get('/', (req, res) => {
  res.send(`
  Welcome to StackOverflow-Lite!
  <p>To see the documetation of this API you can either: </p>
  <p>Follow <a href="/api-docs">this link</a> or Enter the following in the searchbar: <i>https://nvc-stackqa.herokuapp.com/api-docs.</i> </p>
  `);
});

router.use('/questions', questionspage);

export default router;
