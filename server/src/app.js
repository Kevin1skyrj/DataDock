import express from "express";
import cors from 'cors';
import apiRouter from "./routes/index.js";
const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN;
if(!clientOrigin){
  throw new Error("CLIENT_ORIGIN is missing from environment variables");
}

app.use(cors({
     origin: clientOrigin,
     credentials: true,
}))
app.use(express.json());

app.use('/api/v1', apiRouter);

app.get("/", (req, res) => {
  res.send("Hello World i am going to learn Backend");
});
export default app;
