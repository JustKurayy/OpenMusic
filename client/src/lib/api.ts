import { apiRequest } from "./queryClient";

export interface ApiTrack {
    id: number;
    title: string;
    artist: string;
    album?: string;
    trackNumber?: number;
    coverArt?: string; // filesystem path — use getArtworkUrl(id) for the URL
    duration: number;
    filename: string;
    createdAt: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
}

export interface ApiPlaylist {
    id: number;
    name: string;
    description?: string;
    coverImage?: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        name: string;
    };
}

export interface ApiPlaylistWithTracks extends ApiPlaylist {
    tracks: Array<{
        id: number;
        position: number;
        addedAt: string;
        track: ApiTrack;
    }>;
    trackCount: number;
}

export interface ApiUser {
    id: number;
    email: string;
    name: string;
    avatar?: string;
    googleId?: string;
}

// Auth API
export const authApi = {
    getMe: () => apiRequest("GET", "/api/auth/me"),
    logout: () => apiRequest("POST", "/api/auth/logout"),
    getStatus: () => apiRequest("GET", "/api/auth/status"),
    guestLogin: () =>
        apiRequest("POST", "/api/auth/guest").then((res) => res.json()),
};

// Tracks API
export const tracksApi = {
    getAll: (params?: { search?: string; my?: boolean }) => {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.my) searchParams.set("my", "true");

        const url = `/api/tracks${searchParams.toString() ? `?${searchParams}` : ""}`;
        return apiRequest("GET", url);
    },

    getById: (id: number) => apiRequest("GET", `/api/tracks/${id}`),

    upload: (formData: FormData) => {
        return fetch("/api/tracks/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
        });
    },

    extractMetadata: (formData: FormData) => {
        return fetch("/api/tracks/extract-metadata", {
            method: "POST",
            body: formData,
            credentials: "include",
        });
    },

    update: (
        id: number,
        data: Partial<{
            title: string;
            artist: string;
            album?: string | null;
            trackNumber?: number | null;
            coverArt?: string | null;
        }>
    ) => apiRequest("PUT", `/api/tracks/${id}`, data),

    delete: (id: number) => apiRequest("DELETE", `/api/tracks/${id}`),

    getStreamUrl: (id: number) => `/api/tracks/${id}/stream`,

    getArtworkUrl: (id: number) => `/api/tracks/${id}/artwork`,
};

// Playlists API
export const playlistsApi = {
    getAll: () => apiRequest("GET", "/api/playlists"),

    getById: (id: number) => apiRequest("GET", `/api/playlists/${id}`),

    create: (data: { name: string; description?: string }) =>
        apiRequest("POST", "/api/playlists", data),

    update: (
        id: number,
        data: {
            name?: string;
            description?: string;
            coverImage?: string | null;
        }
    ) => apiRequest("PUT", `/api/playlists/${id}`, data),

    delete: (id: number) => apiRequest("DELETE", `/api/playlists/${id}`),

    addTrack: (playlistId: number, trackId: number, position?: number) =>
        apiRequest("POST", `/api/playlists/${playlistId}/tracks`, {
            trackId,
            position,
        }),

    removeTrack: (playlistId: number, trackId: number) =>
        apiRequest("DELETE", `/api/playlists/${playlistId}/tracks/${trackId}`),

    reorder: (playlistId: number, trackIds: number[]) =>
        apiRequest("PUT", `/api/playlists/${playlistId}/reorder`, { trackIds }),
};

// Lyrics API
export const lyricsApi = {
    getLyrics: (title: string, artist: string) => {
        const params = new URLSearchParams({
            title: title,
            artist: artist,
        });
        return apiRequest("GET", `/api/lyrics?${params}`);
    },
};

// Listening History API
export const historyApi = {
    recordPlay: (trackId: number) =>
        apiRequest("POST", `/api/history/record`, { trackId }),
    getRecentPlays: (limit = 10) =>
        apiRequest("GET", `/api/history/replay?limit=${limit}`),
};

// Spotify Download API
export const spotifyApi = {
    download: (url: string) =>
        apiRequest("POST", "/api/spotify/download", { url }),
};
