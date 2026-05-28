"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const URL = "http://localhost:4000/";

  const [directoryItems, setDirectoryItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newFilename, setNewFilename] = useState("");

  async function getDirectoryItems() {
    try {
      const response = await fetch(URL);
      const data = await response.json();

      setDirectoryItems(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getDirectoryItems();
  }, []);

  async function uploadFile(e) {
    const file = e.target.files[0];

    if (!file) return;

    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${URL}${file.name}`, true);

    // xhr.setRequestHeader("filename", file.name);

    xhr.addEventListener("load", () => {
      console.log(xhr.response);

      getDirectoryItems();
    });

    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;

      setProgress(totalProgress.toFixed(2));
    });

    xhr.send(file);
  }

  async function handleDelete(filename) {
    try {
      const response = await fetch(`${URL}${filename}`, {
        method: "DELETE",
      });

      const data = await response.text();

      console.log(data);

      getDirectoryItems();
    } catch (error) {
      console.log(error);
    }
  }

  function renameFile(oldFilename) {
    setNewFilename(oldFilename);
  }

  async function saveFilename(oldFilename) {
    try {
      const response = await fetch(`${URL}${oldFilename}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldFilename,
          newFilename,
        }),
      });

      const data = await response.json();

      console.log(data);

      setNewFilename("");

      getDirectoryItems();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>My Files</h1>

      <input type="file" onChange={uploadFile} />

      <br />
      <br />

      <input
        type="text"
        placeholder="Rename file"
        value={newFilename}
        onChange={(e) => setNewFilename(e.target.value)}
      />

      <p>Progress: {progress}%</p>

      {directoryItems.map((item, i) => (
        <div key={i} style={{ marginBottom: "10px" }}>
          {item}{" "}
          <a
            href={`${URL}${item}?action=open`}
            target="_blank"
          >
            Open
          </a>{" "}
          <a
            href={`${URL}${item}?action=download`}
          >
            Download
          </a>{" "}
          <button onClick={() => renameFile(item)}>
            Rename
          </button>{" "}
          <button onClick={() => saveFilename(item)}>
            Save
          </button>{" "}
          <button onClick={() => handleDelete(item)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}