import express from "express";
import cors from "cors";
import { readdir } from "fs/promises";

const port = 4000;

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from storage folder
app.use(express.static("storage"));

// Get all files from storage folder
app.get("/", async (req, res) => {
  try {
    const filesList = await readdir("./storage");

    res.json(filesList);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error reading storage folder",
    });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});