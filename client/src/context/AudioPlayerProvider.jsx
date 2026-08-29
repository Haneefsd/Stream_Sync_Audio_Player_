import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioPlayerContext } from './AudioPlayerContext';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';

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
  const [activeEngine, setActiveEngine] = useState('html5'); // 'html5' | 'youtube'

  // Queue & Modes
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState(initialSettings.repeatMode || 'off');
  const [shuffle, setShuffle] = useState(initialSettings.shuffle || false);
  const [audioQuality, setAudioQuality] = useState(initialSettings.preferredQuality || '320kbps');

  // Modals & Tabs
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // References
  const html5AudioRef = useRef(new Audio());
  const ytPlayerRef = useRef(null);
  const isYtReadyRef = useRef(false);
  const ytTimeIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize YouTube IFrame API once
  useEffect(() => {
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
      if (ytTimeIntervalRef.current) clearInterval(ytTimeIntervalRef.current);
    };
  }, []);

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
              const dur = ytPlayerRef.current.getDuration();
              if (dur) setDuration(dur);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 3) {
              setIsBuffering(true);
            } else if (event.data === 0) {
              handleNextTrack(true);
            }
          },
          onError: () => {
            setIsBuffering(false);
            console.warn('[YT Engine] Playback error encountered');
          }
        }
      });
    } catch (err) {
      console.warn('[YT Engine] Initialization error:', err);
    }
  };

  // YouTube time tracking loop
  useEffect(() => {
    if (activeEngine === 'youtube' && isPlaying) {
      if (!ytTimeIntervalRef.current) {
        ytTimeIntervalRef.current = setInterval(() => {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
            try {
              const cur = ytPlayerRef.current.getCurrentTime() || 0;
              const dur = ytPlayerRef.current.getDuration() || 0;
              setCurrentTime(cur);
              if (dur > 0) setDuration(dur);
            } catch {}
          }
        }, 300);
      }
    } else {
      if (ytTimeIntervalRef.current) {
        clearInterval(ytTimeIntervalRef.current);
        ytTimeIntervalRef.current = null;
      }
    }
    return () => {
      if (ytTimeIntervalRef.current) {
        clearInterval(ytTimeIntervalRef.current);
        ytTimeIntervalRef.current = null;
      }
    };
  }, [activeEngine, isPlaying]);

  // Setup HTML5 Web Audio Visualizer
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
        const source = audioCtx.createMediaElementSource(html5AudioRef.current);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch {}

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch {}
  };

  // HTML5 audio element event listeners
  useEffect(() => {
    const audio = html5AudioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      if (activeEngine === 'html5') {
        setCurrentTime(audio.currentTime);
        if (audio.buffered.length > 0) {
          try {
            setBufferedTime(audio.buffered.end(audio.buffered.length - 1));
          } catch {}
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (activeEngine === 'html5') {
        setDuration(audio.duration || 0);
        setIsBuffering(false);
      }
    };

    const handleCanPlay = () => {
      if (activeEngine === 'html5') setIsBuffering(false);
    };

    const handleWaiting = () => {
      if (activeEngine === 'html5') setIsBuffering(true);
    };

    const handlePlaying = () => {
      if (activeEngine === 'html5') {
        setIsBuffering(false);
        setIsPlaying(true);
      }
    };

    const handlePause = () => {
      if (activeEngine === 'html5') setIsPlaying(false);
    };

    const handleEnded = () => {
      if (activeEngine === 'html5') handleNextTrack(true);
    };

    const handleError = () => {
      if (activeEngine === 'html5') {
        setIsBuffering(false);
        // Fallback to YouTube engine if HTML5 failed on a YouTube track
        if (currentTrack && currentTrack.source === 'youtube') {
          console.log('[Player] HTML5 failed, switching to YouTube engine for:', currentTrack.title);
          playViaYouTubeEngine(currentTrack);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [activeEngine, currentTrack]);

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

  // Play via YouTube IFrame engine
  const playViaYouTubeEngine = (track) => {
    setActiveEngine('youtube');
    html5AudioRef.current.pause();

    const videoId = track.originalId || track.id?.replace('youtube_', '');
    if (!videoId) return;

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById({
          videoId,
          startSeconds: 0
        });
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        setIsBuffering(false);
      } catch (err) {
        console.warn('[YT Engine] loadVideoById error:', err);
      }
    } else {
      // Retry in 500ms if player is initializing
      setTimeout(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      }, 500);
    }
  };

  // Play a specific track
  const playTrack = useCallback(async (track, newQueue = null) => {
    if (!track) return;
    initWebAudio();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    setCurrentTrack(track);
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    // If track is from JioSaavn or has a direct 320k stream URL:
    if (track.source === 'jiosaavn' || track.streamUrl) {
      setActiveEngine('html5');
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try { ytPlayerRef.current.pauseVideo(); } catch {}
      }

      const streamUrl = apiService.getStreamUrl(track, audioQuality);
      const audio = html5AudioRef.current;
      try {
        audio.pause();
        audio.src = streamUrl;
        audio.load();
        const p = audio.play();
        if (p !== undefined) {
          await p;
          setIsPlaying(true);
          setIsBuffering(false);
          storageService.addToHistory(track);
        }
      } catch (err) {
        console.warn('[HTML5 Engine] Playback start gesture or load:', err.message);
        setIsBuffering(false);
      }
    } else if (track.source === 'youtube') {
      // For YouTube tracks: check if we can get a high-quality JioSaavn match first
      try {
        const cleanTitle = (track.title || '')
          .replace(/\(.*?\)|\[.*?\]/g, '')
          .replace(/official video|music video|lyric video|audio|full song/gi, '')
          .trim();
        const searchResults = await apiService.search(`${cleanTitle} ${track.artist || ''}`, 'jiosaavn', 1);
        if (searchResults.length > 0 && searchResults[0].streamUrl) {
          const matched = searchResults[0];
          console.log(`[Player] Matched YouTube "${track.title}" with JioSaavn 320k: ${matched.title}`);
          setActiveEngine('html5');
          if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
            try { ytPlayerRef.current.pauseVideo(); } catch {}
          }
          const audio = html5AudioRef.current;
          audio.pause();
          audio.src = matched.streamUrl;
          audio.load();
          const p = audio.play();
          if (p !== undefined) {
            await p;
            setIsPlaying(true);
            setIsBuffering(false);
            storageService.addToHistory(track);
          }
        } else {
          // Play via YouTube Engine directly
          playViaYouTubeEngine(track);
          storageService.addToHistory(track);
        }
      } catch (e) {
        playViaYouTubeEngine(track);
        storageService.addToHistory(track);
      }
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
    if (!currentTrack) return;

    if (activeEngine === 'youtube') {
      if (ytPlayerRef.current) {
        if (isPlaying) {
          try { ytPlayerRef.current.pauseVideo(); } catch {}
          setIsPlaying(false);
        } else {
          try { ytPlayerRef.current.playVideo(); } catch {}
          setIsPlaying(true);
        }
      }
    } else {
      const audio = html5AudioRef.current;
      if (!audio.src) return;

      initWebAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  // Next Track
  const handleNextTrack = (isAutoEnded = false) => {
    if (repeatMode === 'one' && isAutoEnded) {
      seekTo(0);
      togglePlay();
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
    if (currentTime > 3) {
      seekTo(0);
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
    setCurrentTime(clamped);

    if (activeEngine === 'youtube') {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try { ytPlayerRef.current.seekTo(clamped, true); } catch {}
      }
    } else {
      html5AudioRef.current.currentTime = clamped;
    }
  };

  // Volume & Mute
  const changeVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    html5AudioRef.current.volume = clamped;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try { ytPlayerRef.current.setVolume(clamped * 100); } catch {}
    }
    if (clamped > 0 && isMuted) setIsMuted(false);
    storageService.saveSettings({ volume: clamped });
  };

  const toggleMute = () => {
    if (isMuted) {
      const vol = volume || 0.8;
      html5AudioRef.current.volume = vol;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        try { ytPlayerRef.current.unMute(); ytPlayerRef.current.setVolume(vol * 100); } catch {}
      }
      setIsMuted(false);
    } else {
      html5AudioRef.current.volume = 0;
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
        activeEngine,
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

export default AudioPlayerProvider;
