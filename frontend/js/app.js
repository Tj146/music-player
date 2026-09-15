let allSongs = [];
let allPlaylists = [];
let currentOpenPlaylist = null;

/*ELEMENTS*/
const songGrid = document.getElementById("songGrid");
const playlistGrid = document.getElementById("playlistGrid");
const playlistSongGrid = document.getElementById("playlistSongGrid");
const playlistName = document.getElementById("playlistName");

const searchInput = document.getElementById("searchInput");
const playlistSearchInput = document.getElementById("playlistSearchInput");

const showCreatePlaylistBtn = document.getElementById("showCreatePlaylistBtn");
const createPlaylistForm = document.getElementById("createPlaylistForm");
const newPlaylistName = document.getElementById("newPlaylistName");
const newPlaylistCover = document.getElementById("newPlaylistCover");
const newPlaylistVideo = document.getElementById("newPlaylistVideo");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");

const showAddSongsBtn = document.getElementById("showAddSongsBtn");
const addSongsPanel = document.getElementById("addSongsPanel");
const availableSongsGrid = document.getElementById("availableSongsGrid");

/*SONG SELECTION*/
let selectedSongIds = new Set();
let addSelectedSongsBtn = null;

/*PAGE NAVIGATION*/
const pages = document.querySelectorAll(".page");

function showPage(id) {
    pages.forEach(page => {
        page.classList.remove("active");
    });
    const page = document.getElementById(id);
    if (page) {
        page.classList.add("active");
    }
}
document.querySelectorAll("[data-page]").forEach(button => {
    button.onclick = () => {
        showPage(button.dataset.page);
    };
});

/*SONG CARD*/
function createSongCard(song, list, index, playlistVideo = null) {
    const card = document.createElement("div");

    card.className = "song-card";
    card.innerHTML = ` 
        <img 
        src="${song.cover}" 
        alt="${song.title}" 
        > 
        <h3>
        ${song.title}
        </h3> 
        <p>
        ${song.artist}
        </p> 
        <span class="likes">
        ♡ ${song.likes || 0} 
        </span> 
        `;
    card.onclick = () => {
        openPlayer(list, index, playlistVideo);
    };
    return card;
}

/*DISPLAY SONGS*/
function displaySongs(songList = allSongs) {
    if (!songGrid) return;

    songGrid.innerHTML = "";

    songList.forEach((song, index) => {
        songGrid.appendChild(createSongCard(song, songList, index, null));
    });
}

/*DISPLAY PLAYLISTS*/
function displayPlaylists(playlistList = allPlaylists) {
    if (!playlistGrid) return;

    playlistGrid.innerHTML = "";

    const likedPlaylists = JSON.parse(localStorage.getItem("likedPlaylists")) || [];

    playlistList.forEach(playlist => {

        const card = document.createElement("div");
        card.className = "playlist-card";
        card.innerHTML = ` 
            <img 
            src="${playlist.cover}"
            alt="${playlist.name}"
            >
            <h3>
            ${playlist.name}
            </h3>
            <p> 
            ${playlist.songs.length} songs 
            </p> 
            <button class="playlist-like-btn" type="button" >
            ♡ 
            <span>
            ${playlist.likes || 0}
            </span>
            </button> 
            `;
        card.onclick = () => {
            openPlaylist(playlist);
        };

        /*LIKE PLAYLIST*/
        const likeBtn = card.querySelector(".playlist-like-btn");

        likeBtn.classList.toggle("liked", likedPlaylists.includes(playlist.id));
        likeBtn.onclick = async event => {
            event.stopPropagation();

            let liked = JSON.parse(localStorage.getItem("likedPlaylists")) || [];

            const alreadyLiked = liked.includes(playlist.id);

            try {
                const updated = await togglePlaylistLike(playlist.id, !alreadyLiked);

                playlist.likes = updated.likes;

                likeBtn.querySelector("span").textContent = updated.likes;
                if (alreadyLiked) {
                    liked = liked.filter(id => id !== playlist.id);
                    likeBtn.classList.remove("liked");
                }
                else {
                    liked.push(playlist.id);
                    likeBtn.classList.add("liked");
                }

                localStorage.setItem("likedPlaylists", JSON.stringify(liked));
            } catch (error) {
                console.error(error);
                alert("Could not update playlist like.");
            }
        };
        playlistGrid.appendChild(card);
    });
}

