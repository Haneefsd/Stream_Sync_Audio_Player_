import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { storageService } from '../services/storage';
import TrackRow from './TrackRow';
import {
  Heart,
  ListMusic,
  Play,
  Plus,
  Trash2,
  Music,
  Image,
  Upload,
  GripVertical,
  Clock
} from 'lucide-react';

export default function LibraryView({ onSelectPlaylist }) {
  const { playTrack, toggleShuffle, setActiveTab } = useAudioPlayer();
  const { requestConfirmation } = useConfirmation();
  const [favorites, setFavorites] = useState(storageService.getFavorites());
  const [playlists, setPlaylists] = useState(storageService.getPlaylists());
  const [history, setHistory] = useState(storageService.getHistory());
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'playlists' | 'recent'
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistCoverUrl, setNewPlaylistCoverUrl] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedPlaylistIndex, setDraggedPlaylistIndex] = useState(null);
  const [dragOverPlaylistIndex, setDragOverPlaylistIndex] = useState(null);

  useEffect(() => {
    const syncLibrary = () => {
      setFavorites(storageService.getFavorites());
      setPlaylists(storageService.getPlaylists());
      setHistory(storageService.getHistory());
    };
    syncLibrary();
    window.addEventListener('playlistsUpdated', syncLibrary);
    window.addEventListener('historyUpdated', syncLibrary);
    return () => {
      window.removeEventListener('playlistsUpdated', syncLibrary);
      window.removeEventListener('historyUpdated', syncLibrary);
    };
  }, []);

  const handleDragStartPlaylist = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedPlaylistIndex(index);
  };

  const handleDragOverPlaylist = (e, index) => {
    e.preventDefault();
    setDragOverPlaylistIndex(index);
  };

  const handleDropPlaylist = (e, dropIndex) => {
    e.preventDefault();
    setDragOverPlaylistIndex(null);
    if (draggedPlaylistIndex === null || draggedPlaylistIndex === dropIndex) return;
    storageService.movePlaylist(draggedPlaylistIndex, dropIndex);
    setPlaylists(storageService.getPlaylists());
    setDraggedPlaylistIndex(null);
  };

  const handlePlayAllFavorites = (e) => {
    if (e) e.stopPropagation();
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  const handlePlayPlaylist = (e, playlist) => {
    e.stopPropagation();
    if (playlist.tracks && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks, playlist.id);
    }
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    requestConfirmation({
      title: 'Create Playlist',
      message: `Are you sure you want to create a new playlist named "${newPlaylistName.trim()}"?`,
      confirmText: 'Create',
      cancelText: 'Cancel',
      actionType: 'create',
      onConfirm: () => {
        const created = storageService.createPlaylist(
          newPlaylistName.trim(),
          '',
          newPlaylistCoverUrl.trim()
        );
        setNewPlaylistName('');
        setNewPlaylistCoverUrl('');
        setShowCreateModal(false);
        if (onSelectPlaylist) onSelectPlaylist(created);
      }
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewPlaylistCoverUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePlaylist = (e, id, name) => {
    e.stopPropagation();
    requestConfirmation({
      title: 'Delete Playlist',
      message: `Are you sure you want to delete the playlist "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      actionType: 'delete',
      onConfirm: () => {
        storageService.deletePlaylist(id);
      }
    });
  };

  return (
    <div className="content-scrollable">
      {/* Library Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Your Library</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            All your playlists and saved liked songs in one place
          </span>
        </div>

        {/* Filter Pills & Create Playlist Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', padding: '3px', borderRadius: 'var(--radius-full)' }}>
            <button
              onClick={() => setActiveTabFilter('all')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: activeTabFilter === 'all' ? 700 : 500,
                background: activeTabFilter === 'all' ? 'var(--accent-emerald)' : 'transparent',
                color: activeTabFilter === 'all' ? '#000' : 'var(--text-secondary)'
              }}
            >
              All
            </button>
            <button
              onClick={() => setActiveTabFilter('playlists')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: activeTabFilter === 'playlists' ? 700 : 500,
                background: activeTabFilter === 'playlists' ? 'var(--accent-emerald)' : 'transparent',
                color: activeTabFilter === 'playlists' ? '#000' : 'var(--text-secondary)'
              }}
            >
              Playlists ({playlists.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('recent')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: activeTabFilter === 'recent' ? 700 : 500,
                background: activeTabFilter === 'recent' ? 'var(--accent-cyan)' : 'transparent',
                color: activeTabFilter === 'recent' ? '#000' : 'var(--text-secondary)'
              }}
            >
              Recently Played ({history.length})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-emerald)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            <Plus size={16} />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* 1. PLAYLISTS & LIKED SONGS GRID SECTION */}
      {(activeTabFilter === 'all' || activeTabFilter === 'playlists') && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Playlists & Collections
          </h2>

          <div className="library-grid">
            {/* LIKED SONGS VIBRANT HERO CARD (Electric Indigo / Violet Gradient) */}
            {(activeTabFilter === 'all' || activeTabFilter === 'liked') && (
              <div
                onClick={() => setActiveTab('favorites')}
                className="glass-panel"
                style={{
                  gridColumn: activeTabFilter === 'all' ? 'span 2' : 'span 1',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Heart size={26} fill="#fff" color="#fff" />
                  </div>

                  {favorites.length > 0 && (
                    <button
                      onClick={handlePlayAllFavorites}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#fff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                      }}
                      title="Play All Liked Songs"
                    >
                      <Play size={20} fill="#4f46e5" style={{ marginLeft: '2px' }} />
                    </button>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
                    Liked Songs
                  </h3>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>
                    {favorites.length} {favorites.length === 1 ? 'liked track' : 'liked tracks'}
                  </span>
                </div>
              </div>
            )}

            {/* CUSTOM USER PLAYLIST CARDS */}
            {playlists.map((pl, idx) => {
              const coverImage = storageService.getPlaylistCover(pl);
              const isDragOver = dragOverPlaylistIndex === idx;
              return (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist && onSelectPlaylist(pl)}
                  className="glass-panel"
                  draggable
                  onDragStart={(e) => handleDragStartPlaylist(e, idx)}
                  onDragOver={(e) => handleDragOverPlaylist(e, idx)}
                  onDragLeave={() => setDragOverPlaylistIndex(null)}
                  onDrop={(e) => handleDropPlaylist(e, idx)}
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    border: isDragOver ? '2px solid var(--accent-emerald)' : undefined,
                    background: isDragOver ? 'rgba(16, 185, 129, 0.12)' : undefined
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Top Control Overlay: Grip Handle + Move Up/Down + Delete */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      right: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 5
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleDeletePlaylist(e, pl.id, pl.name)}
                      style={{
                        padding: '6px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--text-muted)'
                      }}
                      title="Delete playlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    border: '1px solid var(--border-subtle)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={pl.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Music size={40} color="var(--accent-emerald)" />
                    )}

                    {pl.tracks && pl.tracks.length > 0 && (
                      <button
                        onClick={(e) => handlePlayPlaylist(e, pl)}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--accent-emerald)',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)'
                        }}
                        title="Play Playlist"
                      >
                        <Play size={18} fill="#000" style={{ marginLeft: '2px' }} />
                      </button>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pl.name}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {pl.tracks?.length || 0} tracks {pl.coverUrl ? '• Custom Photo' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. RECENTLY PLAYED SONGS LIST SECTION */}
      {(activeTabFilter === 'all' || activeTabFilter === 'recent') && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Recently Played Songs</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                ({history.length})
              </span>
            </div>

            {history.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => playTrack(history[0], history)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    cursor: 'pointer'
                  }}
                  title="Play Recently Played Songs"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Play Recent</span>
                </button>

                <button
                  onClick={() => {
                    requestConfirmation({
                      title: 'Clear History',
                      message: 'Are you sure you want to clear your recently played tracks? This cannot be undone.',
                      confirmText: 'Clear',
                      cancelText: 'Cancel',
                      actionType: 'delete',
                      onConfirm: () => {
                        storageService.clearHistory();
                        setHistory([]);
                      }
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.3rem 0.6rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  title="Clear Listening History"
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>

          {history.length > 0 ? (
            <div className="track-list glass-panel" style={{ padding: '0.75rem' }}>
              {history.slice(0, 20).map((track, i) => (
                <TrackRow key={`${track.id}_${i}`} track={track} index={i} trackList={history} />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={30} color="var(--accent-cyan)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '0.35rem' }}>No recently played songs yet.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Play any song to start building your personal listening history!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal with Custom Photo Support */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCreateModal(false)}
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
            style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>Create New Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Playlist Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Acoustic Chill, Late Night Vibes"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.92rem',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Playlist Photo (Optional - defaults to 1st song image)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={newPlaylistCoverUrl}
                    onChange={(e) => setNewPlaylistCoverUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.7rem 0.85rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      color: '#fff'
                    }}
                  />
                  <label style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--accent-emerald)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                    title="Upload from device"
                  >
                    <Upload size={16} />
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'transparent',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-emerald)',
                    color: '#000',
                    fontWeight: 700
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
