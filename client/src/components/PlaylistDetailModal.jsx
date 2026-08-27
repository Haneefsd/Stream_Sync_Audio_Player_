import React from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import TrackRow from './TrackRow';
import { X, Play, Trash2, Music } from 'lucide-react';

export default function PlaylistDetailModal({ playlist, onClose, onUpdate }) {
  const { playTrack } = useAudioPlayer();

  if (!playlist) return null;

  const handlePlayAll = () => {
    if (playlist.tracks?.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
      onClose();
    }
  };

  const handleRemoveTrack = (trackId) => {
    storageService.removeTrackFromPlaylist(playlist.id, trackId);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)'
            }}>
              <Music size={30} color="var(--accent-emerald)" />
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>PLAYLIST</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{playlist.name}</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {playlist.tracks?.length || 0} tracks • Created {new Date(playlist.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {playlist.tracks?.length > 0 && (
              <button
                onClick={handlePlayAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-emerald)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                <Play size={16} fill="#000" />
                <span>Play</span>
              </button>
            )}

            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          {playlist.tracks?.length > 0 ? (
            <div className="track-list">
              {playlist.tracks.map((track, i) => (
                <TrackRow
                  key={`${track.id}_${i}`}
                  track={track}
                  index={i}
                  trackList={playlist.tracks}
                  onRemove={handleRemoveTrack}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>
              No tracks in this playlist yet. Add tracks using the options menu on any track card!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
