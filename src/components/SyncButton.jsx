// 📁 src/components/SyncButton.jsx
import React from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { getFavorites, getPlaylists } from "../db";

function SyncButton({ user, favorites, playlists }) {
  const handleSync = async () => {
    if (!user) return;

    const accessToken = gapi.auth.getToken().access_token;
    if (!accessToken) {
      alert("Access token non trovato.");
      return;
    }

    try {
      // 1. Sincronizza i preferiti in una playlist chiamata “Preferiti da SpotyTube”
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              title: "Preferiti da SpotyTube",
              description: "Brani preferiti sincronizzati dall'app SpotyTube",
            },
            status: {
              privacyStatus: "private",
            },
          }),
        }
      );
      const data = await res.json();
      const playlistId = data.id;

      // 2. Aggiungi i video dei preferiti a quella playlist
      for (const item of favorites) {
        await fetch(
          "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              snippet: {
                playlistId: playlistId,
                resourceId: {
                  kind: "youtube#video",
                  videoId: item.videoId,
                },
              },
            }),
          }
        );
      }

      // 3. Sincronizza ogni playlist locale come playlist privata
      for (const [playlistName, items] of Object.entries(playlists)) {
        const resPlaylist = await fetch(
          "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              snippet: {
                title: playlistName,
                description: "Playlist sincronizzata da SpotyTube",
              },
              status: {
                privacyStatus: "private",
              },
            }),
          }
        );
        const { id: newPlaylistId } = await resPlaylist.json();

        for (const item of items) {
          await fetch(
            "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                snippet: {
                  playlistId: newPlaylistId,
                  resourceId: {
                    kind: "youtube#video",
                    videoId: item.videoId,
                  },
                },
              }),
            }
          );
        }
      }

      alert("✅ Sincronizzazione completata!");
    } catch (err) {
      console.error("Errore durante la sincronizzazione", err);
      alert("❌ Errore durante la sincronizzazione.");
    }
  };

  return (
    <button
      onClick={handleSync}
      title="Sincronizza con YouTube"
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2"
    >
      <ArrowPathIcon className="h-5 w-5" />
      Sincronizza ora
    </button>
  );
}

export default SyncButton;
