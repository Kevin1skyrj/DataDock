import express from "express";
import { connectToDatabase } from "./src/config/db.js";
const app = express();
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello World i am going to learn Backend");
});
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server Started on the ${port}`);
    });
  } catch(error) {
    console.error('Failed to start the Server', error.message);
    process.exit(1);
  }
}
startServer();
