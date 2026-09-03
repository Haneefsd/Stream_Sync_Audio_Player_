import React, { useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import { formatTime } from '../utils/formatters';
import { Play, Pause, Heart, MoreVertical, ListPlus, FolderPlus } from 'lucide-react';

export default function TrackCard({ track, trackList = null }) {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, openAddToPlaylist } = useAudioPlayer();
  const [isLiked, setIsLiked] = useState(storageService.isFavorite(track.id));
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, trackList);
    }
  };

  const handleLikeToggle = (e) => {
    e.stopPropagation();
    storageService.toggleFavorite(track);
    setIsLiked(!isLiked);
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(track);
    setShowMenu(false);
  };

  const handleOpenPlaylistModal = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (openAddToPlaylist) openAddToPlaylist(track);
  };

  return (
    <div
      className="track-card"
      onClick={() => isCurrent ? togglePlay() : playTrack(track, trackList)}
      style={{ cursor: 'pointer' }}
    >
      {/* Cover Art Container */}
      <div className="card-cover-wrapper">
        <img
          src={track.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60'}
          alt={track.title}
          className="card-cover-img"
          loading="lazy"
        />

        {/* Floating Play/Pause Button */}
        <button
          onClick={handlePlayClick}
          className="card-play-overlay"
          style={isCurrent ? { opacity: 1, transform: 'translateY(0)' } : {}}
          title={isThisPlaying ? 'Pause' : 'Play'}
        >
          {isThisPlaying ? <Pause size={20} fill="#000" /> : <Play size={20} fill="#000" style={{ marginLeft: '2px' }} />}
        </button>
      </div>

      {/* Track Metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <h4 style={{
          fontSize: '0.92rem',
          fontWeight: 600,
          color: isCurrent ? 'var(--accent-emerald)' : 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {track.title}
        </h4>

        <span style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {track.artist}
        </span>
      </div>

      {/* Card Actions Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.75rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.72rem',
        color: 'var(--text-muted)'
      }}>
        <span>{formatTime(track.duration)}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
          <button
            onClick={handleLikeToggle}
            style={{ color: isLiked ? 'var(--accent-indigo)' : 'var(--text-muted)', padding: '2px' }}
            title={isLiked ? 'Unlike' : 'Like song'}
          >
            <Heart size={15} fill={isLiked ? 'var(--accent-indigo)' : 'none'} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            style={{ color: 'var(--text-muted)', padding: '2px' }}
            title="Options"
          >
            <MoreVertical size={15} />
          </button>

          {/* Context Menu */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '0.5rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem',
                minWidth: '150px',
                zIndex: 30,
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleOpenPlaylistModal}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <FolderPlus size={14} color="var(--accent-emerald)" /> Add to Playlist
              </button>

              <button
                onClick={handleAddToQueue}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ListPlus size={14} /> Add to Queue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
