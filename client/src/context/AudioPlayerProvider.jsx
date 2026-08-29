import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioPlayerContext } from './AudioPlayerContext';
import { storageService } from '../services/storage';

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
  const [repeatMode, setRepeatMode] = useState(initialSettings.repeatMode || 'off');
  const [shuffle, setShuffle] = useState(initialSettings.shuffle || false);

  // Modals & Tabs
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // References
  const ytPlayerRef = useRef(null);
  const isYtReadyRef = useRef(false);
  const ytTimeIntervalRef = useRef(null);

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
          onError: (e) => {
            setIsBuffering(false);
            console.warn('[YouTube Player] Error event:', e);
          }
        }
      });
    } catch (err) {
      console.warn('[YouTube Player] Init error:', err);
    }
  };

  // YouTube time tracking loop
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying]);

  // Sync MediaSession API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || 'YouTube Track',
        artist: currentTrack.artist || 'YouTube Artist',
        album: currentTrack.album || 'YouTube Music',
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

  // Play a YouTube track
  const playTrack = useCallback(async (track, newQueue = null) => {
    if (!track) return;

    const videoId = track.originalId || track.id?.replace('youtube_', '');
    if (!videoId) return;

    setCurrentTrack(track);
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById({
          videoId,
          startSeconds: 0
        });
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        setIsBuffering(false);
        storageService.addToHistory(track);
      } catch (err) {
        console.warn('[YouTube Player] loadVideoById error:', err);
      }
    } else {
      setTimeout(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          storageService.addToHistory(track);
        }
      }, 600);
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
  }, []);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!currentTrack || !ytPlayerRef.current) return;

    if (isPlaying) {
      try { ytPlayerRef.current.pauseVideo(); } catch {}
      setIsPlaying(false);
    } else {
      try { ytPlayerRef.current.playVideo(); } catch {}
      setIsPlaying(true);
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

    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try { ytPlayerRef.current.seekTo(clamped, true); } catch {}
    }
  };

  // Volume & Mute
  const changeVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try { ytPlayerRef.current.setVolume(clamped * 100); } catch {}
    }
    if (clamped > 0 && isMuted) setIsMuted(false);
    storageService.saveSettings({ volume: clamped });
  };

  const toggleMute = () => {
    if (isMuted) {
      const vol = volume || 0.8;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        try { ytPlayerRef.current.unMute(); ytPlayerRef.current.setVolume(vol * 100); } catch {}
      }
      setIsMuted(false);
    } else {
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
        volume,
        isMuted,
        playbackRate,
        queue,
        currentIndex,
        repeatMode,
        shuffle,
        isFullscreenPlayerOpen,
        isQueueOpen,
        activeTab,
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
        setActiveTab
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerProvider;
