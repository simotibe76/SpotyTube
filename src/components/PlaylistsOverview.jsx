import React from 'react';
import { PlusIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/solid'; // Aggiunto PlayIcon

function PlaylistsOverview({
  playlists,
  handleViewPlaylist,
  handleDeletePlaylist,
  openCreatePlaylistModal,
  playPlaylist // NUOVA PROP: funzione per avviare la riproduzione della playlist
}) {
  return (
    <div className="p-4 pt-20 pb-20"> {/* Aggiunto padding-top per evitare sovrapposizioni con l'header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-purple-300">Le Tue Playlist</h2>
        <button
          onClick={openCreatePlaylistModal}
          className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition-transform duration-200 hover:scale-105"
          title="Crea Nuova Playlist"
        >
          <PlusIcon className="h-6 w-6 text-white" />
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-gray-400 text-center mt-8">Nessuna playlist creata. Creane una nuova!</p>
      ) : (
        <ul className="space-y-4">
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between"
            >
              <div className="flex-grow cursor-pointer" onClick={() => handleViewPlaylist(playlist.id)}>
                <h3 className="text-lg font-semibold text-white">{playlist.name}</h3>
                <p className="text-gray-400 text-sm">{playlist.videos.length} brani</p>
              </div>
              <div className="flex space-x-2">
                {/* Pulsante PLAY Playlist */}
                <button
                  onClick={() => playPlaylist(playlist.id)}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-full text-white transition-colors duration-200"
                  title="Riproduci Playlist"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
                {/* Pulsante Elimina Playlist */}
                <button
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors duration-200"
                  title="Elimina Playlist"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlaylistsOverview;