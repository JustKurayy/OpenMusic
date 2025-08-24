import React, { useState, useEffect } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  track: any;
  queue?: any[];
  onPlay?: (track: any, queue?: any[]) => void;
  onAddToPlaylist?: (playlistId: number, trackId: number) => void;
  onDelete?: (trackId: number) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  track,
  queue,
  onPlay,
  onAddToPlaylist,
  onDelete,
  onClose,
}) => {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (showPlaylistMenu) {
      import("@/lib/api").then(({ playlistsApi }) => {
        playlistsApi.getAll().then(res => res.json()).then(setPlaylists);
      });
    }
  }, [showPlaylistMenu]);

  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", top: y, left: x, zIndex: 9999 }}
      className="bg-[#232323] rounded-xl shadow-2xl border border-gray-800 min-w-[180px] py-2 px-2 text-white animate-fade-in"
      onMouseLeave={onClose}
    >
      <button
        className="block w-full text-left px-4 py-2 hover:bg-[#333] rounded-lg"
        onClick={() => {
          onPlay && onPlay(track, queue);
          onClose();
        }}
      >Play</button>
      <div
        className="relative"
        onMouseEnter={() => setShowPlaylistMenu(true)}
        onMouseLeave={() => setShowPlaylistMenu(false)}
      >
        <button className="block w-full text-left px-4 py-2 hover:bg-[#333] rounded-lg">
          Add to Playlist ▶
        </button>
        {showPlaylistMenu && (
          <div
            style={{ position: "absolute", top: 0, left: "100%", minWidth: "180px", zIndex: 10000 }}
            className="bg-[#232323] rounded-xl shadow-2xl border border-gray-800 py-2 px-2 text-white animate-fade-in"
          >
            {playlists.length === 0 ? (
              <div className="px-4 py-2 text-gray-400">No playlists</div>
            ) : (
              playlists.map(pl => (
                <button
                  key={pl.id}
                  className="block w-full text-left px-4 py-2 hover:bg-[#333] rounded-lg"
                  onClick={() => {
                    onAddToPlaylist && onAddToPlaylist(pl.id, track.id);
                    onClose();
                  }}
                >{pl.name}</button>
              ))
            )}
          </div>
        )}
      </div>
      <button
        className="block w-full text-left px-4 py-2 hover:bg-red-600 rounded-lg text-red-400"
        onClick={() => {
          onDelete && onDelete(track.id);
          onClose();
        }}
      >Delete</button>
    </div>
  );
};
