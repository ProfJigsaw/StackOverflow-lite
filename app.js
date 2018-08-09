import express from 'express';
import path from 'path';
var app = express();

app.get('/',(req,res)=>{
    res.send('Hello You are all set');
});

app.listen(3000, ()=>console.log('Server started.'));