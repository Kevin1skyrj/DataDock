import express from "express";
import cors from "cors";
import { readdir } from "fs/promises";

const port = 4000;

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from storage folder

// app.use((req,res,next) =>{
//   if(req.query.action === "download"){
//     res.setHeader("Content-Disposition", "attachment");
//   }
//   const serveStatic = express.static('storage');
//   serveStatic(req,res,next);
// })

// dynamic routing

app.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  if(req.query.action === "download"){
    res.setHeader("Content-Disposition", "attachment");
  }
  res.sendFile(`${import.meta.dirname}/storage/${filename}`);
})
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