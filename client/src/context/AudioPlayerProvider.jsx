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

  // References
  const ytPlayerRef = useRef(null);
  const isYtReadyRef = useRef(false);
  const ytTimeIntervalRef = useRef(null);
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
              // Song Ended -> Automaticaly play the next song in the playlist/queue
              handleNextTrack(true);
            }
          },
          onError: (e) => {
            setIsBuffering(false);
            // On error, auto-advance to next song
            setTimeout(() => {
              handleNextTrack(false);
            }, 1000);
          }
        }
      });
    } catch (err) {
      console.warn('Player init error:', err);
    }
  };

  // Time tracking loop
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
        }, 250);
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
        title: currentTrack.title || 'Track',
        artist: currentTrack.artist || 'Artist',
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
        console.warn('Playback error:', err);
      }
    } else {
      setTimeout(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          storageService.addToHistory(track);
        }
      }, 500);
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

  // Next Track - Automatically loops and plays next song
  const handleNextTrack = (isAutoEnded = false) => {
    const curQueue = queueRef.current;
    const curIdx = currentIndexRef.current;
    const curRepeat = repeatModeRef.current;
    const curShuffle = shuffleRef.current;

    if (curRepeat === 'one' && isAutoEnded) {
      seekTo(0);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
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
