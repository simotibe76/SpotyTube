import React from 'react';
import YouTube from 'react-youtube';
import { PlayIcon, PauseIcon, BackwardIcon, ForwardIcon, XMarkIcon } from '@heroicons/react/24/solid';

function PlayerControls({
  playingVideoId,
  currentPlayingTitle,
  isPlaying,
  togglePlayPause,
  playerOpts,
  onPlayerReady,
  onPlayerStateChange,
  videoDuration,
  videoCurrentTime,
  handleSeek,
  setIsSeeking,
  handleClosePlayer, 
  // NUOVE PROP
  playNextVideo,
  playPreviousVideo,
  isPlaylistActive, // Indica se una playlist è attiva
}) {

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) {
      return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const handleProgressBarChange = (e) => {
    const newTime = parseFloat(e.target.value);
    handleSeek(newTime);
  };

  const handleMouseDown = () => {
    setIsSeeking(true);
  };

  const handleMouseUp = () => {
    setIsSeeking(false);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 p-4 shadow-2xl z-50 transition-all duration-300">
      <div className="relative">
        <React.Fragment> 
          <YouTube
            videoId={playingVideoId}
            opts={playerOpts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
          />

          {/* Pulsante di chiusura del player */}
          <button
            onClick={handleClosePlayer}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 p-1 m-1 text-gray-400 hover:text-white bg-gray-700 rounded-full"
            title="Chiudi Player"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center justify-between text-gray-300 text-sm mb-2">
            <span>{formatTime(videoCurrentTime)}</span>
            <span>{formatTime(videoDuration)}</span>
          </div>

          <input
            type="range"
            min="0"
            max={videoDuration || 0}
            value={videoCurrentTime}
            onChange={handleProgressBarChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-purple-600"
            style={{
              background: `linear-gradient(to right, #9333ea ${((videoCurrentTime / videoDuration) * 100) || 0}%, #4b5563 ${((videoCurrentTime / videoDuration) * 100) || 0}%)`
            }}
          />

          <div className="flex items-center justify-center space-x-4 mt-2">
            {/* Pulsante PRECEDENTE (attivo solo se una playlist è in riproduzione) */}
            <button
              onClick={playPreviousVideo}
              className={`p-2 rounded-full transition-colors duration-200 
                ${isPlaylistActive ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600 cursor-not-allowed'}`}
              title="Precedente"
              disabled={!isPlaylistActive} // Disabilita se non c'è una playlist
            >
              <BackwardIcon className="h-6 w-6" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
              title={isPlaying ? "Metti in Pausa" : "Riproduci"}
            >
              {isPlaying ? (
                <PauseIcon className="h-8 w-8 text-white" />
              ) : (
                <PlayIcon className="h-8 w-8 text-white" />
              )}
            </button>

            {/* Pulsante SUCCESSIVO (attivo solo se una playlist è in riproduzione) */}
            <button
              onClick={playNextVideo}
              className={`p-2 rounded-full transition-colors duration-200 
                ${isPlaylistActive ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600 cursor-not-allowed'}`}
              title="Successivo"
              disabled={!isPlaylistActive} // Disabilita se non c'è una playlist
            >
              <ForwardIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center text-lg font-semibold text-white mt-2">
            {currentPlayingTitle || "Nessun video in riproduzione"}
          </div>
        </React.Fragment>
      </div> 
    </div>
  );
}

export default PlayerControls;