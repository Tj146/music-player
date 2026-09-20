import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

import data from "../data/songs.json" with { type: "json" };

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "../data/songs.json");

const uploadsPath = "/app/storage";
const coversPath = path.join(uploadsPath, "upload-covers");
const videosPath = path.join(uploadsPath, "upload-videos");

fs.mkdirSync(coversPath, { recursive: true });
fs.mkdirSync(videosPath, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "cover") {
            cb(null, coversPath);
        } else if (file.fieldname === "video") {
            cb(null, videosPath);
        } else {
            cb(new Error("Invalid file field"));
        }
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);

        const safeName = path
            .basename(file.originalname, extension)
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .toLowerCase();

        cb(
            null,
            `${Date.now()}-${safeName}${extension}`
        );
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 500 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (file.fieldname === "cover") {

            if (file.mimetype.startsWith("image/")) {
                cb(null, true);
            } else {
                cb(new Error("Cover must be an image."));
            }

        } else if (file.fieldname === "video") {

            if (file.mimetype.startsWith("video/")) {
                cb(null, true);
            } else {
                cb(new Error("Playlist background must be a video."));
            }

        } else {
            cb(new Error("Invalid file."));
        }
    }
});

function saveData() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4)
    );
}


/* =========================
   GET PLAYLISTS
========================= */

router.get("/", (req, res) => {
    res.json(data.playlists || []);
});


/* =========================
   CREATE PLAYLIST
========================= */

router.post(
    "/",
    upload.fields([
        {
            name: "cover",
            maxCount: 1
        },
        {
            name: "video",
            maxCount: 1
        }
    ]),
    (req, res) => {

        try {

            const name = req.body.name?.trim();

            const coverFile = req.files?.cover?.[0];
            const videoFile = req.files?.video?.[0];

            if (!name) {
                return res.status(400).json({
                    message: "Playlist name is required."
                });
            }

            if (!coverFile) {
                return res.status(400).json({
                    message: "Playlist cover is required."
                });
            }

            if (!videoFile) {
                return res.status(400).json({
                    message: "Playlist video is required."
                });
            }

            const newPlaylist = {
                id: Date.now(),

                name,

                cover:
                    `/media/upload-covers/${coverFile.filename}`,

                video:
                    `/media/upload-videos/${videoFile.filename}`,

                songs: [],

                likes: 0
            };

            if (!data.playlists) {
                data.playlists = [];
            }

            data.playlists.push(newPlaylist);

            saveData();

            res.status(201).json(newPlaylist);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to create playlist."
            });
        }
    }
);


/* =========================
   LIKE / UNLIKE PLAYLIST
========================= */

router.patch("/:id/like", (req, res) => {

    const playlist = data.playlists.find(
        p => p.id == req.params.id
    );

    if (!playlist) {
        return res.status(404).json({
            message: "Playlist not found."
        });
    }

    const { liked } = req.body;

    if (liked) {
        playlist.likes =
            (playlist.likes || 0) + 1;
    } else {
        playlist.likes =
            Math.max(0, (playlist.likes || 0) - 1);
    }

    saveData();

    res.json(playlist);
});


/* =========================
   ADD SONG
========================= */

router.post("/:id/songs", (req, res) => {

    const playlist = data.playlists.find(
        p => p.id == req.params.id
    );

    if (!playlist) {
        return res.status(404).json({
            message: "Playlist not found."
        });
    }

    const songId = req.body.songId;

    if (songId === undefined) {
        return res.status(400).json({
            message: "Song ID is required."
        });
    }

    if (!playlist.songs.includes(songId)) {
        playlist.songs.push(songId);
    }

    saveData();

    res.json(playlist);
});


/* =========================
   REMOVE SONG
========================= */

router.delete(
    "/:id/songs/:songId",
    (req, res) => {

        const playlist = data.playlists.find(
            p => p.id == req.params.id
        );

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found."
            });
        }

        playlist.songs = playlist.songs.filter(
            id => id != req.params.songId
        );

        saveData();

        res.json(playlist);
    }
);


export default router;