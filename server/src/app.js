import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send("Hello World i am going to learn Backend")
});
export default app;