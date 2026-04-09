import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Play, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { likesApi } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import TrackList from "@/components/TrackList";

export default function Likes() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { playTrack } = usePlayer();

    const { data: likedTracks, isLoading } = useQuery<
        Awaited<ReturnType<typeof likesApi.getUserLikes>>
    >({
        queryKey: ["/api/likes/user"],
        enabled: true,
    });

    const addLikeMutation = useMutation({
        mutationFn: (trackId: number) => likesApi.add(trackId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/likes/user"] });
            toast({
                title: "Success",
                description: "Track added to liked songs!",
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

    const removeLikeMutation = useMutation({
        mutationFn: (trackId: number) => likesApi.remove(trackId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/likes/user"] });
            toast({
                title: "Success",
                description: "Track removed from liked songs.",
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

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto">
                <div className="h-[340px] bg-gradient-to-b from-gray-700 to-gray-900 animate-pulse">
                    <div className="p-6 pt-16">
                        <div className="flex items-end space-x-6">
                            <div className="w-60 h-60 bg-gray-600 rounded shadow-2xl"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-4 bg-gray-600 rounded w-20"></div>
                                <div className="h-12 bg-gray-600 rounded w-96"></div>
                                <div className="h-4 bg-gray-600 rounded w-64"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-gray-800 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    const tracks = likedTracks?.map((lt) => lt.track) || [];
    const trackCount = tracks.length;

    const handlePlayAll = () => {
        if (tracks.length > 0) {
            playTrack(tracks[0], tracks);
        }
    };

    return (
        <div className="min-h-screen flex flex-col rounded-lg bg-[var(--spotify-panel)]">
            {/* Header */}
            <div className="relative bg-gradient-to-b from-[var(--spotify-panel)] to-zinc-900 h-[340px] border-b border-gray-800">
                <div className="relative px-8 pt-20 pb-6 h-full flex items-end space-x-6">
                    {/* Cover Art */}
                    <div className="w-56 h-56 flex-shrink-0 rounded-md shadow-lg">
                        <div className="w-full h-full bg-green-500 rounded-md flex items-center justify-center">
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0 pb-2">
                        <p className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                            Liked Songs
                        </p>
                        <h1 className="text-5xl font-bold mb-3 text-white break-words">
                            Liked Songs
                        </h1>
                        <p className="text-sm text-gray-400 mb-4">
                            Your collection of liked tracks
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{trackCount} songs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="px-8 py-4 border-b border-gray-800 flex items-center space-x-4">
                <Button
                    size="lg"
                    className="w-12 h-12 bg-green-500 hover:bg-green-400 text-black rounded-full transition-colors duration-200"
                    onClick={handlePlayAll}
                    disabled={tracks.length === 0}
                >
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                </Button>
            </div>

            {/* Track List */}
            <div className="bg-[var(--spotify-panel)] px-8 pb-6 flex-1">
                {tracks.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-2xl font-bold mb-4 text-white">
                            No liked songs yet
                        </h3>
                        <p className="text-gray-400 mb-8 text-lg">
                            Like songs you want to save to your collection.
                        </p>
                        <Button className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 rounded-full text-sm">
                            Find something to play
                        </Button>
                    </div>
                ) : (
                    <TrackList
                        tracks={tracks}
                        showAlbum={true}
                        showDateAdded={false}
                        onLike={(trackId) => addLikeMutation.mutate(trackId)}
                        onUnlike={(trackId) =>
                            removeLikeMutation.mutate(trackId)
                        }
                    />
                )}
            </div>
        </div>
    );
}
