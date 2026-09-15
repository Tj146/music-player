import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import songsRouter from "./routes/songs.js";
import playlistsRouter from "./routes/playlists.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
Project structure:

My Music Player/
├── backend/
│   └── server.js
└── frontend/
    └── index.html
*/

const frontendPath = path.join(__dirname, "../frontend");

app.use(cors());
app.use(express.json());

/* API routes */
app.use("/api/songs", songsRouter);
app.use("/api/playlists", playlistsRouter);

/* Serve frontend files */
app.use(express.static(frontendPath));

/* Serve the home page */
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Website running at http://localhost:${PORT}`);
    console.log(`Songs API: http://localhost:${PORT}/api/songs`);
    console.log(`Playlists API: http://localhost:${PORT}/api/playlists`);
});