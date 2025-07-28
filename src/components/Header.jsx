import React from 'react';
import GoogleAuth from './GoogleAuth';
import SyncButton from './SyncButton';

function Header({ searchTerm, setSearchTerm, handleSearch, loading, error }) {
  return (
    <header className="w-full max-w-2xl mb-8 relative">
      <div className="absolute top-0 right-0">
        <GoogleAuth onLogin={(userData) => {
          console.log("Login con Google:", userData);
        }} />
      </div>

      <h1 className="text-5xl font-extrabold text-purple-400 text-center mb-4">SpotyTube</h1>

      {/* Mostra il pulsante di sincronizzazione solo se le condizioni sono rispettate */}
      <SyncButton />

      <form onSubmit={handleSearch} className="flex gap-2 mt-4">
        <input
          type="text"
          className="flex-grow p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
          placeholder="Cerca musica o audiolibri..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors duration-200"
          disabled={loading}
        >
          {loading ? 'Cercando...' : 'Cerca'}
        </button>
      </form>

      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
    </header>
  );
}

export default Header;
