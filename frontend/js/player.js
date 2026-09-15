let currentList = [];
let currentIndex = 0;
let isPlaying = false;

let currentPlaylistVideo = null;
let activeVideoSrc = null;

let hideUITimer = null;

/*ELEMENTS*/
const player = document.getElementById("player");
const audio = document.getElementById("audio");

const playerVideo = document.getElementById("playerVideo");
const albumCover = document.getElementById("albumCover");

const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");

const likeSongBtn = document.getElementById("likeSong");
const songLikes = document.getElementById("songLikes");

const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const previousBtn = document.getElementById("previous");
const shuffleBtn = document.getElementById("shuffle");

const closePlayer = document.getElementById("closePlayer");

const progress = document.getElementById("progress");
const progressContainer = document.querySelector(".progress-container");

const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");

/*INITIAL VIDEO SETUP*/
if (playerVideo) {
    playerVideo.muted = true;
    playerVideo.loop = true;

    playerVideo.setAttribute("muted", "");
    playerVideo.setAttribute("playsinline", "");
    playerVideo.setAttribute("webkit-playsinline", "");

    playerVideo.preload = "auto";
    playerVideo.style.pointerEvents = "none";
}

/*OPEN PLAYER*/
function openPlayer(list, index, playlistVideo = null) {
    if (!Array.isArray(list) || list.length === 0) {
        return;
    }
    currentList = list;
    currentIndex = Math.max(0,Math.min(index || 0, currentList.length - 1));
    currentPlaylistVideo = playlistVideo || null;
    clearTimeout(hideUITimer);
    /*Start with UI visible */
    if (player) {
        player.classList.remove("hide-ui");
    }
    /* Playlist mode */
    if (player) {
        if (currentPlaylistVideo) {
            player.classList.add("playlist-mode");
        } else {
            player.classList.remove("playlist-mode");
        }
    }

    updateVisualMode();
    loadSong();
    if (player) {
        player.classList.add("show");
    }
    playSong();
    startHideTimer();
}

/*VISUAL MODE*/
function updateVisualMode() {
    if (!albumCover) {
        return;
    }
    if (currentPlaylistVideo) {
        albumCover.style.display = "none";
    } else {
        albumCover.style.display = "block";
    }
}

/*SETUP PLAYLIST VIDEO*/
function setupPlaylistVideo() {
    if (!playerVideo) {
        return;
    }
    /*Normal songs do not use the playlist video.*/
    if (!currentPlaylistVideo) {
        stopPlaylistVideo();
        return;
    }
    let videoURL = currentPlaylistVideo;
    /*Convert relative URL to absolute URL.*/
    try {
        videoURL = new URL(videoURL, window.location.origin).href;
    } catch (error) {
        console.error("Invalid playlist video URL:", currentPlaylistVideo);
        return;
    }
    if (activeVideoSrc !== videoURL) {
        playerVideo.pause();
        activeVideoSrc = videoURL;
        playerVideo.src = videoURL;
        playerVideo.load();
    }

    /*Make video visible.*/
    playerVideo.classList.add("show");
}

/*START PLAYLIST VIDEO */
function startPlaylistVideo() {
    if (!playerVideo || !currentPlaylistVideo) {
        return;
    }
    playerVideo.muted = true;
    playerVideo.loop = true;
    /*If the video hasn't been loaded yet,prepare it.*/
    if (playerVideo.readyState === 0) {
        setupPlaylistVideo();
    }
    /*Only call play() when the video is actually paused.*/
    if (playerVideo.paused) {

        const videoPromise = playerVideo.play();
        if (videoPromise && typeof videoPromise.catch === "function") {

            videoPromise.catch(error => {
                console.warn("Playlist video playback failed:",error);
            });
        }
    }
}

