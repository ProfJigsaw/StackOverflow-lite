import homepage from './controllers/index';
import questionspage from './controllers/questions';
import userpage from './controllers/users';
import authentication from './middleware/auth';

export default (app) => {
  app.use('/api/v1', homepage);
  app.use('/api/v1/questions', questionspage);
  app.use('/api/v1/auth', authentication);
  app.use('/api/v1/user', userpage);
};
