import { apiRequest } from "./queryClient";

export interface ApiTrack {
  id: number;
  title: string;
  artist: string;
  album?: string;
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
  guestLogin: () => apiRequest("POST", "/api/auth/guest").then(res => res.json()),
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
  
  delete: (id: number) => apiRequest("DELETE", `/api/tracks/${id}`),
  
  getStreamUrl: (id: number) => `/api/tracks/${id}/stream`,
};

// Playlists API
export const playlistsApi = {
  getAll: () => apiRequest("GET", "/api/playlists"),
  
  getById: (id: number) => apiRequest("GET", `/api/playlists/${id}`),
  
  create: (data: { name: string; description?: string }) =>
    apiRequest("POST", "/api/playlists", data),
  
  update: (id: number, data: { name?: string; description?: string }) =>
    apiRequest("PUT", `/api/playlists/${id}`, data),
  
  delete: (id: number) => apiRequest("DELETE", `/api/playlists/${id}`),
  
  addTrack: (playlistId: number, trackId: number, position?: number) =>
    apiRequest("POST", `/api/playlists/${playlistId}/tracks`, {
      trackId,
      position,
    }),
  
  removeTrack: (playlistId: number, trackId: number) =>
    apiRequest("DELETE", `/api/playlists/${playlistId}/tracks/${trackId}`),
  
  reorderTracks: (playlistId: number, trackIds: number[]) =>
    apiRequest("PUT", `/api/playlists/${playlistId}/reorder`, { trackIds }),
};
