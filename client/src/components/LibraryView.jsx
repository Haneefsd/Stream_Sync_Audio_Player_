import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import TrackRow from './TrackRow';
import { 
  Heart, 
  ListMusic, 
  Play, 
  Plus, 
  Trash2, 
  Music, 
  FolderPlus,
  Shuffle
} from 'lucide-react';

export default function LibraryView({ onSelectPlaylist }) {
  const { playTrack, toggleShuffle, setActiveTab } = useAudioPlayer();
  const [favorites, setFavorites] = useState(storageService.getFavorites());
  const [playlists, setPlaylists] = useState(storageService.getPlaylists());
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'playlists' | 'liked'
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setFavorites(storageService.getFavorites());
    setPlaylists(storageService.getPlaylists());
  }, []);

  const handlePlayAllFavorites = (e) => {
    if (e) e.stopPropagation();
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  const handlePlayPlaylist = (e, playlist) => {
    e.stopPropagation();
    if (playlist.tracks && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = storageService.createPlaylist(newPlaylistName.trim());
    setPlaylists(storageService.getPlaylists());
    setNewPlaylistName('');
    setShowCreateModal(false);
    if (onSelectPlaylist) onSelectPlaylist(created);
  };

  const handleDeletePlaylist = (e, id) => {
    e.stopPropagation();
    const updated = storageService.deletePlaylist(id);
    setPlaylists(updated);
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
              onClick={() => setActiveTabFilter('liked')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: activeTabFilter === 'liked' ? 700 : 500,
                background: activeTabFilter === 'liked' ? 'var(--accent-pink)' : 'transparent',
                color: activeTabFilter === 'liked' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Liked ({favorites.length})
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.5rem' }}>
            {/* LIKED SONGS HERO CARD */}
            {(activeTabFilter === 'all' || activeTabFilter === 'liked') && (
              <div
                onClick={() => setActiveTab('favorites')}
                className="glass-panel"
                style={{
                  gridColumn: activeTabFilter === 'all' ? 'span 2' : 'span 1',
                  background: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)',
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
                        color: '#be185d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                      }}
                      title="Play All Liked Songs"
                    >
                      <Play size={20} fill="#be185d" style={{ marginLeft: '2px' }} />
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
            {playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(pl)}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
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
                  position: 'relative'
                }}>
                  <Music size={40} color="var(--accent-emerald)" />
                  
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

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>{pl.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {pl.tracks?.length || 0} tracks
                </span>

                <button
                  onClick={(e) => handleDeletePlaylist(e, pl.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: 'var(--text-muted)'
                  }}
                  title="Delete playlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LIKED SONGS LIST PREVIEW SECTION */}
      {(activeTabFilter === 'all' || activeTabFilter === 'liked') && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Heart size={20} color="var(--accent-pink)" fill="var(--accent-pink)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Liked Songs List</h2>
            </div>

            {favorites.length > 0 && (
              <button
                onClick={() => setActiveTab('favorites')}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--accent-pink)',
                  cursor: 'pointer'
                }}
              >
                View Full Liked Panel →
              </button>
            )}
          </div>

          {favorites.length > 0 ? (
            <div className="track-list glass-panel" style={{ padding: '0.75rem' }}>
              {favorites.slice(0, 10).map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} trackList={favorites} />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Heart size={30} color="var(--accent-pink)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.9rem' }}>No liked songs saved yet. Click the heart icon on any song to save it!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
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
            style={{ width: '100%', maxWidth: '420px', padding: '2rem', background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>Create New Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                autoFocus
                placeholder="Playlist name (e.g. Late Night Hits)"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  color: '#fff',
                  marginBottom: '1.5rem'
                }}
              />
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