/*STOP PLAYLIST VIDEO*/
function stopPlaylistVideo() {
    if (!playerVideo) {
        return;
    }
    playerVideo.pause();
    playerVideo.classList.remove("show");
    /*Completely unload the video.*/
    playerVideo.removeAttribute("src");
    playerVideo.load();
    activeVideoSrc = null;
}

/*LOAD SONG*/
function loadSong() {
    const song = currentList[currentIndex];
    if (!song) {
        return;
    }
    /*Title*/
    if (songTitle) {
        songTitle.textContent = song.title || "Unknown Song";
    }
    /*Artist*/
    if (songArtist) {
        songArtist.textContent = song.artist || "Unknown Artist";
    }
    /*Audio*/
    if (audio) {
        audio.src = song.file || song.audio || song.url ||"";
        audio.load();
    }
    /*Album cover*/
    if (albumCover) {
        albumCover.src = song.cover || song.albumCover || song.image || "";
        if (currentPlaylistVideo) {
            albumCover.style.display = "none";
        } else {
            albumCover.style.display = "block";
        }
    }
    /*Likes*/
    if (songLikes) {
        songLikes.textContent =song.likes || 0;
    }
    /*Like state*/
    if (likeSongBtn) {
        let likedSongs = [];
        try {
            likedSongs = JSON.parse(localStorage.getItem("likedSongs")) || [];
        } catch (error) {
            likedSongs = [];
        }
        likeSongBtn.classList.toggle("liked",likedSongs.includes(song.id));
    }
    /*Reset progress*/
    if (progress) {
        progress.style.width = "0%";
    }
    if (currentTime) {
        currentTime.textContent = "0:00";
    }
    if (totalTime) {
        totalTime.textContent = "0:00";
    }
    /*Playlist video*/
    if (currentPlaylistVideo) {

        setupPlaylistVideo();

    } else {

        stopPlaylistVideo();
    }

    updatePlayButton();
}

/*PLAY SONG*/
function playSong() {
    if (!audio || !audio.src) {
        return;
    }
    const audioPromise = audio.play();
    if (audioPromise && typeof audioPromise.then === "function") {
        audioPromise.then(() => {
            isPlaying = true;
            updatePlayButton();
            /*Playlist video only.*/
            if (currentPlaylistVideo) {
                startPlaylistVideo();
            }
            startHideTimer();
        })
            .catch(error => {
                console.error("Audio playback error:",error);
                isPlaying = false;
                updatePlayButton();
            });
    } else {
        isPlaying = true;
        updatePlayButton();
        if (currentPlaylistVideo) {
            startPlaylistVideo();
        }
        startHideTimer();
    }
}

/*PAUSE SONG*/
function pauseSong() {
    if (audio) {
        audio.pause();
    }
    if (playerVideo) {
        playerVideo.pause();
    }
    isPlaying = false;
    clearTimeout(hideUITimer);
    if (player) {
        player.classList.remove("hide-ui");
    }
    updatePlayButton();
}

/*TOGGLE PLAY / PAUSE*/
function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

/*PLAY BUTTON UI*/
function updatePlayButton() {
    if (!playBtn) {
        return;
    }
    if (isPlaying) {
        playBtn.textContent = "❚❚";
        playBtn.setAttribute("aria-label", "Pause");
    } else {
        playBtn.textContent = "▶";
        playBtn.setAttribute("aria-label", "Play");
    }
}

/*NEXT SONG*/
function nextSong() {
    if (!currentList.length) {
        return;
    }
    currentIndex++;
    if (currentIndex >= currentList.length) {
        currentIndex = 0;
    }
    loadSong();
    playSong();
    showPlayerUI();
}

/*PREVIOUS SONG*/
function previousSong() {
    if (!currentList.length) {
        return;
    }
    /*If more than 3 seconds into the song,restart the current song instead of going to the previous song.*/
    if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        if (progress) {
            progress.style.width = "0%";
        }
        return;
    }
    currentIndex--;
    if (currentIndex < 0) {
        currentIndex = currentList.length - 1;
    }
    loadSong();
    playSong();
    showPlayerUI();
}

