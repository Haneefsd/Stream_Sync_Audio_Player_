import React, { useState, useRef } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import { formatTime, getSourceBadge } from '../utils/formatters';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Heart, 
  Maximize2, 
  ListMusic, 
  Activity,
  Youtube
} from 'lucide-react';

export default function PlayerBar() {
  const { 
    currentTrack, 
    isPlaying, 
    isBuffering, 
    currentTime, 
    duration, 
    volume, 
    isMuted, 
    repeatMode, 
    shuffle, 
    isQueueOpen,
    togglePlay, 
    handleNextTrack, 
    handlePrevTrack, 
    seekTo, 
    changeVolume, 
    toggleMute, 
    toggleRepeatMode, 
    toggleShuffle, 
    setIsFullscreenPlayerOpen, 
    setIsQueueOpen 
  } = useAudioPlayer();

  const [isLiked, setIsLiked] = useState(false);
  const seekSliderRef = useRef(null);

  // Sync like state
  React.useEffect(() => {
    if (currentTrack) {
      setIsLiked(storageService.isFavorite(currentTrack.id));
    }
  }, [currentTrack]);

  const handleLikeToggle = (e) => {
    e.stopPropagation();
    if (!currentTrack) return;
    storageService.toggleFavorite(currentTrack);
    setIsLiked(!isLiked);
  };

  const handleSeekClick = (e) => {
    if (!seekSliderRef.current || !duration) return;
    const rect = seekSliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(pct * duration);
  };

  if (!currentTrack) {
    return (
      <div className="player-bar" style={{ opacity: 0.6, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-elevated)' }}></div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Select a YouTube song to start streaming</div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const badge = getSourceBadge(currentTrack.source);

  return (
    <div className="player-bar">
      {/* 1. Left Track Metadata Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden' }}>
        {/* Clickable Cover Art to Open Fullscreen */}
        <div 
          onClick={() => setIsFullscreenPlayerOpen(true)}
          style={{
            position: 'relative',
            width: '54px',
            height: '54px',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
          title="Click for Fullscreen Visualizer & Lyrics"
        >
          <img 
            src={currentTrack.thumbnailUrl} 
            alt={currentTrack.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.35)',
            opacity: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
          >
            <Maximize2 size={16} color="#fff" />
          </div>
        </div>

        {/* Track Title and Artist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span 
              onClick={() => setIsFullscreenPlayerOpen(true)}
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer'
              }}
            >
              {currentTrack.title}
            </span>
            <span className={`card-source-badge ${badge.className}`} style={{ position: 'static', padding: '0.15rem 0.4rem', fontSize: '0.58rem' }}>
              {badge.label}
            </span>
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack.artist}
          </span>
        </div>

        {/* Favorite Heart */}
        <button
          onClick={handleLikeToggle}
          style={{ color: isLiked ? 'var(--accent-indigo)' : 'var(--text-muted)', padding: '6px', marginLeft: '0.25rem' }}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={18} fill={isLiked ? 'var(--accent-indigo)' : 'none'} />
        </button>
      </div>

      {/* 2. Center Audio Controls & Seek Bar */}
      <div className="player-bar-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        {/* Buttons Control Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            style={{ color: shuffle ? 'var(--accent-emerald)' : 'var(--text-muted)', transition: 'color 0.15s ease' }}
            title={`Shuffle ${shuffle ? 'On' : 'Off'}`}
          >
            <Shuffle size={17} />
          </button>

          {/* Previous Track */}
          <button
            onClick={handlePrevTrack}
            style={{ color: 'var(--text-primary)', transition: 'transform 0.15s ease' }}
            title="Previous Track"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          {/* Large Play/Pause Button */}
          <button
            onClick={togglePlay}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              color: 'var(--text-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--accent-emerald-glow)',
              transition: 'transform 0.15s ease'
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <div className="sound-wave" style={{ height: '12px' }}>
                <div className="sound-wave-bar" style={{ background: '#000' }}></div>
                <div className="sound-wave-bar" style={{ background: '#000' }}></div>
              </div>
            ) : isPlaying ? (
              <Pause size={20} fill="#000" />
            ) : (
              <Play size={20} fill="#000" style={{ marginLeft: '2px' }} />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={() => handleNextTrack(false)}
            style={{ color: 'var(--text-primary)', transition: 'transform 0.15s ease' }}
            title="Next Track"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={toggleRepeatMode}
            style={{ color: repeatMode !== 'off' ? 'var(--accent-emerald)' : 'var(--text-muted)', transition: 'color 0.15s ease' }}
            title={`Repeat Mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Seek Track Bar */}
        <div className="seek-track-wrapper">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '35px', textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>

          <div 
            ref={seekSliderRef}
            className="slider-container"
            onClick={handleSeekClick}
          >
            <div className="slider-progress" style={{ width: `${progressPercent}%` }}></div>
            <div className="slider-thumb" style={{ left: `${progressPercent}%` }}></div>
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '35px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right Volume & Tools Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.85rem' }}>
        {/* Lyrics & Visualizer Fullscreen Trigger */}
        <button
          onClick={() => setIsFullscreenPlayerOpen(true)}
          style={{ color: 'var(--text-secondary)', padding: '6px' }}
          title="Fullscreen Visualizer & Lyrics"
        >
          <Activity size={18} />
        </button>

        {/* Volume Slider & Mute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={toggleMute} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            style={{
              width: '80px',
              accentColor: 'var(--accent-emerald)',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Queue Drawer Toggle */}
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          style={{
            color: isQueueOpen ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            padding: '6px'
          }}
          title="Queue"
        >
          <ListMusic size={19} />
        </button>
      </div>
    </div>
  );
}
