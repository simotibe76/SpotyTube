import React from 'react';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { HeartIcon, ListBulletIcon } from '@heroicons/react/24/solid';

function SearchResults({ searchResults, playVideo, favorites, handleToggleFavorite, openAddToPlaylistModal }) {
  if (searchResults.length === 0) {
    return (
      <p className="text-center text-gray-400 text-xl mt-10">Cerca musica o audiolibri per iniziare!</p>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">Risultati della Ricerca:</h2>
      <ul className="space-y-4">
        {searchResults.map((item) => (
          <li
            key={item.videoId}
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
    </div>
  );
}

export default SearchResults;
