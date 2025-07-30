import React from 'react';
import GoogleAuth from './GoogleAuth';
import SyncButton from './SyncButton';

function Header({
  searchTerm,
  setSearchTerm,
  handleSearch,
  loading,
  error,
  user,
  favorites,
  playlists,
  onLogin,
}) {
  return (
    <header className="w-full bg-gray-800 p-4 shadow-md flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col gap-2">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            placeholder="Cerca un brano o artista..."
            className="flex-grow p-2 rounded-l bg-gray-700 text-white focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r"
          >
            {loading ? 'Cerca...' : 'Cerca'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-between items-center mt-2">
          <GoogleAuth onLogin={onLogin} />
        </div>

        {user && favorites.length > 0 && playlists.length > 0 && (
          <SyncButton user={user} favorites={favorites} playlists={playlists} />
        )}
      </div>
    </header>
  );
}

export default Header;
