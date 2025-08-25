import {
    users,
    tracks,
    playlists,
    playlistTracks,
    type User,
    type InsertUser,
    type Track,
    type InsertTrack,
    type TrackWithUser,
    type Playlist,
    type InsertPlaylist,
    type PlaylistWithTracks,
    type PlaylistWithUser,
    type PlaylistTrack,
    type InsertPlaylistTrack,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";

export interface IStorage {
    // Users
    getUser(id: number): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByGoogleId(googleId: string): Promise<User | undefined>;
    createUser(user: InsertUser): Promise<User>;
    updateUserGoogleId(userId: number, googleId: string): Promise<void>;

    // Tracks
    getTrack(id: number): Promise<Track | undefined>;
    getTracksByUser(userId: number): Promise<TrackWithUser[]>;
    getAllTracks(): Promise<TrackWithUser[]>;
    createTrack(track: InsertTrack & { userId: number }): Promise<Track>;
    deleteTrack(id: number, userId: number): Promise<boolean>;
    searchTracks(query: string, userId?: number): Promise<TrackWithUser[]>;

    // Playlists
    getPlaylist(id: number): Promise<PlaylistWithTracks | undefined>;
    getPlaylistsByUser(userId: number): Promise<PlaylistWithUser[]>;
    createPlaylist(
        playlist: InsertPlaylist & { userId: number }
    ): Promise<Playlist>;
    updatePlaylist(
        id: number,
        playlist: Partial<InsertPlaylist>,
        userId: number
    ): Promise<Playlist | undefined>;
    deletePlaylist(id: number, userId: number): Promise<boolean>;

    // Playlist tracks
    addTrackToPlaylist(
        playlistTrack: InsertPlaylistTrack
    ): Promise<PlaylistTrack>;
    removeTrackFromPlaylist(
        playlistId: number,
        trackId: number,
        userId: number
    ): Promise<boolean>;
    reorderPlaylistTracks(
        playlistId: number,
        trackIds: number[],
        userId: number
    ): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
    // Users
    async getUser(id: number): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        return user || undefined;
    }

    async getUserByGoogleId(googleId: string): Promise<User | undefined> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.googleId, googleId));
            return user || undefined;
        } catch (err) {
            console.error("[DB ERROR] getUserByGoogleId:", err);
            throw err;
        }
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }

    async updateUserGoogleId(userId: number, googleId: string): Promise<void> {
        await db.update(users).set({ googleId }).where(eq(users.id, userId));
    }

    // Tracks
    async getTrack(id: number): Promise<Track | undefined> {
        const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
        return track || undefined;
    }

    async getTracksByUser(userId: number): Promise<TrackWithUser[]> {
        return await db
            .select({
                id: tracks.id,
                userId: tracks.userId,
                title: tracks.title,
                artist: tracks.artist,
                album: tracks.album,
                duration: tracks.duration,
                filename: tracks.filename,
                filePath: tracks.filePath,
                mimeType: tracks.mimeType,
                fileSize: tracks.fileSize,
                createdAt: tracks.createdAt,
                user: {
                    id: users.id,
                    googleId: users.googleId,
                    email: users.email,
                    name: users.name,
                    avatar: users.avatar,
                    createdAt: users.createdAt,
                },
            })
            .from(tracks)
            .innerJoin(users, eq(tracks.userId, users.id))
            .where(eq(tracks.userId, userId))
            .orderBy(desc(tracks.createdAt));
    }

    async getAllTracks(): Promise<TrackWithUser[]> {
        return await db
            .select({
                id: tracks.id,
                userId: tracks.userId,
                title: tracks.title,
                artist: tracks.artist,
                album: tracks.album,
                duration: tracks.duration,
                filename: tracks.filename,
                filePath: tracks.filePath,
                mimeType: tracks.mimeType,
                fileSize: tracks.fileSize,
                createdAt: tracks.createdAt,
                user: users,
            })
            .from(tracks)
            .innerJoin(users, eq(tracks.userId, users.id))
            .orderBy(desc(tracks.createdAt));
    }

    async createTrack(track: InsertTrack & { userId: number }): Promise<Track> {
        const [newTrack] = await db.insert(tracks).values(track).returning();
        return newTrack;
    }

    async deleteTrack(id: number, userId: number): Promise<boolean> {
        const result = await db
            .delete(tracks)
            .where(and(eq(tracks.id, id), eq(tracks.userId, userId)));
        return result.rowCount! > 0;
    }

    async searchTracks(
        query: string,
        userId?: number
    ): Promise<TrackWithUser[]> {
        const searchQuery = `%${query.toLowerCase()}%`;

        let dbQuery = db
            .select({
                id: tracks.id,
                userId: tracks.userId,
                title: tracks.title,
                artist: tracks.artist,
                album: tracks.album,
                duration: tracks.duration,
                filename: tracks.filename,
                filePath: tracks.filePath,
                mimeType: tracks.mimeType,
                fileSize: tracks.fileSize,
                createdAt: tracks.createdAt,
                user: users,
            })
            .from(tracks)
            .innerJoin(users, eq(tracks.userId, users.id));

        if (userId) {
            dbQuery = dbQuery.where(eq(tracks.userId, userId));
        }

        return await dbQuery.orderBy(desc(tracks.createdAt));
    }

    // Playlists
    async getPlaylist(id: number): Promise<PlaylistWithTracks | undefined> {
        const [playlist] = await db
            .select({
                id: playlists.id,
                userId: playlists.userId,
                name: playlists.name,
                description: playlists.description,
                coverImage: playlists.coverImage,
                createdAt: playlists.createdAt,
                updatedAt: playlists.updatedAt,
                user: {
                    id: users.id,
                    googleId: users.googleId,
                    email: users.email,
                    name: users.name,
                    avatar: users.avatar,
                    createdAt: users.createdAt,
                },
            })
            .from(playlists)
            .innerJoin(users, eq(playlists.userId, users.id))
            .where(eq(playlists.id, id));
        if (!playlist) return undefined;

        const playlistTracksData = await db
            .select({
                id: playlistTracks.id,
                playlistId: playlistTracks.playlistId,
                trackId: playlistTracks.trackId,
                position: playlistTracks.position,
                addedAt: playlistTracks.addedAt,
                track: {
                    id: tracks.id,
                    userId: tracks.userId,
                    title: tracks.title,
                    artist: tracks.artist,
                    album: tracks.album,
                    duration: tracks.duration,
                    filename: tracks.filename,
                    filePath: tracks.filePath,
                    mimeType: tracks.mimeType,
                    fileSize: tracks.fileSize,
                    createdAt: tracks.createdAt,
                    user: {
                        id: users.id,
                        googleId: users.googleId,
                        email: users.email,
                        name: users.name,
                        avatar: users.avatar,
                        createdAt: users.createdAt,
                    },
                },
            })
            .from(playlistTracks)
            .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
            .innerJoin(users, eq(tracks.userId, users.id))
            .where(eq(playlistTracks.playlistId, id))
            .orderBy(asc(playlistTracks.position));

        return {
            ...playlist,
            tracks: playlistTracksData,
            trackCount: playlistTracksData.length,
        };
    }

    async getPlaylistsByUser(userId: number): Promise<PlaylistWithUser[]> {
        return await db
            .select({
                id: playlists.id,
                userId: playlists.userId,
                name: playlists.name,
                description: playlists.description,
                coverImage: playlists.coverImage,
                createdAt: playlists.createdAt,
                updatedAt: playlists.updatedAt,
                user: users,
            })
            .from(playlists)
            .innerJoin(users, eq(playlists.userId, users.id))
            .where(eq(playlists.userId, userId))
            .orderBy(desc(playlists.createdAt));
    }

    async createPlaylist(
        playlist: InsertPlaylist & { userId: number }
    ): Promise<Playlist> {
        const [newPlaylist] = await db
            .insert(playlists)
            .values(playlist)
            .returning();
        return newPlaylist;
    }

    async updatePlaylist(
        id: number,
        playlist: Partial<InsertPlaylist>,
        userId: number
    ): Promise<Playlist | undefined> {
        const [updatedPlaylist] = await db
            .update(playlists)
            .set({ ...playlist, updatedAt: new Date() })
            .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
            .returning();
        return updatedPlaylist || undefined;
    }

    async deletePlaylist(id: number, userId: number): Promise<boolean> {
        const result = await db
            .delete(playlists)
            .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
        return result.rowCount! > 0;
    }

    // Playlist tracks
    async addTrackToPlaylist(
        playlistTrack: InsertPlaylistTrack
    ): Promise<PlaylistTrack> {
        const [newPlaylistTrack] = await db
            .insert(playlistTracks)
            .values(playlistTrack)
            .returning();
        return newPlaylistTrack;
    }

    async removeTrackFromPlaylist(
        playlistId: number,
        trackId: number,
        userId: number
    ): Promise<boolean> {
        // First verify the user owns the playlist
        const [playlist] = await db
            .select()
            .from(playlists)
            .where(
                and(eq(playlists.id, playlistId), eq(playlists.userId, userId))
            );
        if (!playlist) return false;

        const result = await db
            .delete(playlistTracks)
            .where(
                and(
                    eq(playlistTracks.playlistId, playlistId),
                    eq(playlistTracks.trackId, trackId)
                )
            );
        return result.rowCount! > 0;
    }

    async reorderPlaylistTracks(
        playlistId: number,
        trackIds: number[],
        userId: number
    ): Promise<boolean> {
        // First verify the user owns the playlist
        const [playlist] = await db
            .select()
            .from(playlists)
            .where(
                and(eq(playlists.id, playlistId), eq(playlists.userId, userId))
            );
        if (!playlist) return false;

        // Update positions
        for (let i = 0; i < trackIds.length; i++) {
            await db
                .update(playlistTracks)
                .set({ position: i })
                .where(
                    and(
                        eq(playlistTracks.playlistId, playlistId),
                        eq(playlistTracks.trackId, trackIds[i])
                    )
                );
        }

        return true;
    }
}

export const storage = new DatabaseStorage();
