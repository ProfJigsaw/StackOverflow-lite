import express from 'express';
import path from 'path';
import cons from 'consolidate';
import expressApiVersioning from 'express-api-versioning';
import bodyParser from 'body-parser';

const app = express();

app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', path.join(__dirname, '/api/v1/views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressApiVersioning({
  apiPath: path.join(__dirname, './api'),
  test: /\/api\/(v[0-9]+).*/,
  entryPoint: 'index.js',
  instance: app,
}, (error, req, res, next) => {
  require('./client/index').default(app);
  next();
}));

app.get('/', (req, res) => {
  res.send('Hello You are all set');
});

app.listen(process.env.PORT || 3000);
export default app;