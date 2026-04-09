# OpenMusic - Likes Feature Implementation

## Feature Overview

Implemented a "likes" feature that allows users to like/unlike songs and view them as a playlist at `/likes`.

## Database Schema

### Table: `user_likes`

| Column | Type | Description |
|--------|--------|-------|------------| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users table |
| track_id | INTEGER | Foreign key to tracks table |
| created_at | TIMESTAMP | When the track was liked |

## Files Modified/Created

### Backend

#### `shared/schema.ts`

- Added `userLikes` table definition
- Added `insertUserLikeSchema`
- Added `userLikesRelations`
- Added `UserLike`, `InsertUserLike`, `UserLikeWithTrack` types

#### `server/storage.ts`

- Added `IStorage` interface methods for likes:
    - `addLike(userId, trackId)`
    - `removeLike(userId, trackId)`
    - `isLiked(userId, trackId)`
    - `getUserLikes(userId)`
- Implemented all methods in `DatabaseStorage` class

#### `server/routes.ts`

- Added API endpoints:
    - `POST /api/likes/add` - Add a like
    - `DELETE /api/likes/remove` - Remove a like
    - `GET /api/likes/is-liked` - Check if a track is liked
    - `GET /api/likes/user` - Get all liked tracks for user

### Frontend

#### `client/src/lib/api.ts`

- Added `likesApi` object with methods:
    - `add(trackId)`
    - `remove(trackId)`
    - `isLiked(trackId)`
    - `getUserLikes()`

#### `client/src/pages/Likes.tsx`

- New page component that:
    - Displays all liked tracks
    - Shows track count
    - Allows playing all liked tracks
    - Integrates with `TrackList` for like/unlike functionality

#### `client/src/App.tsx`

- Added import for `Likes` component
- Added route: `<Route path="/likes" component={Likes} />`

#### `client/src/components/Sidebar.tsx`

- Updated "Liked Songs" link from `/liked` to `/likes`
- Added query for liked tracks to show count

#### `client/src/components/TrackList.tsx`

- Added `onLike` and `onUnlike` props
- Added Heart icon button for like/unlike functionality
- Uses `likedTracks` state to track which tracks are currently liked

### Database Migration

#### `migrations/0004_create_user_likes.sql`

- Creates `user_likes` table with proper schema
- Includes indexes for common query patterns
- Includes composite unique constraint to prevent duplicate likes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------|------------| POST | `/api/likes/add` | Add a track to user's liked songs |
| DELETE | `/api/likes/remove` | Remove a track from user's liked songs |
| GET | `/api/likes/is-liked` | Check if a track is liked |
| GET | `/api/likes/user` | Get all liked tracks for the current user |

## Usage

### To add a like:

```javascript
await likesApi.add(trackId);
```

### To remove a like:

```javascript
await likesApi.remove(trackId);
```

### To check if liked:

```javascript
const result = await likesApi.isLiked(trackId);
if (result.liked) {
    // Track is already liked
}
```

### To get all liked tracks:

```javascript
const likedTracks = await likesApi.getUserLikes();
```

## Notes

- The `user_likes` table uses `created_at` as the timestamp column (matching existing naming convention)
- The likes feature integrates with existing `TrackList` component for consistent UI
- The `/likes` route displays liked songs in the same format as playlists
- Like/unlike buttons appear on tracks when `onLike`/`onUnlike` callbacks are provided
