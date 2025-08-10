import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Play, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { playlistsApi, type ApiPlaylistWithTracks } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import TrackList from "@/components/TrackList";

export default function Playlist() {
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playTrack } = usePlayer();

  const { data: playlist, isLoading } = useQuery<ApiPlaylistWithTracks>({
    queryKey: ["/api/playlists", id],
    enabled: !!id && id !== "new",
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      playlistsApi.update(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", id] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Playlist updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => playlistsApi.delete(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      window.location.href = "/library";
      toast({
        title: "Success",
        description: "Playlist deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (playlist) {
      setEditName(playlist.name);
      setEditDescription(playlist.description || "");
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editName.trim()) {
      updateMutation.mutate({
        name: editName.trim(),
        description: editDescription.trim(),
      });
    }
  };

  const handlePlayPlaylist = () => {
    if (playlist && playlist.tracks.length > 0) {
      const tracks = playlist.tracks.map(pt => pt.track);
      playTrack(tracks[0], tracks);
    }
  };

  if (id === "new") {
    // Redirect to /create-playlist if someone tries to access /playlist/new
    window.location.href = "/create-playlist";
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-spotify-light-gray rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-spotify-light-gray rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2 text-spotify-white">Playlist not found</h2>
          <p className="text-spotify-text">The playlist you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const tracks = playlist.tracks.map(pt => pt.track);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Playlist Header */}
      <div className="bg-gradient-to-b from-spotify-light-gray to-transparent p-6 pb-0">
        <div className="flex items-end space-x-6 mb-6">
          {/* Playlist Cover */}
          <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-2xl">
            {playlist.coverImage ? (
              <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-6xl text-white">♪</div>
            )}
          </div>
          
          {/* Playlist Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-spotify-white mb-2">PLAYLIST</p>
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-4xl font-bold bg-transparent border-none p-0 text-spotify-white"
                  style={{ fontSize: '2.5rem', lineHeight: '1' }}
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="text-spotify-text bg-transparent border-none p-0"
                  placeholder="Add a description"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold mb-4 text-spotify-white">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-spotify-text mb-4">{playlist.description}</p>
                )}
                <div className="flex items-center space-x-2 text-sm text-spotify-text">
                  <span>{playlist.user?.name || "Unknown user"}</span>
                  <span>•</span>
                  <span>{playlist.trackCount} songs</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 flex items-center space-x-4">
        <Button
          size="lg"
          className="w-14 h-14 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full"
          onClick={handlePlayPlaylist}
          disabled={tracks.length === 0}
        >
          <Play className="w-6 h-6 ml-1" />
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-spotify-text hover:text-spotify-white">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-spotify-gray border-spotify-light-gray">
            <DialogHeader>
              <DialogTitle className="text-spotify-white">Playlist Options</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-spotify-white hover:text-spotify-green"
                onClick={handleEdit}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Playlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Track List */}
      <div className="px-6 pb-6">
        {tracks.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2 text-spotify-white">This playlist is empty</h3>
            <p className="text-spotify-text">Add some songs to get started</p>
          </div>
        ) : (
          <TrackList tracks={tracks} showAlbum={true} showDateAdded={false} />
        )}
      </div>
    </div>
  );
}