/*SHUFFLE*/
function shuffleSong() {
    if (currentList.length <= 1) {
        return;
    }
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * currentList.length);
    } while (newIndex === currentIndex);
    currentIndex = newIndex;
    loadSong();
    playSong();
    showPlayerUI();
}

/*CLOSE PLAYER*/
function closePlayerNow() {
    /*Stop UI timer.*/
    clearTimeout(hideUITimer);
    /*Stop audio completely.*/
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute("src");
        audio.load();
    }
    /*Stop and unload playlist video.*/
    stopPlaylistVideo();
    /*Restore album cover.*/
    if (albumCover) {
        albumCover.style.display = "block";
    }
    /*Reset state.*/
    isPlaying = false;
    currentList = [];
    currentIndex = 0;
    currentPlaylistVideo = null;
    /*Remove player classes.*/
    if (player) {
        player.classList.remove("show");
        player.classList.remove("playlist-mode");
        player.classList.remove("hide-ui");
    }
    /*Reset button.*/
    updatePlayButton();
}

/*UI AUTO-HIDE*/
function startHideTimer() {
    clearTimeout(hideUITimer);
    /*Only playlist players get auto-hide.Normal songs ALWAYS keep their controls visible.*/
    if (!currentPlaylistVideo || !isPlaying) {
        if (player) {
            player.classList.remove("hide-ui");
        }
        return;
    }

    hideUITimer = setTimeout(() => {
        if (isPlaying && currentPlaylistVideo && player && player.classList.contains("show")) {
            player.classList.add("hide-ui");
        }

    }, 6000);
}

/*SHOW CONTROLS*/
function showPlayerUI() {
    if (!player) {
        return;
    }
    player.classList.remove("hide-ui");
    /*Restart timer only for playlist mode.*/
    startHideTimer();
}

/*USER ACTIVITY*/
function registerUserActivity() {
    if (!player || player.classList.contains("show")) {
        return;
    }
    showPlayerUI();
}

/*AUDIO EVENTS*/
if (audio) {
    /*Play*/
    audio.addEventListener("play", () => {
        isPlaying = true;
        updatePlayButton();
        if (currentPlaylistVideo) {
            startPlaylistVideo();
        }
        startHideTimer();
    });
    /*Pause*/
    audio.addEventListener("pause", () => {
        isPlaying = false;
        clearTimeout(hideUITimer);
        if (playerVideo && currentPlaylistVideo) {
            playerVideo.pause();
        }
        if (player) {
            player.classList.remove("hide-ui");
        }
        updatePlayButton();
    });
    /*Time update*/
    audio.addEventListener("timeupdate", () => {
        if (!audio.duration) {
            return;
        }
        const percent = (audio.currentTime / audio.duration) * 100;
        if (progress) {
            progress.style.width = `${percent}%`;
        }
        if (currentTime) {
            currentTime.textContent = formatTime(audio.currentTime);
        }
        if (totalTime) {
            totalTime.textContent = formatTime(audio.duration);
        }
    });
    /*Loaded metadata*/
    audio.addEventListener("loadedmetadata", () => {
        if (totalTime) {
            totalTime.textContent = formatTime(audio.duration);
        }
    }
    );
    /*Song ended*/
    audio.addEventListener("ended", () => {
        if (currentList.length > 1) {
            currentIndex++;
            if (currentIndex >= currentList.length) {
                currentIndex = 0;
            }
            loadSong();
            playSong();
        } else {
            isPlaying = false;
            if (playerVideo) {
                playerVideo.pause();
            }
            if (player) {
                player.classList.remove("hide-ui");
            }
            updatePlayButton();
        }
    });
}


