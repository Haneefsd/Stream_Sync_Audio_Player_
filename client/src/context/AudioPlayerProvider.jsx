import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioPlayerContext } from './AudioPlayerContext';
import { storageService } from '../services/storage';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

export const AudioPlayerProvider = ({ children }) => {
  const initialSettings = storageService.getSettings();

  // Playback State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialSettings.volume ?? 0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Queue & Modes
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState(initialSettings.repeatMode || 'off'); // 'off' | 'all' | 'one'
  const [shuffle, setShuffle] = useState(initialSettings.shuffle || false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const currentPlaylistIdRef = useRef(null);
  useEffect(() => { currentPlaylistIdRef.current = currentPlaylistId; }, [currentPlaylistId]);

  // Modals & Tabs
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);
  const [pageRefreshKey, setPageRefreshKey] = useState(0);

  const refreshPage = useCallback(() => {
    setActiveTab('home');
    setIsQueueOpen(false);
    setIsFullscreenPlayerOpen(false);
    setPlaylistModalTrack(null);
    setPageRefreshKey(prev => prev + 1);
  }, []);

  // Native HTML5 Audio & Web Audio API References
  const audioRef = useRef(null);
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
  }

  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  const initWebAudio = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch (e) {
      // WebAudio setup warning fallback
    }
  };

  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const repeatModeRef = useRef(repeatMode);
  const shuffleRef = useRef(shuffle);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);

  // Immediately update queue when songs are added to the currently playing playlist
  useEffect(() => {
    const handlePlaylistsUpdated = (e) => {
      const activePlId = currentPlaylistIdRef.current;
      if (!activePlId) return;

      const detail = e?.detail;
      if (detail?.playlistId && detail.playlistId !== activePlId) return;

      const playlists = storageService.getPlaylists();
      const activePlaylist = playlists.find(p => p.id === activePlId);
      if (!activePlaylist) return;

      if (detail?.addedTrack) {
        setQueue(prevQueue => {
          if (prevQueue.some(t => t.id === detail.addedTrack.id)) return prevQueue;
          return [...prevQueue, detail.addedTrack];
        });
      } else if (detail?.removedTrackId) {
        setQueue(prevQueue => prevQueue.filter(t => t.id !== detail.removedTrackId));
      } else {
        setQueue(prevQueue => {
          const existingIds = new Set(prevQueue.map(t => t.id));
          const newTracks = activePlaylist.tracks.filter(t => !existingIds.has(t.id));
          if (newTracks.length > 0) {
            return [...prevQueue, ...newTracks];
          }
          return prevQueue;
        });
      }
    };

    window.addEventListener('playlistsUpdated', handlePlaylistsUpdated);
    return () => window.removeEventListener('playlistsUpdated', handlePlaylistsUpdated);
  }, []);

  // Attach HTML5 Audio Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = isMuted;
    audio.playbackRate = playbackRate;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handlePlaying = () => { setIsPlaying(true); setIsBuffering(false); };

    const handleTimeUpdate = () => {
      const cur = audio.currentTime || 0;
      const dur = audio.duration || 0;
      setCurrentTime(cur);
      if (dur > 0 && !isNaN(dur)) {
        setDuration(dur);
        if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
          try {
            navigator.mediaSession.setPositionState({
              duration: dur,
              playbackRate: audio.playbackRate || 1,
              position: Math.min(Math.max(cur, 0), dur)
            });
          } catch (e) {}
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      handleNextTrack(true);
    };

    const handleError = (e) => {
      console.warn('Native HTML5 Audio error, attempting recovery/next:', e);
      setIsBuffering(false);
      setTimeout(() => {
        handleNextTrack(false);
      }, 1000);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playbackRate]);

  // Sync MediaSession playbackState ('playing' | 'paused')
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Sync MediaSession API metadata & action handlers
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      const artUrl = currentTrack.thumbnailUrl || '/pwa-512x512.png';
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || 'Track',
        artist: currentTrack.artist || 'Artist',
        album: currentTrack.album || 'StreamSync Audio Player',
        artwork: [
          { src: artUrl, sizes: '96x96', type: 'image/png' },
          { src: artUrl, sizes: '128x128', type: 'image/png' },
          { src: artUrl, sizes: '192x192', type: 'image/png' },
          { src: artUrl, sizes: '256x256', type: 'image/png' },
          { src: artUrl, sizes: '384x384', type: 'image/png' },
          { src: artUrl, sizes: '512x512', type: 'image/png' }
        ]
      });

      const safeSetHandler = (action, handler) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (err) {}
      };

      safeSetHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });

      safeSetHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });

      safeSetHandler('previoustrack', () => handlePrevTrack());
      safeSetHandler('nexttrack', () => handleNextTrack(false));

      safeSetHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      });

      safeSetHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          const cur = audioRef.current.currentTime || 0;
          seekTo(Math.max(cur - offset, 0));
        }
      });

      safeSetHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          const cur = audioRef.current.currentTime || 0;
          const dur = duration || audioRef.current.duration || 0;
          seekTo(Math.min(cur + offset, dur));
        }
      });

      safeSetHandler('stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      });
    }
  }, [currentTrack, duration]);

  // Play a track
  const playTrack = useCallback((track, newQueue = null, playlistId = undefined) => {
    if (!track) return;

    // Track active playlist context
    if (playlistId !== undefined) {
      setCurrentPlaylistId(playlistId);
    } else if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
      const allPlaylists = storageService.getPlaylists();
      const matched = allPlaylists.find(p => 
        p.tracks && p.tracks.length > 0 &&
        p.tracks.length === newQueue.length &&
        p.tracks[0]?.id === newQueue[0]?.id &&
        p.tracks[p.tracks.length - 1]?.id === newQueue[newQueue.length - 1]?.id
      );
      setCurrentPlaylistId(matched ? matched.id : null);
    }

    const videoId = track.originalId || track.id?.replace('youtube_', '').replace('track_', '');
    if (!videoId) return;

    setCurrentTrack(track);
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    const streamUrl = `/api/stream/${videoId}`;
    const audio = audioRef.current;
    if (audio) {
      audio.src = streamUrl;
      audio.playbackRate = playbackRate || 1;

      initWebAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      audio.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
        storageService.addToHistory(track);
      }).catch((err) => {
        console.warn('Native HTML5 play error:', err);
        setIsBuffering(false);
      });
    }

    if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
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
  }, [playbackRate]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;
    if (audio.paused) {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  // Next Track - Automatically loops and plays next song
  const handleNextTrack = (isAutoEnded = false) => {
    const curQueue = queueRef.current;
    const curIdx = currentIndexRef.current;
    const curRepeat = repeatModeRef.current;
    const curShuffle = shuffleRef.current;

    if (curRepeat === 'one' && isAutoEnded) {
      seekTo(0);
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    if (!curQueue || curQueue.length === 0) return;

    if (curShuffle) {
      const randomIndex = Math.floor(Math.random() * curQueue.length);
      setCurrentIndex(randomIndex);
      playTrack(curQueue[randomIndex], curQueue);
      return;
    }

    if (curIdx < curQueue.length - 1) {
      const nextIdx = curIdx + 1;
      setCurrentIndex(nextIdx);
      playTrack(curQueue[nextIdx], curQueue);
    } else {
      // Loop back to the beginning of the playlist/queue
      setCurrentIndex(0);
      playTrack(curQueue[0], curQueue);
    }
  };

  // Previous Track
  const handlePrevTrack = () => {
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const curQueue = queueRef.current;
    const curIdx = currentIndexRef.current;
    if (!curQueue || curQueue.length === 0) return;

    if (curIdx > 0) {
      const prevIdx = curIdx - 1;
      setCurrentIndex(prevIdx);
      playTrack(curQueue[prevIdx], curQueue);
    } else {
      playTrack(curQueue[curQueue.length - 1], curQueue);
      setCurrentIndex(curQueue.length - 1);
    }
  };

  // Seek
  const seekTo = (seconds) => {
    if (isNaN(seconds) || !audioRef.current) return;
    const dur = duration || audioRef.current.duration || 0;
    const clamped = Math.max(0, Math.min(seconds, dur));
    setCurrentTime(clamped);
    try {
      audioRef.current.currentTime = clamped;
    } catch (e) {}
  };

  // Volume & Mute
  const changeVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) setIsMuted(false);
    storageService.saveSettings({ volume: clamped });
  };

  const toggleMute = () => {
    if (isMuted) {
      const vol = volume || 0.8;
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = vol;
      }
      setIsMuted(false);
    } else {
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
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

  const openAddToPlaylist = (track) => {
    setPlaylistModalTrack(track);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isBuffering,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        queue,
        currentIndex,
        repeatMode,
        shuffle,
        analyserRef,
        isFullscreenPlayerOpen,
        isQueueOpen,
        activeTab,
        pageRefreshKey,
        refreshPage,
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
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,
        setIsFullscreenPlayerOpen,
        setIsQueueOpen,
        setActiveTab,
        openAddToPlaylist,
        currentPlaylistId,
        setCurrentPlaylistId
      }}
    >
      {children}

      {/* Add To Playlist Modal */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerProvider;
