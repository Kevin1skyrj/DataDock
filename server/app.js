import express from "express";
import cors from "cors";
import path from "path";
// import some from "some-package";
import { readdir, rename, rm } from "fs/promises";
import { createWriteStream } from "fs";

const port = 4000;

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

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

// Create
app.post("/:filename",(req,res) => {
  const writeStream = createWriteStream(`./storage/${req.params.filename}`);
  req.pipe(writeStream);
  req.on("end", () => {
    res.json({
      message: "File uploaded successfully",
    });
  });
})

// Read
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

// Update
app.patch("/:filename", async (req,res) => {
  const {filename} = req.params;
  await rename(`./storage/${filename}`, `./storage/${req.body.newFilename}`);
  res.json({
    message: "File renamed successfully",
  });
})

// Delete
app.delete("/:filename", async (req,res) => {
  const {filename} = req.params;
  const filePath = `./storage/${filename}`;
  try {
    await rm(filePath);
    res.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      message: "File not found",
    });
  }
});
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});