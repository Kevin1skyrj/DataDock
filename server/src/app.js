import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World i am going to learn Backend");
});
export default app;
