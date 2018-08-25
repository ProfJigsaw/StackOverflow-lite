import express from 'express';
import path from 'path';
import cons from 'consolidate';
import expressApiVersioning from 'express-api-versioning';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 8080;

app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', path.join(__dirname, '/api/v1/views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(expressApiVersioning({
  apiPath: path.join(__dirname, './api'),
  test: /\/api\/(v[0-9]+).*/,
  entryPoint: 'index.js',
  instance: app,
}, (error, req, res, next) => {
  require('./client/index').default(app);
  next();
}));

app.listen(port);
export default app;
