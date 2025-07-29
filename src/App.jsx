import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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

  const [user, setUser] = useState(null); // 👈 stato utente loggato
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [activeSection, setActiveSection] = useState(SECTIONS.SEARCH);
  const [currentViewedPlaylistId, setCurrentViewedPlaylistId] = useState(null);

  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [currentPlayingTitle, setCurrentPlayingTitle] = useState('');
  const [playerInstance, setPlayerInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [currentPlaylistPlayingId, setCurrentPlaylistPlayingId] = useState(null);
  const [currentPlaylistVideos, setCurrentPlaylistVideos] = useState([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

  const intervalRef = useRef(null);

  const handleLogin = (userData) => {
    console.log("Login effettuato:", userData);
    setUser(userData);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults([]);
    setActiveSection(SECTIONS.SEARCH);
    setCurrentViewedPlaylistId(null);

    try {
      const response = await axios.get(`${BASE_URL}/search`, {
        params: {
          part: 'snippet',
          q: searchTerm,
          key: YOUTUBE_API_KEY,
          type: 'video',
          maxResults: 10,
        },
      });

      const videos = response.data.items.filter(item => item.id.kind === 'youtube#video');
      const formattedVideos = videos.map(video => ({
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.default.url,
      }));
      setSearchResults(formattedVideos);
    } catch (err) {
      console.error("Errore durante la ricerca:", err);
      setError("Errore durante la ricerca. Riprova.");
    } finally {
      setLoading(false);
    }
  };

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
        const pl = await getPlaylist(currentViewedPlaylistId);
        setCurrentPlaylist(pl);
      }
    } catch (err) {
      console.error("Errore nel caricamento dati:", err);
      setError(`Errore nel caricamento della sezione ${section}`);
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const playVideo = async (videoData) => {
    setPlayingVideoId(videoData.videoId);
    setCurrentPlayingTitle(videoData.title);
    setIsPlaying(true);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    await addHistoryEntry(videoData);
    if (activeSection === SECTIONS.HISTORY) {
      loadData(SECTIONS.HISTORY);
    }
  };

  const onPlayerReady = (event) => {
    setPlayerInstance(event.target);
    event.target.playVideo();
    setIsPlaying(true);
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      if (playerInstance) {
        setVideoDuration(playerInstance.getDuration());
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          if (playerInstance && !isSeeking) {
            setVideoCurrentTime(playerInstance.getCurrentTime());
          }
        }, 1000);
      }
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      setVideoCurrentTime(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (currentPlaylistPlayingId && currentPlaylistVideos.length > 0) {
        playNextVideo();
      } else {
        handleClosePlayer();
      }
    }
  };

  const togglePlayPause = () => {
    if (playerInstance) {
      isPlaying ? playerInstance.pauseVideo() : playerInstance.playVideo();
    }
  };

  const handleSeek = (time) => {
    if (playerInstance) {
      playerInstance.seekTo(time, true);
      setVideoCurrentTime(time);
    }
  };

  const handleClosePlayer = () => {
    if (playerInstance) playerInstance.stopVideo();
    setPlayingVideoId(null);
    setCurrentPlayingTitle('');
    setIsPlaying(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setCurrentPlaylistPlayingId(null);
    setCurrentPlaylistVideos([]);
    setCurrentPlaylistIndex(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const playNextVideo = () => {
    if (currentPlaylistPlayingId && currentPlaylistVideos.length > 0) {
      const nextIndex = currentPlaylistIndex + 1;
      if (nextIndex < currentPlaylistVideos.length) {
        setCurrentPlaylistIndex(nextIndex);
        playVideo(currentPlaylistVideos[nextIndex]);
      } else {
        setCurrentPlaylistIndex(0);
        playVideo(currentPlaylistVideos[0]);
      }
    } else {
      handleClosePlayer();
    }
  };

  const playPreviousVideo = () => {
    if (currentPlaylistPlayingId && currentPlaylistVideos.length > 0) {
      const prevIndex = currentPlaylistIndex - 1;
      if (prevIndex >= 0) {
        setCurrentPlaylistIndex(prevIndex);
        playVideo(currentPlaylistVideos[prevIndex]);
      } else {
        setCurrentPlaylistIndex(currentPlaylistVideos.length - 1);
        playVideo(currentPlaylistVideos[currentPlaylistVideos.length - 1]);
      }
    } else {
      handleClosePlayer();
    }
  };

  const renderContent = () => {
    switch (activeSection) {
case SECTIONS.SEARCH:
  return (
    <SearchResults
      searchResults={searchResults}
      playVideo={playVideo}
      favorites={favorites}
      handleToggleFavorite={async (video) => {
        const isFav = favorites.some((fav) => fav.videoId === video.videoId);
        if (isFav) {
          await removeFavorite(video.videoId);
        } else {
          await addFavorite(video);
        }
        const updatedFavorites = await getFavorites();
        setFavorites(updatedFavorites);
      }}
      openAddToPlaylistModal={(video) => {
        console.log("TODO: Apri modal per aggiungere a playlist", video);
      }}
    />
  );

      case SECTIONS.FAVORITES:
        return (
          <FavoritesList
            favorites={favorites}
            playVideo={playVideo}
          />
        );
      case SECTIONS.HISTORY:
        return (
          <HistoryList
            history={history}
            playVideo={playVideo}
            favorites={favorites}
          />
        );
      case SECTIONS.PLAYLISTS:
        return (
          <PlaylistsOverview
            playlists={playlists}
            setActiveSection={setActiveSection}
          />
        );
      case SECTIONS.VIEW_PLAYLIST:
        return (
          <PlaylistDetail
            playlist={currentPlaylist}
            setActiveSection={setActiveSection}
            playVideo={playVideo}
          />
        );
      default:
        return null;
    }
  };

  const playerOpts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        loading={loading}
        error={error}
        user={user}
        favorites={favorites}
        playlists={playlists}
        onLogin={handleLogin}
      />

      <main className="w-full max-w-2xl flex-grow mb-4">
        {renderContent()}
      </main>

      <Navigation
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        setSearchResults={setSearchResults}
      />

      {playingVideoId && (
        <PlayerControls
          playingVideoId={playingVideoId}
          currentPlayingTitle={currentPlayingTitle}
          isPlaying={isPlaying}
          togglePlayPause={togglePlayPause}
          playerOpts={playerOpts}
          onPlayerReady={onPlayerReady}
          onPlayerStateChange={onPlayerStateChange}
          videoDuration={videoDuration}
          videoCurrentTime={videoCurrentTime}
          handleSeek={handleSeek}
          setIsSeeking={setIsSeeking}
          handleClosePlayer={handleClosePlayer}
          playNextVideo={playNextVideo}
          playPreviousVideo={playPreviousVideo}
          isPlaylistActive={!!currentPlaylistPlayingId}
        />
      )}
    </div>
  );
}

export default App;
