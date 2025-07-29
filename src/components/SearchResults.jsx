import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import SyncButton from "./components/SyncButton";

import {
  HeartIcon,
  PlusIcon,
  TrashIcon,
  ListBulletIcon,
  XMarkIcon, 
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

import Header from './components/Header';
import Navigation from './components/Navigation';
import PlayerControls from './components/PlayerControls';
import SearchResults from './components/SearchResults';
import FavoritesList from './components/FavoritesList';
import HistoryList from './components/HistoryList';
import PlaylistsOverview from './components/PlaylistsOverview';
import PlaylistDetail from './components/PlaylistDetail'; 

import {
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite,
  addHistoryEntry,
  getHistory,
  createPlaylist,
  getPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  getPlaylist
} from './db';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const SECTIONS = {
  SEARCH: 'search',
  FAVORITES: 'favorites',
  HISTORY: 'history',
  PLAYLISTS: 'playlists',
  VIEW_PLAYLIST: 'viewPlaylist',
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [currentPlayingTitle, setCurrentPlayingTitle] = useState('');
  const [playerInstance, setPlayerInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS.SEARCH);

  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentViewedPlaylistId, setCurrentViewedPlaylistId] = useState(null);

  const [user, setUser] = useState(null);

  const intervalRef = useRef(null);

  const loadData = async (section) => {
    try {
      if (section === SECTIONS.FAVORITES) {
        const favs = await getFavorites();
        setFavorites(favs);
      } else if (section === SECTIONS.HISTORY) {
        const hist = await getHistory();
        setHistory(hist);
      } else if (section === SECTIONS.PLAYLISTS) {
        const pls = await getPlaylists();
        setPlaylists(pls);
      } else if (section === SECTIONS.VIEW_PLAYLIST && typeof currentViewedPlaylistId === 'number') { 
        console.log(`loadData: Caricamento playlist ID: ${currentViewedPlaylistId}`);
        const pl = await getPlaylist(currentViewedPlaylistId);
        setCurrentPlaylist(pl);
      } else if (section === SECTIONS.VIEW_PLAYLIST && currentViewedPlaylistId === null) {
         console.warn("loadData: Tentativo di visualizzare playlist senza ID valido. Resetto la sezione.");
         setActiveSection(SECTIONS.PLAYLISTS); 
      }
    } catch (err) {
      console.error("Error loading data for section:", section, err);
      setError(`Impossibile caricare i dati per ${section}.`);
    }
  };

  useEffect(() => {
    loadData(activeSection);
  }, [activeSection, currentViewedPlaylistId]);

  useEffect(() => {
    const fetchFavoritesOnLoad = async () => {
      const favs = await getFavorites();
      setFavorites(favs);
    };
    fetchFavoritesOnLoad();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={() => {}}
        loading={loading}
        error={error}
        user={user}
        favorites={favorites}
        playlists={playlists}
        onLogin={(data) => setUser(data)}
      />
      {/* resto dell'app invariato */}
    </div>
  );
}

export default App;
