-- Create playlist_tracks junction table for linking playlists and tracks
CREATE TABLE playlist_tracks (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0 NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX playlist_tracks_playlist_track_idx ON playlist_tracks(playlist_id, track_id);
CREATE INDEX playlist_tracks_playlist_added_at_idx ON playlist_tracks(playlist_id, added_at);
