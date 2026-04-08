-- Create user_listening_history table for tracking listening activity
CREATE TABLE user_listening_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    play_count INTEGER DEFAULT 1 NOT NULL
);

-- Create index for efficient queries
CREATE INDEX user_listening_history_user_track_idx ON user_listening_history(user_id, track_id);
CREATE INDEX user_listening_history_user_played_at_idx ON user_listening_history(user_id, played_at);
