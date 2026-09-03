import React, { useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import { formatTime } from '../utils/formatters';
import { Play, Pause, Heart, ListPlus, FolderPlus, Trash2 } from 'lucide-react';

export default function TrackRow({ track, index, trackList = null, onRemove = null }) {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue, openAddToPlaylist } = useAudioPlayer();
  const [isLiked, setIsLiked] = useState(storageService.isFavorite(track.id));

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handleRowClick = () => {
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
  };

  const handleAddToPlaylist = (e) => {
    e.stopPropagation();
    if (openAddToPlaylist) openAddToPlaylist(track);
  };

  return (
    <div
      className={`track-row ${isCurrent ? 'is-active' : ''}`}
      onClick={handleRowClick}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <span className="row-duration-text">{formatTime(track.duration)}</span>

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
      </div>
    </div>
  );
}