/* OPEN PLAYLIST*/
function openPlaylist(playlist) {
    currentOpenPlaylist = playlist;

    if (playlistName) {
        playlistName.textContent = playlist.name;
    }
    playlistSongGrid.innerHTML = "";
    availableSongsGrid.innerHTML = "";

    if (addSongsPanel) {
        addSongsPanel.classList.add("hidden");
    }
    /*Clear any previous song selections.*/
    selectedSongIds.clear();

    if (addSelectedSongsBtn) {
        addSelectedSongsBtn.disabled = true;
        addSelectedSongsBtn.textContent = "Add Selected";
    }
    const playlistSongs = playlist.songs.map(id => allSongs.find(song => song.id == id)).filter(Boolean);

    /*Songs already in playlist*/
    playlistSongs.forEach((song, index) => {
        const card = createSongCard(song, playlistSongs, index, playlist.video || null);
        const removeBtn = document.createElement("button");

        removeBtn.className = "remove-song-btn";
        removeBtn.textContent = "Remove";

        removeBtn.onclick = async event => {
            event.stopPropagation();
            try {
                const updated = await removeSongFromPlaylist(playlist.id, song.id);
                currentOpenPlaylist = updated;
                openPlaylist(updated);

                const playlistIndex = allPlaylists.findIndex(p => p.id == updated.id);

                if (playlistIndex !== -1) {
                    allPlaylists[playlistIndex] = updated;
                }
                displayPlaylists();
            } catch (error) {
                console.error(error);
                alert("Could not remove song.");
            }
        };
        card.appendChild(removeBtn);
        playlistSongGrid.appendChild(card);
    });
    showPage("playlistSongs");
}

/*UPDATE ADD SELECTED BUTTON*/
function updateAddSelectedButton() {
    if (!addSelectedSongsBtn) {
        return;
    }

    const count = selectedSongIds.size;
    addSelectedSongsBtn.textContent = count > 0 ? `Add Selected (${count})` : "Add Selected";
    addSelectedSongsBtn.disabled = count === 0;
}

/*CREATE ADD SELECTED BUTTON*/
function ensureAddSelectedButton() {
    if (!addSongsPanel || !availableSongsGrid) {
        return null;
    }

    if (addSelectedSongsBtn && addSelectedSongsBtn.isConnected) {
        return addSelectedSongsBtn;
    }
    addSelectedSongsBtn = document.createElement("button");
    addSelectedSongsBtn.id = "addSelectedSongsBtn";
    addSelectedSongsBtn.type = "button";
    addSelectedSongsBtn.className = "add-selected-songs-btn";
    addSelectedSongsBtn.textContent = "Add Selected";
    addSelectedSongsBtn.disabled = true;

    addSelectedSongsBtn.onclick = async event => {
        event.stopPropagation();
        if (!currentOpenPlaylist || selectedSongIds.size === 0) {
            return;
        }

        const idsToAdd = Array.from(selectedSongIds);
        addSelectedSongsBtn.disabled = true;
        addSelectedSongsBtn.textContent = "Adding...";
        try {
            for (const songId of idsToAdd) {
                currentOpenPlaylist = await addSongToPlaylist(currentOpenPlaylist.id, songId);
            }
            /* Get the latest playlist from the server. */
            const playlists = await getPlaylists();
            const updatedPlaylist = playlists.find(playlist => playlist.id == currentOpenPlaylist.id);
            if (updatedPlaylist) {
                currentOpenPlaylist = updatedPlaylist;
            }

            const index = allPlaylists.findIndex(playlist => playlist.id == currentOpenPlaylist.id);
            if (index !== -1) {
                allPlaylists[index] = currentOpenPlaylist;
            }
            selectedSongIds.clear();
            displayPlaylists();
            openPlaylist(currentOpenPlaylist);
        } catch (error) {
            console.error("Could not add selected songs:", error);
            alert(error.message || "Could not add selected songs.");
            updateAddSelectedButton();
        } finally {
            if (addSelectedSongsBtn && addSelectedSongsBtn.isConnected) {
                addSelectedSongsBtn.disabled = selectedSongIds.size === 0;
                addSelectedSongsBtn.textContent = selectedSongIds.size > 0 ? `Add Selected (${selectedSongIds.size})` : "Add Selected";
            }
        }
    };
    /*Put the bulk button above the available songs.*/
    addSongsPanel.insertBefore(addSelectedSongsBtn, availableSongsGrid); return addSelectedSongsBtn;
}

