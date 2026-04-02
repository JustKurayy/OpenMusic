import { useEffect, useRef, useState } from "react";
import { spotifyApi } from "@/lib/api";

type ProgressState = {
    status: "idle" | "downloading" | "processing" | "complete" | "error";
    progress: number;
    currentTrack?: string;
    totalTracks?: number;
    error?: string;
    open: boolean;
};

export default function useSpotifyDownload() {
    const [state, setState] = useState<ProgressState>({
        status: "idle",
        progress: 0,
        open: false,
    });

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/spotify`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.addEventListener("message", (ev) => {
            try {
                const parsed = JSON.parse(ev.data as string);
                if (parsed?.event === "spotify-download-progress") {
                    const d = parsed.data as any;
                    if (d.status === "downloading") {
                        setState((s) => ({
                            ...s,
                            open: true,
                            status: "downloading",
                            progress: d.progress ?? s.progress,
                            currentTrack: d.currentTrack,
                            totalTracks: d.totalTracks,
                        }));
                    } else if (d.status === "complete") {
                        setState((s) => ({ ...s, status: "complete", progress: 100 }));
                    } else if (d.status === "error") {
                        setState((s) => ({ ...s, status: "error", error: d.error ?? "Error" }));
                    }
                }
            } catch (err) {
                // ignore
            }
        });

        ws.addEventListener("open", () => {
            // when socket opens, fetch current user and subscribe to their events
            (async () => {
                try {
                    const res = await fetch("/api/auth/me", { credentials: "include" });
                    if (res.ok) {
                        const user = await res.json();
                        if (user?.id) {
                            ws.send(JSON.stringify({ action: "subscribe", userId: user.id }));
                        }
                    }
                } catch (e) {
                    // ignore
                }
            })();
        });

        ws.addEventListener("close", () => {
            wsRef.current = null;
        });

        return () => {
            try {
                ws.close();
            } catch {}
        };
    }, []);

    const startDownload = async (url: string) => {
        setState((s) => ({ ...s, open: true, status: "processing", progress: 0 }));
        try {
            await spotifyApi.download(url);
        } catch (err: any) {
            setState((s) => ({ ...s, status: "error", error: err?.message || String(err) }));
        }
    };

    const close = () => {
        setState({ status: "idle", progress: 0, open: false });
    };

    return { state, startDownload, close };
}
