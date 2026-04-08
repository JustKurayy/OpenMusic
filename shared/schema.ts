import {
    pgTable,
    text,
    serial,
    integer,
    boolean,
    timestamp,
    real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    googleId: text("google_id").unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    avatar: text("avatar"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tracks = pgTable("tracks", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    album: text("album"),
    trackNumber: integer("track_number"),
    coverArt: text("cover_art"), // filesystem path to extracted cover art image
    duration: real("duration").notNull(), // in seconds
    filename: text("filename").notNull(),
    filePath: text("file_path").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playlists = pgTable("playlists", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    coverImage: text("cover_image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Junction table for playlist-track relationships
export const playlistTracks = pgTable("playlist_tracks", {
    id: serial("id").primaryKey(),
    playlistId: integer("playlist_id")
        .references(() => playlists.id, { onDelete: "cascade" })
        .notNull(),
    trackId: integer("track_id")
        .references(() => tracks.id, { onDelete: "cascade" })
        .notNull(),
    position: integer("position").default(0).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
});

// User listening history - tracks when users play tracks
export const userListeningHistory = pgTable("user_listening_history", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    trackId: integer("track_id")
        .references(() => tracks.id, { onDelete: "cascade" })
        .notNull(),
    playedAt: timestamp("played_at").defaultNow().notNull(),
    playCount: integer("play_count").default(1).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    tracks: many(tracks),
    playlists: many(playlists),
}));

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
    playlist: one(playlists, {
        fields: [playlistTracks.playlistId],
        references: [playlists.id],
    }),
    track: one(tracks, {
        fields: [playlistTracks.trackId],
        references: [tracks.id],
    }),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
    user: one(users, {
        fields: [tracks.userId],
        references: [users.id],
    }),
    playlistTracks: many(playlistTracks),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
    user: one(users, {
        fields: [playlists.userId],
        references: [users.id],
    }),
    playlistTracks: many(playlistTracks),
}));

export const userListeningHistoryRelations = relations(
    userListeningHistory,
    ({ one }) => ({
        user: one(users, {
            fields: [userListeningHistory.userId],
            references: [users.id],
        }),
        track: one(tracks, {
            fields: [userListeningHistory.trackId],
            references: [tracks.id],
        }),
    })
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
    id: true,
    userId: true,
    createdAt: true,
});

export const updateTrackSchema = insertTrackSchema.partial().omit({
    duration: true,
    filename: true,
    filePath: true,
    mimeType: true,
    fileSize: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
});

export const insertPlaylistTrackSchema = createInsertSchema(
    playlistTracks
).omit({
    id: true,
    addedAt: true,
});

export const insertUserListeningHistorySchema = createInsertSchema(
    userListeningHistory
).omit({
    id: true,
    playedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;

export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;

export type UserListeningHistory = typeof userListeningHistory.$inferSelect;
export type InsertUserListeningHistory = z.infer<
    typeof insertUserListeningHistorySchema
>;

// Extended types for API responses
export type TrackWithUser = Track & { user: User };
export type PlaylistWithTracks = Playlist & {
    tracks: (PlaylistTrack & { track: TrackWithUser })[];
    trackCount: number;
};
export type PlaylistWithUser = Playlist & { user: User };
