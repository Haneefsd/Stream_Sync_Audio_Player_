import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
export { useAudioPlayer } from './useAudioPlayer';

export const AudioPlayerContext = createContext(null);

export const AudioPlayerProvider = ({ children }) => {
  const initialSettings = storageService.getSettings();

  // Playback State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [volume, setVolume] = useState(initialSettings.volume ?? 0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Queue & Modes
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState(initialSettings.repeatMode || 'off');
  const [shuffle, setShuffle] = useState(initialSettings.shuffle || false);
  const [audioQuality, setAudioQuality] = useState(initialSettings.preferredQuality || '320kbps');

  // Active Views / Modals
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Audio References
  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Initialize Web Audio API Analyzer safely without forcing restrictive CORS on the audio tag
  const initWebAudio = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      try {
        const source = audioCtx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        sourceNodeRef.current = source;
      } catch (sourceErr) {
        // Direct media element connection might be restricted, fallback gracefully
      }

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (err) {
      console.warn('Web Audio Analyzer initialized in visual-only mode:', err.message);
    }
  };

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.buffered.length > 0) {
        try {
          setBufferedTime(audio.buffered.end(audio.buffered.length - 1));
        } catch {}
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsBuffering(false);
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      handleNextTrack(true);
    };

    const handleError = () => {
      setIsBuffering(false);
      // Auto-fallback: if direct URL failed, attempt proxy URL
      if (currentTrack && audio.src && !audio.src.includes('/api/proxy-stream')) {
        const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(audio.src)}`;
        audio.src = proxyUrl;
        audio.load();
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeatMode, shuffle, queue, currentIndex, currentTrack]);

  // Sync MediaSession API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || 'StreamSync Track',
        artist: currentTrack.artist || 'StreamSync Audio',
        album: currentTrack.album || 'StreamSync',
        artwork: [
          { src: currentTrack.thumbnailUrl || '/icon.png', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextTrack(false));
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      });
    }
  }, [currentTrack]);

  // Play a specific track
  const playTrack = useCallback(async (track, newQueue = null) => {
    if (!track) return;
    initWebAudio();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    const streamUrl = apiService.getStreamUrl(track, audioQuality);
    if (!streamUrl) {
      console.error('No streamable URL available for track:', track);
      return;
    }

    const audio = audioRef.current;
    
    // Clean audio state reset
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = streamUrl;
      audio.load();
    } catch (loadErr) {
      console.warn('Audio source loading issue:', loadErr);
    }

    setCurrentTrack(track);
    setIsBuffering(true);

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setIsBuffering(false);
        storageService.addToHistory(track);
      }
    } catch (err) {
      console.warn('Playback gesture required or source loading:', err.message);
      setIsBuffering(false);
    }

    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setQueue(prev => {
        const exists = prev.findIndex(t => t.id === track.id);
        if (exists >= 0) {
          setCurrentIndex(exists);
          return prev;
        }
        const updated = [track, ...prev];
        setCurrentIndex(0);
        return updated;
      });
    }
  }, [audioQuality]);

  // Toggle Play / Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio.src || !currentTrack) return;

    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  // Next Track
  const handleNextTrack = (isAutoEnded = false) => {
    if (repeatMode === 'one' && isAutoEnded) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      return;
    }

    if (queue.length === 0) return;

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentIndex(randomIndex);
      playTrack(queue[randomIndex]);
      return;
    }

    if (currentIndex < queue.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      playTrack(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
      playTrack(queue[0]);
    } else {
      setIsPlaying(false);
    }
  };

  // Previous Track
  const handlePrevTrack = () => {
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;

    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      playTrack(queue[prevIdx]);
    } else {
      playTrack(queue[queue.length - 1]);
      setCurrentIndex(queue.length - 1);
    }
  };

  // Seek
  const seekTo = (seconds) => {
    if (isNaN(seconds)) return;
    const clamped = Math.max(0, Math.min(seconds, duration));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  // Volume & Mute
  const changeVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    audioRef.current.volume = clamped;
    if (clamped > 0 && isMuted) setIsMuted(false);
    storageService.saveSettings({ volume: clamped });
  };

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Repeat Mode toggle
  const toggleRepeatMode = () => {
    const modes = ['off', 'all', 'one'];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
    storageService.saveSettings({ repeatMode: next });
  };

  // Shuffle toggle
  const toggleShuffle = () => {
    const next = !shuffle;
    setShuffle(next);
    storageService.saveSettings({ shuffle: next });
  };

  // Queue Operations
  const addToQueue = (track) => {
    setQueue(prev => [...prev, track]);
  };

  const playNextInQueue = (track) => {
    setQueue(prev => {
      const clone = [...prev];
      clone.splice(currentIndex + 1, 0, track);
      return clone;
    });
  };

  const removeFromQueue = (index) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isBuffering,
        currentTime,
        duration,
        bufferedTime,
        volume,
        isMuted,
        playbackRate,
        queue,
        currentIndex,
        repeatMode,
        shuffle,
        audioQuality,
        isFullscreenPlayerOpen,
        isQueueOpen,
        isSpotifyModalOpen,
        activeTab,
        analyserRef,
        playTrack,
        togglePlay,
        handleNextTrack,
        handlePrevTrack,
        seekTo,
        changeVolume,
        toggleMute,
        setPlaybackRate,
        toggleRepeatMode,
        toggleShuffle,
        setAudioQuality,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,
        setIsFullscreenPlayerOpen,
        setIsQueueOpen,
        setIsSpotifyModalOpen,
        setActiveTab
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};
