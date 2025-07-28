import React from 'react';
import { HeartIcon, ListBulletIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

function HistoryList({ history, playVideo, favorites, handleToggleFavorite, openAddToPlaylistModal }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">La tua Cronologia:</h2>
      {history.length > 0 ? (
        <ul className="space-y-4">
          {history.map((item) => (
            <li
              key={item.videoId + item.timestamp} // Usa key combinata per unicità
              className="flex items-center gap-4 bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors duration-150"
            >
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-16 h-16 rounded-md object-cover cursor-pointer"
                onClick={() => playVideo(item)}
              />
              <div className="flex-grow cursor-pointer" onClick={() => playVideo(item)}>
                <p className="font-semibold text-lg">{item.title}</p>
                <p className="text-gray-400 text-sm">{item.channelTitle}</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleToggleFavorite(item)}
                  className="p-2 rounded-full hover:bg-purple-500 transition-colors duration-200"
                  title={favorites.some(fav => fav.videoId === item.videoId) ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                >
                  {favorites.some(fav => fav.videoId === item.videoId) ? (
                    <HeartIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartOutlineIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => openAddToPlaylistModal(item)}
                  className="p-2 rounded-full hover:bg-purple-500 transition-colors duration-200"
                  title="Aggiungi a playlist"
                >
                  <ListBulletIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-400">Nessun elemento nella cronologia. Inizia ad ascoltare!</p>
      )}
    </div>
  );
}

export default HistoryList;
