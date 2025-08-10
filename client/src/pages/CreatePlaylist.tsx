import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CreatePlaylist() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to create playlist");
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-spotify-black text-spotify-white pt-12">
      <Card className="w-full max-w-lg p-8 bg-spotify-gray border-spotify-light-gray">
        <h1 className="text-2xl font-bold mb-6 text-spotify-white">Create New Playlist</h1>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Playlist name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-spotify-light-gray border-spotify-light-gray rounded-full text-spotify-white placeholder-spotify-text focus:border-spotify-green"
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="bg-spotify-light-gray border-spotify-light-gray rounded-full text-spotify-white placeholder-spotify-text focus:border-spotify-green"
          />
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name} className="bg-spotify-green text-white rounded-full px-6 py-2 font-semibold hover:bg-green-600">
            {mutation.isPending ? "Creating..." : "Create Playlist"}
          </Button>
          {success && <div className="text-green-500">Playlist created!</div>}
          {mutation.isError && <div className="text-red-500">{(mutation.error as any)?.message}</div>}
        </div>
      </Card>
    </div>
  );
}
