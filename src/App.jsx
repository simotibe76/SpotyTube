// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Componenti
import Header from './components/Header';
import Navigation from './components/Navigation';
import SearchResults from './components/SearchResults';
import PlayerControls from './components/PlayerControls';
import FavoritesList from './components/FavoritesList';
import HistoryList from './components/HistoryList';
import PlaylistsOverview from './components/PlaylistsOverview';
import PlaylistDetail from './components/PlaylistDetail';
import ToastNotification from './components/ToastNotification';

// Funzioni del database locale (Dexie)
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

// Variabili d'ambiente e costanti
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/youtube.force-ssl';

const SECTIONS = {
  SEARCH: 'search',
  FAVORITES: 'favorites',
  HISTORY: 'history',
  PLAYLISTS: 'playlists',
  VIEW_PLAYLIST: 'viewPlaylist',
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Stati generali dell'applicazione
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Stati per il player e la riproduzione
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [currentPlayingTitle, setCurrentPlayingTitle] = useState('');
  const [playerInstance, setPlayerInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const intervalRef = useRef(null);

  // Stati per la gestione delle sezioni
  const [activeSection, setActiveSection] = useState(SECTIONS.SEARCH);

  // Stati per dati dell'utente (favorites, history, playlists)
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentViewedPlaylistId, setCurrentViewedPlaylistId] = useState(null);

  // Stati per la riproduzione delle playlist
  const [currentPlaylistPlayingId, setCurrentPlaylistPlayingId] = useState(null);
  const [currentPlaylistVideos, setCurrentPlaylistVideos] = useState([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

  // Stati per la modale "Aggiungi a playlist"
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [videoToAdd, setVideoToAdd] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Funzione per chiudere la modale (DEVE ESSERE DEFINITA PRIMA DI ALTRE FUNZIONI CHE LA USANO)
  const closeAddToPlaylistModal = useCallback(() => {
    setShowAddToPlaylistModal(false);
    setVideoToAdd(null);
    setNewPlaylistName('');
  }, []);

  // STATI PER GOOGLE API E AUTENTICAZIONE
  const [gapiInitialized, setGapiInitialized] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const tokenClient = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type });
  }, []);

  useEffect(() => {
    const loadGapi = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: YOUTUBE_API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
          });
          setGapiInitialized(true);
          showToast('API di Google caricate con successo.', 'success');
        } catch (error) {
          console.error('Errore inizializzazione client GAPI:', error);
          showToast('Errore nel caricamento delle API di Google.', 'error');
          setGapiInitialized(false);
        }
      });
    };

    const loadGis = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          console.log("ID Token Callback:", response);
        }
      });

      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            setAccessToken(tokenResponse.access_token);
            setIsSignedIn(true);
            window.gapi.client.setToken({ access_token: tokenResponse.access_token });

            window.gapi.client.youtube.channels.list({
              'part': ['snippet'],
              'mine': true
            }).then(response => {
              if (response.result.items.length > 0) {
                const profile = response.result.items[0].snippet;
                setUserProfile({
                  name: profile.title,
                  imageUrl: profile.thumbnails.default.url
                });
                showToast(`Benvenuto, ${profile.title}!`, 'success');
              }
            }).catch(err => {
              console.error("Errore nel recupero del profilo YouTube:", err);
              showToast("Errore nel recupero del profilo YouTube.", 'error');
            });
          } else {
            console.error("Access token non ricevuto:", tokenResponse);
            setIsSignedIn(false);
            setUserProfile(null);
            setAccessToken(null);
            showToast("Accesso Google fallito.", 'error');
          }
        },
        error_callback: (error) => {
          console.error("Errore OAuth2 Token Client:", error);
          showToast("Accesso Google annullato o fallito.", 'warning');
        }
      });
      setGisLoaded(true);
    };

    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.onload = loadGapi;
    document.body.appendChild(scriptGapi);

    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.onload = loadGis;
    document.body.appendChild(scriptGis);

    return () => {
      document.body.removeChild(scriptGapi);
      document.body.removeChild(scriptGis);
    };
  }, [showToast, YOUTUBE_API_KEY, CLIENT_ID]);

  const handleGoogleAuthClick = useCallback(() => {
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken();
    } else {
      showToast('Il client di autenticazione Google non è pronto.', 'error');
    }
  }, [showToast]);

  const handleSignOut = useCallback(() => {
    if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            console.log('Access token revoked');
            setAccessToken(null);
            setIsSignedIn(false);
            setUserProfile(null);
            window.gapi.client.setToken(null);
            showToast('Disconnesso da Google.', 'info');
        });
    }
  }, [accessToken, showToast]);

  const loadData = useCallback(async (section) => {
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
      } else if (section === SECTIONS.VIEW_PLAYLIST && currentViewedPlaylistId === null) {
        setActiveSection(SECTIONS.PLAYLISTS);
        navigate('/playlists');
      }
    } catch (err) {
      console.error("Error loading data for section:", section, err);
      showToast(`Impossibile caricare i dati per ${section}.`, 'error');
    }
  }, [currentViewedPlaylistId, showToast, navigate]);

  useEffect(() => {
    const currentPath = location.pathname;
    let sectionToLoad = SECTIONS.SEARCH;

    if (currentPath.startsWith('/favorites')) {
      sectionToLoad = SECTIONS.FAVORITES;
    } else if (currentPath.startsWith('/history')) {
      sectionToLoad = SECTIONS.HISTORY;
    } else if (currentPath.startsWith('/playlists')) {
      sectionToLoad = SECTIONS.PLAYLISTS;
    } else if (currentPath.startsWith('/playlist/')) {
      const id = parseInt(currentPath.split('/')[2]);
      if (!isNaN(id)) {
        sectionToLoad = SECTIONS.VIEW_PLAYLIST;
        setCurrentViewedPlaylistId(id);
      } else {
        navigate('/playlists');
      }
    }
    setActiveSection(sectionToLoad);
    loadData(sectionToLoad);
  }, [location.pathname, loadData, navigate]);

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

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!gapiInitialized) {
      showToast('Le API di Google non sono ancora caricate. Riprova tra un momento.', 'warning');
      return;
    }
    if (!searchTerm.trim()) {
      showToast('Inserisci un termine di ricerca valido.', 'info');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults([]);
    navigate('/');

    try {
      const response = await window.gapi.client.Youtube.list({
        part: 'snippet',
        q: searchTerm,
        type: 'video',
        maxResults: 20,
      });

      const videos = response.result.items.filter(item => item.id.kind === 'youtube#video');
      const formattedVideos = videos.map(video => ({
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high.url,
      }));
      setSearchResults(formattedVideos);
      showToast(`Trovati ${formattedVideos.length} risultati per "${searchTerm}".`, 'success');
    } catch (err) {
      console.error("Errore durante la ricerca:", err);
      if (err.result && err.result.error && err.result.error.code === 400) {
        showToast('Errore di richiesta API: verifica la tua Chiave API o i limiti di utilizzo.', 'error');
      } else {
        showToast("Si è verificato un errore durante la ricerca. Riprova più tardi.", 'error');
      }
      setError("Si è verificato un errore durante la ricerca.");
    } finally {
      setLoading(false);
    }
  }, [gapiInitialized, searchTerm, navigate, showToast]);

  const playVideo = useCallback(async (videoData) => {
    setPlayingVideoId(videoData.videoId);
    setCurrentPlayingTitle(videoData.title);
    setIsPlaying(true);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    await addHistoryEntry(videoData);
    showToast(`Riproducendo: ${videoData.title}`, 'info');
    if (activeSection === SECTIONS.HISTORY) {
      loadData(SECTIONS.HISTORY);
    }
  }, [showToast, activeSection, loadData]);

  const handleClosePlayer = useCallback(() => {
    if (playerInstance) {
      playerInstance.stopVideo();
    }
    setPlayingVideoId(null);
    setCurrentPlayingTitle('');
    setIsPlaying(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setCurrentPlaylistPlayingId(null);
    setCurrentPlaylistVideos([]);
    setCurrentPlaylistIndex(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    showToast('Riproduzione terminata.', 'info');
  }, [playerInstance, showToast]);

  const playNextVideo = useCallback(() => {
    if (currentPlaylistPlayingId && currentPlaylistVideos.length > 0) {
      const nextIndex = currentPlaylistIndex + 1;
      if (nextIndex < currentPlaylistVideos.length) {
        setCurrentPlaylistIndex(nextIndex);
        playVideo(currentPlaylistVideos[nextIndex]);
      } else {
        setCurrentPlaylistIndex(0);
        playVideo(currentPlaylistVideos[0]);
        showToast('Playlist completata, riparto dall\'inizio.', 'info');
      }
    } else {
      handleClosePlayer();
    }
  }, [currentPlaylistPlayingId, currentPlaylistVideos, currentPlaylistIndex, playVideo, handleClosePlayer, showToast]);

  const playPreviousVideo = useCallback(() => {
    if (currentPlaylistPlayingId && currentPlaylistVideos.length > 0) {
      const prevIndex = currentPlaylistIndex - 1;
      if (prevIndex >= 0) {
        setCurrentPlaylistIndex(prevIndex);
        playVideo(currentPlaylistVideos[prevIndex]);
      } else {
        setCurrentPlaylistIndex(currentPlaylistVideos.length - 1);
        playVideo(currentPlaylistVideos[currentPlaylistVideos.length - 1]);
        showToast('Torno all\'inizio della playlist.', 'info');
      }
    } else {
      handleClosePlayer();
    }
  }, [currentPlaylistPlayingId, currentPlaylistVideos, currentPlaylistIndex, playVideo, handleClosePlayer, showToast]);

  const onPlayerReady = useCallback((event) => {
    setPlayerInstance(event.target);
    event.target.playVideo();
    setIsPlaying(true);
  }, []);

  const onPlayerStateChange = useCallback((event) => {
    if (!playerInstance) return;

    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setVideoDuration(playerInstance.getDuration());
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        if (playerInstance && !isSeeking) {
          setVideoCurrentTime(playerInstance.getCurrentTime());
        }
      }, 1000);
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      setVideoCurrentTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (currentPlaylistPlayingId && currentPlaylistVideos.length > 0) {
        playNextVideo();
      } else {
        handleClosePlayer();
      }
    }
  }, [playerInstance, isSeeking, currentPlaylistPlayingId, currentPlaylistVideos.length, playNextVideo, handleClosePlayer]);

  const togglePlayPause = useCallback(() => {
    if (playerInstance) {
      if (isPlaying) {
        playerInstance.pauseVideo();
      } else {
        playerInstance.playVideo();
      }
    }
  }, [playerInstance, isPlaying]);

  const handleSeek = useCallback((time) => {
    if (playerInstance) {
      playerInstance.seekTo(time, true);
      setVideoCurrentTime(time);
    }
  }, [playerInstance]);

  const playPlaylist = useCallback(async (playlistId) => {
    const playlistToPlay = await getPlaylist(playlistId);
    if (playlistToPlay && playlistToPlay.videos.length > 0) {
      setCurrentPlaylistPlayingId(playlistId);
      setCurrentPlaylistVideos(playlistToPlay.videos);
      setCurrentPlaylistIndex(0);
      playVideo(playlistToPlay.videos[0]);
      showToast(`Inizio riproduzione playlist: ${playlistToPlay.name}`, 'success');
    } else {
      showToast("La playlist è vuota o non esiste!", 'warning');
      handleClosePlayer();
    }
  }, [playVideo, handleClosePlayer, showToast]);

  const playerOpts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      loop: 0,
      enablejsapi: 1,
    },
  };

  const handleToggleFavorite = useCallback(async (videoData) => {
    const isCurrentlyFavorite = await isFavorite(videoData.videoId);
    if (isCurrentlyFavorite) {
      await removeFavorite(videoData.videoId);
      showToast(`${videoData.title} rimosso dai preferiti.`, 'info');
    } else {
      await addFavorite(videoData);
      showToast(`${videoData.title} aggiunto ai preferiti!`, 'success');
    }
    if (activeSection === SECTIONS.FAVORITES) {
      loadData(SECTIONS.FAVORITES);
    }
    const updatedFavorites = await getFavorites();
    setFavorites(updatedFavorites);
  }, [activeSection, loadData, showToast]);

  const handleCreateNewPlaylist = useCallback(async () => {
    if (newPlaylistName.trim()) {
      await createPlaylist(newPlaylistName.trim());
      showToast(`Playlist "${newPlaylistName.trim()}" creata con successo!`, 'success');
      closeAddToPlaylistModal();
      loadData(SECTIONS.PLAYLISTS);
    } else {
      showToast('Il nome della playlist non può essere vuoto.', 'warning');
    }
  }, [newPlaylistName, closeAddToPlaylistModal, loadData, showToast]);

  const handleViewPlaylist = useCallback((playlistId) => {
    setCurrentViewedPlaylistId(playlistId);
    navigate(`/playlist/${playlistId}`);
  }, [navigate]);

  const handleDeletePlaylist = useCallback(async (playlistId) => {
    if (window.confirm("Sei sicuro di voler eliminare questa playlist?")) {
      await deletePlaylist(playlistId);
      showToast('Playlist eliminata con successo.', 'success');
      loadData(SECTIONS.PLAYLISTS);
      if (currentPlaylist && currentPlaylist.id === playlistId) {
        setCurrentPlaylist(null);
        setCurrentViewedPlaylistId(null);
        navigate('/playlists');
      }
      if (currentPlaylistPlayingId === playlistId) {
        handleClosePlayer();
      }
    }
  }, [loadData, currentPlaylist, currentPlaylistPlayingId, handleClosePlayer, navigate, showToast]);

  const handleRemoveVideoFromPlaylist = useCallback(async (playlistId, videoId) => {
    await removeVideoFromPlaylist(playlistId, videoId);
    showToast('Video rimosso dalla playlist.', 'info');
    loadData(SECTIONS.VIEW_PLAYLIST);
    if (currentPlaylistPlayingId === playlistId) {
      const updatedPlaylist = await getPlaylist(playlistId);
      setCurrentPlaylistVideos(updatedPlaylist.videos);
      if (playingVideoId === videoId && updatedPlaylist.videos.length === 0) {
        handleClosePlayer();
      } else if (playingVideoId === videoId) {
        if (updatedPlaylist.videos.length > 0) {
          const newIndex = updatedPlaylist.videos.findIndex(v => v.videoId === playingVideoId);
          if (newIndex !== -1) {
            setCurrentPlaylistIndex(newIndex);
          } else {
            if (currentPlaylistVideos.length > 0) {
              const nextIndex = Math.min(currentPlaylistIndex, updatedPlaylist.videos.length -1);
              setCurrentPlaylistIndex(nextIndex);
              playVideo(updatedPlaylist.videos[nextIndex]);
            } else {
              handleClosePlayer();
            }
          }
        } else {
          handleClosePlayer();
        }
      }
    }
  }, [loadData, currentPlaylistPlayingId, playingVideoId, currentPlaylistIndex, playVideo, handleClosePlayer, showToast, currentPlaylistVideos]);

  const openCreatePlaylistModal = useCallback(async () => {
    setVideoToAdd(null);
    setShowAddToPlaylistModal(true);
    const pls = await getPlaylists();
    setPlaylists(pls);
  }, []);

  const openAddToPlaylistModal = useCallback(async (video) => {
    setVideoToAdd(video);
    setShowAddToPlaylistModal(true);
    const pls = await getPlaylists();
    setPlaylists(pls);
  }, []);

  const handleAddVideoToExistingPlaylist = useCallback(async (playlistId) => {
    if (!videoToAdd) {
      showToast('Nessun video selezionato per l\'aggiunta.', 'warning');
      return;
    }
    await addVideoToPlaylist(playlistId, videoToAdd);
    showToast(`${videoToAdd.title} aggiunto alla playlist!`, 'success');
    closeAddToPlaylistModal();
    if (activeSection === SECTIONS.VIEW_PLAYLIST && currentPlaylist && currentPlaylist.id === playlistId) {
      loadData(SECTIONS.VIEW_PLAYLIST);
    }
    if (currentPlaylistPlayingId === playlistId) {
      const updatedPlaylist = await getPlaylist(playlistId);
      setCurrentPlaylistVideos(updatedPlaylist.videos);
    }
  }, [videoToAdd, closeAddToPlaylistModal, loadData, activeSection, currentPlaylist, currentPlaylistPlayingId, showToast]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        loading={loading}
        error={error}
        isSignedIn={isSignedIn}
        userProfile={userProfile}
        handleGoogleAuthClick={handleGoogleAuthClick}
        handleSignOut={handleSignOut}
      />
      <div className="flex flex-1 pt-24">
        <Navigation
          activeSection={activeSection}
          setActiveSection={(section) => {
            setActiveSection(section);
            if (section === SECTIONS.SEARCH) navigate('/');
            else navigate(`/${section}`);
          }}
          isSignedIn={isSignedIn}
          userProfile={userProfile}
          handleGoogleAuthClick={handleGoogleAuthClick}
          handleSignOut={handleSignOut}
        />
        <main className="flex-1 p-4 overflow-y-auto pb-32">
          <Routes>
            <Route path="/" element={
              <SearchResults
                results={searchResults}
                playVideo={playVideo}
                handleToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                openAddToPlaylistModal={openAddToPlaylistModal}
              />
            } />
            <Route path="/favorites" element={
              <FavoritesList
                favorites={favorites}
                playVideo={playVideo}
                handleToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
              />
            } />
            <Route path="/history" element={
              <HistoryList
                history={history}
                playVideo={playVideo}
              />
            } />
            <Route path="/playlists" element={
              <PlaylistsOverview
                playlists={playlists}
                openCreatePlaylistModal={openCreatePlaylistModal}
                handleViewPlaylist={handleViewPlaylist}
                handleDeletePlaylist={handleDeletePlaylist}
                playPlaylist={playPlaylist}
              />
            } />
            <Route path="/playlist/:id" element={
              <PlaylistDetail
                playlist={currentPlaylist}
                playVideo={playVideo}
                handleRemoveVideoFromPlaylist={handleRemoveVideoFromPlaylist}
                playPlaylist={playPlaylist}
                currentPlaylistPlayingId={currentPlaylistPlayingId}
                currentPlaylistVideos={currentPlaylistVideos}
                currentPlaylistIndex={currentPlaylistIndex}
                playNextVideo={playNextVideo}
                playPreviousVideo={playPreviousVideo}
              />
            } />
          </Routes>
        </main>
      </div>

      {playingVideoId && (
        <PlayerControls
          videoId={playingVideoId}
          title={currentPlayingTitle}
          onPlayerReady={onPlayerReady}
          onPlayerStateChange={onPlayerStateChange}
          playerOpts={playerOpts}
          isPlaying={isPlaying}
          togglePlayPause={togglePlayPause}
          videoDuration={videoDuration}
          videoCurrentTime={videoCurrentTime}
          handleSeek={handleSeek}
          setIsSeeking={setIsSeeking}
          handleClosePlayer={handleClosePlayer}
          isPlaylistPlaying={!!currentPlaylistPlayingId}
          playNextVideo={playNextVideo}
          playPreviousVideo={playPreviousVideo}
        />
      )}

      {showAddToPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-white">{videoToAdd ? 'Aggiungi a playlist' : 'Crea nuova playlist'}</h2>
            {videoToAdd && (
              <p className="text-gray-300 mb-4">Video selezionato: <span className="font-semibold">{videoToAdd.title}</span></p>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">Le tue playlist:</h3>
              {playlists.length > 0 ? (
                <ul className="max-h-40 overflow-y-auto border border-gray-600 rounded p-2">
                  {playlists.map((pl) => (
                    <li key={pl.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <span className="text-gray-200">{pl.name} ({pl.videos.length})</span>
                      {videoToAdd && (
                        <button
                          onClick={() => handleAddVideoToExistingPlaylist(pl.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-full text-sm transition duration-200"
                        >
                          Aggiungi
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">Nessuna playlist trovata. Creane una nuova!</p>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-white">Crea nuova playlist:</h3>
              <input
                type="text"
                placeholder="Nome nuova playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:shadow-glow"
              />
              <button
                onClick={handleCreateNewPlaylist}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                Crea Playlist
              </button>
            </div>

            <button
              onClick={closeAddToPlaylistModal}
              className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <ToastNotification
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
