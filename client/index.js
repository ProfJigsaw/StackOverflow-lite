import homepage from './controllers/index';

export default (app) => {
  app.use('/', homepage);
};
