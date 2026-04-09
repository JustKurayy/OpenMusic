-- Migration: Add user_likes table to track liked songs
-- This creates a junction table between users and tracks to store "liked" relationships

CREATE TABLE user_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create composite unique constraint to prevent duplicate likes
CREATE UNIQUE CONSTRAINT uk_user_likes_user_track ON user_likes (user_id, track_id);

-- Create indexes for common query patterns
CREATE INDEX idx_user_likes_user_id ON user_likes (user_id);
CREATE INDEX idx_user_likes_track_id ON user_likes (track_id);
CREATE INDEX idx_user_likes_user_track ON user_likes (user_id, track_id);
CREATE INDEX idx_user_likes_created_at ON user_likes (created_at);
