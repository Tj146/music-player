import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import data from "../data/songs.json" with { type: "json" };

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/songs.json");

router.get("/", (req, res) => {
    res.json(data.songs);
});

router.patch("/:id/like", (req, res) => {
    const song = data.songs.find(s => s.id == req.params.id);

    if (!song) {
        return res.status(404).json({
            message: "Song not found"
        });
    }

    const { liked } = req.body;

    if (liked) {
        song.likes = (song.likes || 0) + 1;
    } else {
        song.likes = Math.max(0, (song.likes || 0) - 1);
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));

    res.json(song);
});

export default router;