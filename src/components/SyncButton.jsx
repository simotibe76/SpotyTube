import React, { useState } from 'react';
import { uploadFavoritesToYouTube, uploadPlaylistsToYouTube } from '../youtubeSync';

function SyncButton({ user, favorites, playlists }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setMessage('Sincronizzazione in corso...');
    try {
      await uploadFavoritesToYouTube(favorites);
      await uploadPlaylistsToYouTube(playlists);
      setMessage('Sincronizzazione completata!');
    } catch (err) {
      console.error('Errore nella sincronizzazione:', err);
      setMessage('Errore durante la sincronizzazione.');
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="mt-2 flex justify-end">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
      >
        {syncing ? 'Sincronizzo...' : 'Sincronizza ora'}
      </button>
      {message && (
        <span className="ml-4 text-sm text-gray-300">{message}</span>
      )}
    </div>
  );
}

export default SyncButton;