/*AVAILABLE SONGS*/
function renderAvailableSongsToAdd() {
    if (!availableSongsGrid) {
        return;
    }
    selectedSongIds.clear();

    const bulkButton = ensureAddSelectedButton();
    if (bulkButton) {
        bulkButton.disabled = true;
        bulkButton.textContent = "Add Selected";
    }

    availableSongsGrid.innerHTML = "";
    if (!currentOpenPlaylist) {
        return;
    }

    const availableSongs = allSongs.filter(song => !currentOpenPlaylist.songs.some(id => id == song.id));
    if (availableSongs.length === 0) {
        availableSongsGrid.innerHTML = "<p>All songs are already in this playlist.</p>";
        return;
    }

    availableSongs.forEach(song => {
        const card = document.createElement("div");
        card.className = "song-card";
        card.innerHTML = ` 
            <img 
            src="${song.cover}" 
            alt="${song.title}" 
            > 
            <h3>
            ${song.title}
            </h3>
            <p>
            ${song.artist}
            </p>
            <span class="likes"> 
            ♡ ${song.likes || 0} 
            </span> 
            <button class="select-song-btn" type="button" > 
            Select 
            </button>
            <button class="add-song-btn" type="button" >
            Add </button> 
            `;
        const selectBtn = card.querySelector(".select-song-btn");
        const addBtn = card.querySelector(".add-song-btn");

        /*Select song*/
        selectBtn.onclick = event => {
            event.stopPropagation();
            if (selectedSongIds.has(song.id)) {
                selectedSongIds.delete(song.id);
                card.classList.remove("selected");
                selectBtn.textContent = "Select";
            } else {
                selectedSongIds.add(song.id);
                card.classList.add("selected");
                selectBtn.textContent = "Selected ✓";
            }
            updateAddSelectedButton();
        };

        /*Add one song*/
        addBtn.onclick = async event => {
            event.stopPropagation();
            if (!currentOpenPlaylist || addBtn.disabled) {
                return;
            }
            const originalText = addBtn.textContent;

            try {
                addBtn.disabled = true;
                addBtn.textContent = "Adding...";

                const updated = await addSongToPlaylist(currentOpenPlaylist.id, song.id);
                currentOpenPlaylist = updated;

                const index = allPlaylists.findIndex(playlist => playlist.id == updated.id);
                if (index !== -1) {
                    allPlaylists[index] = updated;
                }
                selectedSongIds.delete(song.id);
                displayPlaylists();
                openPlaylist(updated);
            } catch (error) {
                console.error(error);
                alert(error.message || "Could not add song.");
            } finally {
                addBtn.disabled = false;
                addBtn.textContent = originalText;
            }
        };
        availableSongsGrid.appendChild(card);
    });
    updateAddSelectedButton();
}

/*CREATE PLAYLIST FORM*/
if (showCreatePlaylistBtn) {
    showCreatePlaylistBtn.onclick = () => {
        if (!createPlaylistForm) {
            return;
        }
        createPlaylistForm.classList.toggle("hidden");
    };
}

/*CREATE PLAYLIST*/
if (createPlaylistBtn) {
    createPlaylistBtn.onclick = async () => {
        const name = newPlaylistName.value.trim();
        const coverFile = newPlaylistCover.files[0];
        const videoFile = newPlaylistVideo.files[0];

        if (!name) {
            alert("Please enter a playlist name.");
            return;
        }
        if (!coverFile) {
            alert("Please choose a playlist cover.");
            return;
        }
        if (!videoFile) {
            alert("Please choose a playlist video.");
            return;
        }

        try {
            createPlaylistBtn.disabled = true;
            createPlaylistBtn.textContent = "Creating...";
            await createPlaylist(name, coverFile, videoFile);
            allPlaylists = await getPlaylists(); displayPlaylists();
            /* * Reset form. */
            newPlaylistName.value = "";
            newPlaylistCover.value = "";
            newPlaylistVideo.value = "";

            const coverFileName = document.getElementById("playlistCoverFileName");
            const videoFileName = document.getElementById("playlistVideoFileName");
            if (coverFileName) {
                coverFileName.textContent = "No cover selected";
            }
            if (videoFileName) {
                videoFileName.textContent = "No video selected";
            }
            if (createPlaylistForm) {
                createPlaylistForm.classList.add("hidden");
            }
            alert("Playlist created successfully!");
        } catch (error) {
            console.error("Playlist creation error:", error);
            alert(error.message || "Could not create playlist.");
        } finally {
            createPlaylistBtn.disabled = false;
            createPlaylistBtn.textContent = "Create Playlist";
        }
    };
}

/*ADD SONGS BUTTON*/
if (showAddSongsBtn) {
    showAddSongsBtn.onclick = () => {
        if (!currentOpenPlaylist) {
            return;
        }
        addSongsPanel.classList.toggle("hidden");

        if (!addSongsPanel.classList.contains("hidden")) {
            renderAvailableSongsToAdd();
        }
    };
}

/*BACK BUTTON*/
const backPlaylists = document.getElementById("backPlaylists");
if (backPlaylists) {
    backPlaylists.onclick = () => {
        showPage("playlists");
    };
}

/*HOME SEARCH*/
if (searchInput) {
    searchInput.addEventListener("input", () => {
        const search = searchInput.value.toLowerCase().trim();
        const filtered = allSongs.filter(song => song.title.toLowerCase().includes(search) || song.artist.toLowerCase().includes(search));
        displaySongs(filtered);
    });
}

/*PLAYLIST SEARCH*/
if (playlistSearchInput) {
    playlistSearchInput.addEventListener("input", () => {
        const search = playlistSearchInput.value.toLowerCase().trim();
        const filtered = allPlaylists.filter(playlist => playlist.name.toLowerCase().includes(search));
        displayPlaylists(filtered);
    });
} 

/* START APPLICATION */ 
async function startApp() { 
    try { 
        allSongs = await getSongs(); 
        allPlaylists = await getPlaylists(); 
        displaySongs(); 
        displayPlaylists();
     } catch (error) { 
        console.error(error);
        if (songGrid) { 
            songGrid.innerHTML = ` <p> Could not load songs. Check that the server is running. </p> `; 
        } 
    } 
} 

startApp();