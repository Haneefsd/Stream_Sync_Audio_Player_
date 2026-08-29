import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';

export default function AddToPlaylistModal({ track, onClose, onPlaylistUpdated }) {
  const [playlists, setPlaylists] = useState(storageService.getPlaylists());
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState({});

  if (!track) return null;

  const handleToggleTrack = (playlist) => {
    const isAlreadyIn = playlist.tracks.some(t => t.id === track.id);
    if (isAlreadyIn) {
      storageService.removeTrackFromPlaylist(playlist.id, track.id);
      setAddedPlaylists(prev => ({ ...prev, [playlist.id]: false }));
    } else {
      storageService.addTrackToPlaylist(playlist.id, track);
      setAddedPlaylists(prev => ({ ...prev, [playlist.id]: true }));
    }
    const updated = storageService.getPlaylists();
    setPlaylists(updated);
    if (onPlaylistUpdated) onPlaylistUpdated();
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newPl = storageService.createPlaylist(newPlaylistName.trim());
    storageService.addTrackToPlaylist(newPl.id, track);
    setNewPlaylistName('');
    setShowCreateInput(false);
    const updated = storageService.getPlaylists();
    setPlaylists(updated);
    setAddedPlaylists(prev => ({ ...prev, [newPl.id]: true }));
    if (onPlaylistUpdated) onPlaylistUpdated();
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div 
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ListMusic size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add to Playlist</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {track.title}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Create New Playlist Toggle */}
        {!showCreateInput ? (
          <button
            onClick={() => setShowCreateInput(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px dashed var(--border-strong)',
              color: 'var(--accent-emerald)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={18} />
            <span>New Playlist</span>
          </button>
        ) : (
          <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              autoFocus
              placeholder="Give your playlist a name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--accent-emerald)',
                fontSize: '0.88rem',
                color: '#fff'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-emerald)',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              Create
            </button>
          </form>
        )}

        {/* Playlist List */}
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {playlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No playlists found. Create one above!
            </div>
          ) : (
            playlists.map(pl => {
              const inPlaylist = pl.tracks.some(t => t.id === track.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => handleToggleTrack(pl)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    background: inPlaylist ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
                    border: inPlaylist ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!inPlaylist) e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!inPlaylist) e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Music size={16} color={inPlaylist ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: inPlaylist ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                        {pl.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: inPlaylist ? 'none' : '1px solid var(--border-strong)',
                    background: inPlaylist ? 'var(--accent-emerald)' : 'transparent',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {inPlaylist && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
