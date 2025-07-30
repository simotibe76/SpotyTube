import React, { useState } from 'react';
import axios from 'axios';

function SyncButton({ favorites, playlists, user }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const syncToYouTube = async () => {
    if (!user || !user.token) {
      setMessage('Devi essere loggato.');
      return;
    }

    setSyncing(true);
    setMessage('');

    try {
      // 1. Trova (o crea) la playlist "Preferiti da SpotyTube"
      const headers = {
        Authorization: `Bearer ${user.token}`,
        Accept: 'application/json',
      };

      const preferredTitle = 'Preferiti da SpotyTube';

      const searchRes = await axios.get(
        'https://www.googleapis.com/youtube/v3/playlists',
        {
          headers,
          params: {
            part: 'snippet',
            mine: true,
            maxResults: 50,
          },
        }
      );

      let targetPlaylist = searchRes.data.items.find(
        (pl) => pl.snippet.title === preferredTitle
      );

      if (!targetPlaylist) {
        const createRes = await axios.post(
          'https://www.googleapis.com/youtube/v3/playlists',
          {
            snippet: {
              title: preferredTitle,
              description: 'I miei preferiti sincronizzati da SpotyTube',
            },
            status: {
              privacyStatus: 'private',
            },
          },
          { headers }
        );
        targetPlaylist = createRes.data;
      }

      const playlistId = targetPlaylist.id;

      // 2. Aggiungi i video preferiti alla playlist
      for (const fav of favorites) {
        await axios.post(
          'https://www.googleapis.com/youtube/v3/playlistItems',
          {
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId: fav.videoId,
              },
            },
          },
          { headers }
        );
      }

      setMessage('Sincronizzazione completata!');
    } catch (err) {
      console.error('Errore durante la sincronizzazione:', err);
      setMessage('Errore durante la sincronizzazione.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-2">
      <button
        onClick={syncToYouTube}
        disabled={syncing}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
      >
        {syncing ? 'Sincronizzo...' : 'Sincronizza ora'}
      </button>
      {message && <p className="text-sm mt-1 text-gray-300">{message}</p>}
    </div>
  );
}

export default SyncButton;
