import express from "express";
import cors from 'cors';
const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN;
if(!clientOrigin){
  throw new Error("CLIENT_ORIGIN is missing from environment variables");
}
app.use(express.json());
app.use(cors({
     origin: clientOrigin,
     credentials: true,
}))

app.get("/", (req, res) => {
  res.send("Hello World i am going to learn Backend");
});
export default app;
