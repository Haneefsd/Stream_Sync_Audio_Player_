import React, { useState, useRef } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import { formatTime } from '../utils/formatters';
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
  Activity
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
    isFullscreenPlayerOpen,
    setIsFullscreenPlayerOpen,
    setIsQueueOpen
  } = useAudioPlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
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

  const getTargetTimeFromEvent = (e) => {
    if (!seekSliderRef.current || !duration) return 0;
    const rect = seekSliderRef.current.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    return pct * duration;
  };

  const handleSeekClick = (e) => {
    const target = getTargetTimeFromEvent(e);
    seekTo(target);
  };

  const handleSeekStart = (e) => {
    if (!duration) return;
    setIsDragging(true);
    const target = getTargetTimeFromEvent(e);
    setDragTime(target);
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const target = getTargetTimeFromEvent(e);
      setDragTime(target);
    };

    const handleEnd = (e) => {
      setIsDragging(false);
      const target = getTargetTimeFromEvent(e);
      seekTo(target);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, duration, seekTo]);

  if (!currentTrack) {
    return null;
  }

  const handleBarClick = () => {
    setIsFullscreenPlayerOpen(true);
  };

  const displayTime = isDragging ? dragTime : currentTime;
  const displayPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div
      className={`player-bar ${isFullscreenPlayerOpen ? 'is-fullscreen-open' : ''}`}
      onClick={handleBarClick}
      style={{ cursor: 'pointer' }}
    >
      {/* 1. Left Track Metadata Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden' }}>
        {/* Clickable Cover Art */}
        <div
          className="player-bar-thumb"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreenPlayerOpen(prev => !prev);
          }}
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
          title={isFullscreenPlayerOpen ? "Minimize Visualizer" : "Click for Fullscreen Visualizer & Lyrics"}
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
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreenPlayerOpen(prev => !prev);
              }}
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer'
              }}
              title={isFullscreenPlayerOpen ? "Minimize Visualizer" : "Expand Visualizer"}
            >
              {currentTrack.title}
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

      {/* Mobile Controls (Visible only on < 768px) */}
      <div className="player-bar-mobile-controls" style={{ alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevTrack();
          }}
          style={{ color: 'var(--text-primary)' }}
        >
          <SkipBack size={22} fill="currentColor" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          style={{ color: 'var(--text-primary)' }}
        >
          {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextTrack(false);
          }}
          style={{ color: 'var(--text-primary)' }}
        >
          <SkipForward size={22} fill="currentColor" />
        </button>
      </div>

      {/* 2. Center Audio Controls & Seek Bar */}
      <div className="player-bar-center" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        {/* Buttons Control Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Shuffle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleShuffle();
            }}
            style={{ color: shuffle ? 'var(--accent-emerald)' : 'var(--text-muted)', transition: 'color 0.15s ease' }}
            title={`Shuffle ${shuffle ? 'On' : 'Off'}`}
          >
            <Shuffle size={17} />
          </button>

          {/* Previous Track */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevTrack();
            }}
            style={{ color: 'var(--text-primary)', transition: 'transform 0.15s ease' }}
            title="Previous Track"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          {/* Large Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              handleNextTrack(false);
            }}
            style={{ color: 'var(--text-primary)', transition: 'transform 0.15s ease' }}
            title="Next Track"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRepeatMode();
            }}
            style={{ color: repeatMode !== 'off' ? 'var(--accent-emerald)' : 'var(--text-muted)', transition: 'color 0.15s ease' }}
            title={`Repeat Mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Seek Track Bar */}
        {(() => {
          const displayTime = isDragging ? dragTime : currentTime;
          const displayPercent = duration > 0 ? (displayTime / duration) * 100 : 0;
          return (
            <div className="seek-track-wrapper" onClick={(e) => e.stopPropagation()}>
              <span style={{ fontSize: '0.72rem', color: isDragging ? 'var(--accent-emerald)' : 'var(--text-muted)', width: '35px', textAlign: 'right', fontWeight: isDragging ? 700 : 400 }}>
                {formatTime(displayTime)}
              </span>

              <div
                ref={seekSliderRef}
                className="slider-container"
                onClick={handleSeekClick}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                style={{ cursor: 'pointer' }}
              >
                <div className="slider-progress" style={{ width: `${displayPercent}%` }}></div>
                <div 
                  className="slider-thumb" 
                  style={{ 
                    left: `${displayPercent}%`,
                    transform: isDragging ? 'translate(-50%, -50%) scale(1.3)' : undefined,
                    background: isDragging ? 'var(--accent-emerald)' : undefined,
                    boxShadow: isDragging ? '0 0 10px var(--accent-emerald-glow)' : undefined
                  }}
                ></div>
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '35px' }}>
                {formatTime(duration)}
              </span>
            </div>
          );
        })()}
      </div>

      {/* 3. Right Volume & Tools Section */}
      <div className="player-bar-right" style={{ alignItems: 'center', justifyContent: 'flex-end', gap: '0.85rem' }}>
        {/* Lyrics & Visualizer Fullscreen Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreenPlayerOpen(true);
          }}
          style={{ color: 'var(--text-secondary)', padding: '6px' }}
          title="Fullscreen Visualizer & Lyrics"
        >
          <Activity size={18} />
        </button>

        {/* Volume Slider & Mute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
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
          onClick={(e) => {
            e.stopPropagation();
            setIsQueueOpen(!isQueueOpen);
          }}
          style={{
            color: isQueueOpen ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            padding: '6px'
          }}
          title="Queue"
        >
          <ListMusic size={19} />
        </button>
      </div>

      {/* 4. Mobile Bottom Real-Time Progress Line */}
      <div className="player-bar-mobile-progress">
        <div
          className="player-bar-mobile-progress-fill"
          style={{ width: `${displayPercent}%` }}
        />
      </div>
    </div>
  );
}
