const API_URL = "/api";

/*SONGS*/
async function getSongs() {
    const res = await fetch(`${API_URL}/songs`);
    if (!res.ok) {
        throw new Error("Failed to load songs.");
    }
    return await res.json();
}

/*PLAYLISTS*/
async function getPlaylists() {
    const res = await fetch(`${API_URL}/playlists`);
    if (!res.ok) {
        throw new Error("Failed to load playlists.");
    }
    return await res.json();
}

/*SONG LIKE / UNLIKE*/
async function toggleSongLike(id, liked) {
    const res = await fetch(
        `${API_URL}/songs/${id}/like`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                liked
            })
        }
    );
    if (!res.ok) {
        throw new Error("Failed to update song like.");
    }
    return await res.json();
}

/*PLAYLIST LIKE / UNLIKE*/
async function togglePlaylistLike(id, liked) {
    const res = await fetch(
        `${API_URL}/playlists/${id}/like`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                liked
            })
        }
    );
    if (!res.ok) {
        throw new Error(
            "Failed to update playlist like."
        );
    }
    return await res.json();
}

/*CREATE PLAYLIST*/
async function createPlaylist(name,coverFile,videoFile) {
    const formData = new FormData();

    formData.append("name",name);
    formData.append("cover", coverFile);
    formData.append("video",videoFile);

    const res = await fetch(
        `${API_URL}/playlists`,
        {
            method: "POST",
            body: formData
        }
    );
    if (!res.ok) {

        const error = await res.json()
            .catch(() => ({}));

        throw new Error(
            error.message ||
            "Failed to create playlist."
        );
    }
    return await res.json();
}

/*ADD SONG TO PLAYLIST*/
async function addSongToPlaylist(playlistId,songId) {
    const res = await fetch(
        `${API_URL}/playlists/${playlistId}/songs`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                songId
            })
        }
    );
    if (!res.ok) {
        throw new Error(
            "Failed to add song to playlist."
        );
    }
    return await res.json();
}


/*REMOVE SONG*/
async function removeSongFromPlaylist(playlistId,songId) {
    const res = await fetch(
        `${API_URL}/playlists/${playlistId}/songs/${songId}`,
        {
            method: "DELETE"
        }
    );
    if (!res.ok) {
        throw new Error(
            "Failed to remove song."
        );
    }
    return await res.json();
}