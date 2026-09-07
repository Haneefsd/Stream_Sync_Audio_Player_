import React, { useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import { formatTime } from '../utils/formatters';
import { Play, Pause, Heart, ListPlus, FolderPlus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

export default function TrackRow({
  track,
  index,
  trackList = null,
  playlistId = null,
  onRemove = null,
  onMoveUp = null,
  onMoveDown = null,
  isFirst = false,
  isLast = false,
  onDragStartRow = null,
  onDragOverRow = null,
  onDropRow = null
}) {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, openAddToPlaylist } = useAudioPlayer();
  const [isLiked, setIsLiked] = useState(storageService.isFavorite(track.id));
  const [isDragOver, setIsDragOver] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, trackList, playlistId);
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
  };

  const handleAddToPlaylist = (e) => {
    e.stopPropagation();
    if (openAddToPlaylist) openAddToPlaylist(track);
  };

  return (
    <div
      className={`track-row ${isCurrent ? 'is-active' : ''}`}
      onClick={handleRowClick}
      draggable={Boolean(onDropRow)}
      onDragStart={(e) => {
        if (onDragStartRow) onDragStartRow(e, index);
      }}
      onDragOver={(e) => {
        if (onDropRow) {
          e.preventDefault();
          setIsDragOver(true);
          if (onDragOverRow) onDragOverRow(e, index);
        }
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        if (onDropRow) {
          e.preventDefault();
          setIsDragOver(false);
          onDropRow(e, index);
        }
      }}
      style={{
        borderTop: isDragOver ? '2px solid var(--accent-emerald)' : undefined,
        background: isDragOver ? 'rgba(16, 185, 129, 0.12)' : undefined,
        transition: 'background 0.15s ease, border 0.15s ease'
      }}
    >
      {/* Index or Animated Equalizer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {isThisPlaying ? (
          <div className="sound-wave">
            <div className="sound-wave-bar"></div>
            <div className="sound-wave-bar"></div>
            <div className="sound-wave-bar"></div>
          </div>
        ) : (
          <span>{index !== undefined ? index + 1 : '•'}</span>
        )}
      </div>

      {/* Thumbnail */}
      <div style={{ width: '42px', height: '42px', borderRadius: '6px', overflow: 'hidden', background: '#1e2433', position: 'relative' }}>
        <img
          src={track.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=60'}
          alt={track.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>

      {/* Title & Artist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden', paddingRight: '1rem' }}>
        <span
          className="row-title"
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isCurrent ? 'var(--accent-emerald)' : 'var(--text-primary)'
          }}
        >
          {track.title}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {track.artist}
        </span>
      </div>

      {/* Album */}
      <div className="row-album" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {track.album || 'Single'}
      </div>
      
      {/* Duration & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <span className="row-duration-text">{formatTime(track.duration)}</span>

        {/* Move Up / Move Down buttons */}
        {(onMoveUp || onMoveDown) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
            {onMoveUp && (
              <button
                onClick={() => onMoveUp(index)}
                disabled={isFirst}
                style={{
                  color: isFirst ? 'rgba(255,255,255,0.15)' : 'var(--text-muted)',
                  padding: '2px',
                  cursor: isFirst ? 'default' : 'pointer'
                }}
                title="Move Up"
              >
                <ChevronUp size={15} />
              </button>
            )}
            {onMoveDown && (
              <button
                onClick={() => onMoveDown(index)}
                disabled={isLast}
                style={{
                  color: isLast ? 'rgba(255,255,255,0.15)' : 'var(--text-muted)',
                  padding: '2px',
                  cursor: isLast ? 'default' : 'pointer'
                }}
                title="Move Down"
              >
                <ChevronDown size={15} />
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleLikeToggle}
          style={{ color: isLiked ? 'var(--accent-indigo)' : 'var(--text-muted)', padding: '2px' }}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={15} fill={isLiked ? 'var(--accent-indigo)' : 'none'} />
        </button>

        <button
          onClick={handleAddToPlaylist}
          style={{ color: 'var(--text-muted)', padding: '2px' }}
          title="Add to Playlist"
        >
          <FolderPlus size={15} />
        </button>

        <button
          onClick={handleAddToQueue}
          style={{ color: 'var(--text-muted)', padding: '2px' }}
          title="Add to Queue"
        >
          <ListPlus size={15} />
        </button>

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(track.id);
            }}
            style={{ color: 'var(--text-muted)', padding: '2px' }}
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        )}

        {onDropRow && (
          <div
            title="Hold and drag to reorder"
            style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={15} />
          </div>
        )}
      </div>
    </div>
  );
}
