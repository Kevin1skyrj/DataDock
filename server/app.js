import express from "express";
const port = 4000;
const app = express();

app.use(express.static('storage'));
app.get('/',(req,res) =>{
    res.send('Hello World!')
})

app.listen(port,()=>{
    console.log(`app listening on port ${port}`);
})