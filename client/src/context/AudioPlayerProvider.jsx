import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioPlayerContext } from './AudioPlayerContext';
import { storageService } from '../services/storage';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export const AudioPlayerProvider = ({ children }) => {
  const initialSettings = storageService.getSettings();

  // Playback State
  const [currentTrack, setCurrentTrack] = useState(null);
  const currentTrackRef = useRef(null);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialSettings.volume ?? 0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Active Playback Engine: 'native' | 'youtube'
  const playbackEngineRef = useRef('native');

  // YouTube IFrame Player References
  const ytPlayerRef = useRef(null);
  const isYtReadyRef = useRef(false);
  const ytTimeIntervalRef = useRef(null);

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
    } catch (e) {}
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

  const startYtProgressLoop = () => {
    stopYtProgressLoop();
    ytTimeIntervalRef.current = setInterval(() => {
      if (playbackEngineRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const cur = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          if (dur > 0 && !isNaN(dur)) {
            setDuration(dur);
            if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: dur,
                  playbackRate: 1,
                  position: Math.min(Math.max(cur, 0), dur)
                });
              } catch (e) {}
            }
          }
        } catch (e) {}
      }
    }, 250);
  };

  const stopYtProgressLoop = () => {
    if (ytTimeIntervalRef.current) {
      clearInterval(ytTimeIntervalRef.current);
      ytTimeIntervalRef.current = null;
    }
  };

  // Forward declarations
  const handleNextTrackRef = useRef();
  const lastYtVideoIdRef = useRef(null);

  // Switch to YouTube Iframe Engine with background silent audio focus
  const fallbackToYouTube = useCallback((videoId, track) => {
    if (playbackEngineRef.current === 'youtube' && lastYtVideoIdRef.current === videoId && isPlaying) {
      return;
    }
    playbackEngineRef.current = 'youtube';
    lastYtVideoIdRef.current = videoId;
    stopYtProgressLoop();

    // Reset native audio stream and play silent carrier loop for mobile Chrome background focus & lockscreen
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current.src = SILENT_AUDIO_URI;
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {});
      } catch (e) {}
    }

    const loadVideo = () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          ytPlayerRef.current.loadVideoById({ videoId, startSeconds: 0 });
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          setIsBuffering(false);
          startYtProgressLoop();
          if (track) storageService.addToHistory(track);
        } catch (err) {
          console.warn('YouTube fallback playback error:', err);
        }
      } else {
        setTimeout(loadVideo, 300);
      }
    };

    loadVideo();
  }, [isPlaying]);

  // Initialize YouTube IFrame API once
  useEffect(() => {
    const initYTPlayer = () => {
      if (ytPlayerRef.current || !window.YT) return;
      try {
        let ytDiv = document.getElementById('streamsync-yt-player');
        if (!ytDiv) {
          ytDiv = document.createElement('div');
          ytDiv.id = 'streamsync-yt-player';
          ytDiv.style.position = 'fixed';
          ytDiv.style.bottom = '-9999px';
          ytDiv.style.left = '-9999px';
          ytDiv.style.width = '1px';
          ytDiv.style.height = '1px';
          ytDiv.style.opacity = '0';
          ytDiv.style.pointerEvents = 'none';
          document.body.appendChild(ytDiv);
        }

        ytPlayerRef.current = new window.YT.Player('streamsync-yt-player', {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              isYtReadyRef.current = true;
              if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
                ytPlayerRef.current.setVolume(volume * 100);
              }
            },
            onStateChange: (event) => {
              // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
              if (event.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
                startYtProgressLoop();
              } else if (event.data === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
                stopYtProgressLoop();
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                if (handleNextTrackRef.current) {
                  handleNextTrackRef.current(true);
                }
              }
            },
            onError: (err) => {
              console.warn('YouTube Iframe Player warning:', err);
              setIsBuffering(false);
              // Codes 100 (not found), 101 / 150 (owner restricted embed)
              if (err && (err.data === 100 || err.data === 101 || err.data === 150)) {
                if (handleNextTrackRef.current) {
                  handleNextTrackRef.current(false);
                }
              }
            }
          }
        });
      } catch (err) {}
    };

    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        initYTPlayer();
      };
    }

    return () => {
      stopYtProgressLoop();
    };
  }, []);

  // Attach HTML5 Audio Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = isMuted;
    audio.playbackRate = playbackRate;

    const handlePlay = () => {
      if (playbackEngineRef.current === 'native') setIsPlaying(true);
    };
    const handlePause = () => {
      if (playbackEngineRef.current === 'native') setIsPlaying(false);
    };
    const handleWaiting = () => {
      if (playbackEngineRef.current === 'native') setIsBuffering(true);
    };
    const handleCanPlay = () => {
      if (playbackEngineRef.current === 'native') setIsBuffering(false);
    };
    const handlePlaying = () => {
      if (playbackEngineRef.current === 'native') {
        setIsPlaying(true);
        setIsBuffering(false);
      }
    };

    const handleTimeUpdate = () => {
      if (playbackEngineRef.current === 'native') {
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
      }
    };

    const handleLoadedMetadata = () => {
      if (playbackEngineRef.current === 'native' && audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (playbackEngineRef.current === 'native') {
        if (handleNextTrackRef.current) {
          handleNextTrackRef.current(true);
        }
      }
    };

    const handleError = () => {
      if (playbackEngineRef.current === 'native' && currentTrackRef.current) {
        console.warn('Native HTML5 Audio stream unavailable, auto-switching to Embedded YouTube Engine');
        const videoId = currentTrackRef.current.originalId || currentTrackRef.current.id?.replace('youtube_', '').replace('track_', '');
        fallbackToYouTube(videoId, currentTrackRef.current);
      }
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
  }, [playbackRate, fallbackToYouTube]);

  // Sync MediaSession playbackState ('playing' | 'paused')
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Forward seek, next, prev definitions
  const seekTo = (seconds) => {
    if (isNaN(seconds)) return;
    const dur = duration || (audioRef.current?.duration) || 0;
    const clamped = Math.max(0, Math.min(seconds, dur));
    setCurrentTime(clamped);

    if (playbackEngineRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try { ytPlayerRef.current.seekTo(clamped, true); } catch {}
    } else if (audioRef.current) {
      try { audioRef.current.currentTime = clamped; } catch {}
    }
  };

  // Next Track
  const handleNextTrack = useCallback((isAutoEnded = false) => {
    const curQueue = queueRef.current;
    const curIdx = currentIndexRef.current;
    const curRepeat = repeatModeRef.current;
    const curShuffle = shuffleRef.current;

    if (curRepeat === 'one' && isAutoEnded) {
      seekTo(0);
      if (playbackEngineRef.current === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      } else if (audioRef.current) {
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
      setCurrentIndex(0);
      playTrack(curQueue[0], curQueue);
    }
  }, []);
  handleNextTrackRef.current = handleNextTrack;

  // Previous Track
  const handlePrevTrack = useCallback(() => {
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
  }, [currentTime]);

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
        if (playbackEngineRef.current === 'youtube' && ytPlayerRef.current) {
          try { ytPlayerRef.current.playVideo(); } catch {}
          if (audioRef.current) audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });

      safeSetHandler('pause', () => {
        if (playbackEngineRef.current === 'youtube' && ytPlayerRef.current) {
          try { ytPlayerRef.current.pauseVideo(); } catch {}
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
        } else if (audioRef.current) {
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
        seekTo(Math.max(currentTime - offset, 0));
      });

      safeSetHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        const dur = duration || (audioRef.current?.duration) || 0;
        seekTo(Math.min(currentTime + offset, dur));
      });

      safeSetHandler('stop', () => {
        if (playbackEngineRef.current === 'youtube' && ytPlayerRef.current) {
          try { ytPlayerRef.current.pauseVideo(); } catch {}
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
      });
    }
  }, [currentTrack, duration, currentTime, handleNextTrack, handlePrevTrack]);

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

    // Primary: Try Native HTML5 Streaming
    const streamUrl = `/api/stream/${videoId}`;
    const audio = audioRef.current;
    if (audio) {
      playbackEngineRef.current = 'native';
      audio.loop = false;
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
        if (err?.name === 'AbortError') return;
        // Native streaming unavailable -> auto fallback to embedded engine
        console.warn('Native HTML5 stream failed, falling back to Embedded YouTube Engine:', err?.message || err);
        fallbackToYouTube(videoId, track);
      });
    } else {
      fallbackToYouTube(videoId, track);
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
  }, [playbackRate, fallbackToYouTube]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!currentTrack) return;

    if (playbackEngineRef.current === 'youtube' && ytPlayerRef.current) {
      if (isPlaying) {
        try { ytPlayerRef.current.pauseVideo(); } catch {}
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try { ytPlayerRef.current.playVideo(); } catch {}
        if (audioRef.current) audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  // Volume & Mute
  const changeVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try { ytPlayerRef.current.setVolume(clamped * 100); } catch {}
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
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        try { ytPlayerRef.current.unMute(); ytPlayerRef.current.setVolume(vol * 100); } catch {}
      }
      setIsMuted(false);
    } else {
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        try { ytPlayerRef.current.mute(); } catch {}
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