/*PROGRESS BAR*/
if (progressContainer) {
    progressContainer.addEventListener("click", (event) => {
        if (!audio || !audio.duration) {
            return;
        }

        const rect = progressContainer.getBoundingClientRect();
        const clickPosition = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
        audio.currentTime = percentage * audio.duration;
        showPlayerUI();
    });
}


/*BUTTON EVENTS*/
if (playBtn) {
    playBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePlay();
        showPlayerUI();
    });
}
if (nextBtn) {
    nextBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        nextSong();
    });
}
if (previousBtn) {
    previousBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        previousSong();
    });
}
if (shuffleBtn) {
    shuffleBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        shuffleSong();
    });
}

/*CLOSE BUTTON*/
if (closePlayer) {
    closePlayer.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closePlayerNow();
    }
    );
}

/*SONG LIKE BUTTON*/
if (likeSongBtn) {
    likeSongBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const song = currentList[currentIndex];
        if (!song) {
            return;
        }

        if (likeSongBtn.dataset.loading === "true") {
            return;
        }
        likeSongBtn.dataset.loading = "true";
        try {
            let likedSongs = [];
            try {
                likedSongs = JSON.parse(localStorage.getItem("likedSongs")) || [];
            } catch (error) {
                likedSongs = [];
            }

            const alreadyLiked = likedSongs.includes(song.id);
            let result = null;
            if (typeof toggleSongLike === "function") {
                result = await toggleSongLike(song.id, !alreadyLiked);
                /*Use the server's returned like count.*/
                if (result && typeof result.likes !== "undefined") {
                    song.likes = result.likes;
                    if (songLikes) {
                        songLikes.textContent = result.likes;
                    }
                }
            }
            /*Update local liked state.*/
            if (alreadyLiked) {
                likedSongs = likedSongs.filter(id => id !== song.id);
                likeSongBtn.classList.remove("liked");
            } else {
                if (!likedSongs.includes(song.id)) {
                    likedSongs.push(song.id);
                }
                likeSongBtn.classList.add("liked");
            }

            localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
        } catch (error) {
            console.error("Could not update song like:", error);
        } finally {
            likeSongBtn.dataset.loading = "false";
        }

        showPlayerUI();
    }
    );
}

/*USER ACTIVITY EVENTS*/
if (player) {
    [
        "mousemove",
        "mousedown",
        "touchstart",
        "keydown"
    ].forEach(eventName => {
        player.addEventListener(eventName, registerUserActivity, { passive: true });
    });
}

/*KEYBOARD CONTROLS*/
document.addEventListener("keydown", (event) => {
    if (!player || !player.classList.contains("show")) {
        return;
    }
    const tag = document.activeElement?.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
    }

    switch (event.code) {
        /* Space */
        case "Space":
            event.preventDefault();
            togglePlay();
            showPlayerUI();
            break;
        /* Forward 5 seconds */
        case "ArrowRight":
            if (audio && audio.duration) {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
                showPlayerUI();
            }
            break;
        /* Back 5 seconds */
        case "ArrowLeft":
            if (audio && audio.duration) {
                audio.currentTime = Math.max(0, audio.currentTime - 5);
                showPlayerUI();
            }
            break;
        /* Close */
        case "Escape":
            closePlayerNow();
            break;
    }
}
);

/*TIME FORMAT*/
function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");

    return `${minutes}:${secs}`;
}

/*GLOBAL ACCESS */
window.openPlayer = openPlayer;
window.closePlayer = closePlayerNow;
window.playSong = playSong;
window.pauseSong = pauseSong;
window.nextSong = nextSong;
window.previousSong = previousSong;
window.shuffleSong = shuffleSong;
window.togglePlay = togglePlay;
window.showPlayerUI = showPlayerUI;
window.loadSong = loadSong;

/*INITIAL STATE*/
if (player) {
    player.classList.remove("show");
    player.classList.remove("hide-ui");
    player.classList.remove("playlist-mode");
}
if (playerVideo) {
    playerVideo.classList.remove("show");
}

updatePlayButton();