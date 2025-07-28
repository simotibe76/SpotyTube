import React from 'react';
import { MagnifyingGlassIcon, HeartIcon, ClockIcon, ListBulletIcon } from '@heroicons/react/24/solid';

function Navigation({ activeSection, setActiveSection, setSearchResults }) {
  const handleNavigationClick = (section) => {
    setActiveSection(section);
    // Potrebbe essere utile resettare i risultati della ricerca quando si cambia sezione
    if (section !== 'search') {
      setSearchResults([]);
    }
  };

  return (
    // CAMBIATO bottom-[96px] a bottom-0 e aggiunto z-40
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 p-4 z-40 flex justify-around items-center">
      <button
        onClick={() => handleNavigationClick('search')}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${
          activeSection === 'search' ? 'text-purple-400 bg-gray-700' : 'text-gray-400 hover:text-white'
        }`}
      >
        <MagnifyingGlassIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Cerca</span>
      </button>

      <button
        onClick={() => handleNavigationClick('favorites')}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${
          activeSection === 'favorites' ? 'text-purple-400 bg-gray-700' : 'text-gray-400 hover:text-white'
        }`}
      >
        <HeartIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Preferiti</span>
      </button>

      <button
        onClick={() => handleNavigationClick('history')}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${
          activeSection === 'history' ? 'text-purple-400 bg-gray-700' : 'text-gray-400 hover:text-white'
        }`}
      >
        <ClockIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Cronologia</span>
      </button>

      <button
        onClick={() => handleNavigationClick('playlists')}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${
          activeSection === 'playlists' ? 'text-purple-400 bg-gray-700' : 'text-gray-400 hover:text-white'
        }`}
      >
        <ListBulletIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Playlist</span>
      </button>
    </div>
  );
}

export default Navigation;