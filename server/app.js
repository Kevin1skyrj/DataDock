import express from 'express';

const app = express();
const port = 4000;

app.get('/', (req, res) =>{
  res.end('Hello World i am going to learn Backend');
  console.log("Your app is running");
})
app.listen(port);