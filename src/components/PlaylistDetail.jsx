import React from 'react';
import { HeartIcon, HeartIcon as HeartOutlineIcon, PlayIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { isFavorite } from '../db'; // Assicurati di importare isFavorite se non lo fai già

function PlaylistDetail({
  playlist,
  setActiveSection,
  handleToggleFavorite,
  handleRemoveVideoFromPlaylist,
  playVideo,
  favorites, // Passato da App.jsx per controllare lo stato dei preferiti
  setCurrentViewedPlaylistId, // Per resettare l'ID della playlist visualizzata
  setCurrentPlaylist // Per resettare l'oggetto playlist
}) {

  if (!playlist) {
    return (
      <div className="text-center text-gray-400 text-xl mt-10">
        Caricamento playlist... o la playlist non esiste.
        <button
          onClick={() => {
            setActiveSection('playlists');
            setCurrentViewedPlaylistId(null);
            setCurrentPlaylist(null);
          }}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors duration-200"
        >
          Torna alle Playlist
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-20"> 
      <div className="flex items-center mb-6">
        <button
          onClick={() => {
            setActiveSection('playlists');
            setCurrentViewedPlaylistId(null); 
            setCurrentPlaylist(null); 
          }}
          className="mr-3 p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 text-gray-300"
          title="Torna alle Playlist"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h2 className="text-3xl font-bold text-purple-300">{playlist.name}</h2>
      </div>

      {playlist.videos.length > 0 ? (
        <ul className="space-y-4">
          {playlist.videos.map((video) => (
            <li
              key={video.videoId}
              className="flex items-center bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors duration-150"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-20 h-20 rounded-lg object-cover mr-4 cursor-pointer"
                onClick={() => playVideo(video)}
              />
              <div className="flex-grow">
                <p
                  className="font-semibold text-lg text-white cursor-pointer hover:text-purple-300 transition-colors duration-150"
                  onClick={() => playVideo(video)}
                >
                  {video.title}
                </p>
                <p className="text-gray-400 text-sm">{video.channelTitle}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => playVideo(video)}
                  className="p-2 rounded-full hover:bg-blue-500 transition-colors duration-200"
                  title="Riproduci"
                >
                  <PlayIcon className="h-6 w-6 text-blue-400" />
                </button>
                <button
                  onClick={() => handleToggleFavorite(video)}
                  className="p-2 rounded-full hover:bg-yellow-500 transition-colors duration-200"
                  title={favorites.some(fav => fav.videoId === video.videoId) ? "Rimuovi dai Preferiti" : "Aggiungi ai Preferiti"}
                >
                  {favorites.some(fav => fav.videoId === video.videoId) ? (
                    <HeartIcon className="h-6 w-6 text-yellow-400" />
                  ) : (
                    <HeartOutlineIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleRemoveVideoFromPlaylist(playlist.id, video.videoId)}
                  className="p-2 rounded-full hover:bg-red-500 transition-colors duration-200"
                  title="Rimuovi dalla playlist"
                >
                  <TrashIcon className="h-6 w-6 text-red-400" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-400 mt-6">Questa playlist è vuota. Aggiungi dei video!</p>
      )}
    </div>
  );
}

export default PlaylistDetail;