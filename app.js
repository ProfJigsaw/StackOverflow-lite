import express from 'express';

const app = express();
app.get('/', (req, res) => {
  res.send('Hello You are all set');
});

app.listen(3000);
