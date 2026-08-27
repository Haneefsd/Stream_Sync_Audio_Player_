import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import TrackRow from './TrackRow';
import TrackCard from './TrackCard';
import { 
  Heart, 
  ListMusic, 
  History, 
  Play, 
  Plus, 
  Trash2, 
  Music, 
  Sparkles,
  Shuffle
} from 'lucide-react';

export default function LibraryView({ onSelectPlaylist, defaultSection = 'liked' }) {
  const { playTrack, toggleShuffle } = useAudioPlayer();
  const [section, setSection] = useState(defaultSection); // 'liked' | 'playlists' | 'history'
  const [favorites, setFavorites] = useState(storageService.getFavorites());
  const [playlists, setPlaylists] = useState(storageService.getPlaylists());
  const [history, setHistory] = useState(storageService.getHistory());
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setFavorites(storageService.getFavorites());
    setPlaylists(storageService.getPlaylists());
    setHistory(storageService.getHistory());
  }, [section]);

  const handlePlayAllFavorites = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  const handleShuffleFavorites = () => {
    if (favorites.length > 0) {
      const randomIndex = Math.floor(Math.random() * favorites.length);
      playTrack(favorites[randomIndex], favorites);
      toggleShuffle();
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

  const handleDeletePlaylist = (id) => {
    const updated = storageService.deletePlaylist(id);
    setPlaylists(updated);
  };

  const handleClearHistory = () => {
    storageService.clearHistory();
    setHistory([]);
  };

  return (
    <div className="content-scrollable">
      {/* Library Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Your Library</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Stored locally on your device with zero cloud databases
          </span>
        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
          <button
            onClick={() => setSection('liked')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: section === 'liked' ? 700 : 500,
              background: section === 'liked' ? 'var(--accent-pink)' : 'transparent',
              color: section === 'liked' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Heart size={15} fill={section === 'liked' ? '#fff' : 'none'} />
            <span>Liked Songs ({favorites.length})</span>
          </button>

          <button
            onClick={() => setSection('playlists')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: section === 'playlists' ? 700 : 500,
              background: section === 'playlists' ? 'var(--accent-emerald)' : 'transparent',
              color: section === 'playlists' ? '#000' : 'var(--text-secondary)'
            }}
          >
            <ListMusic size={15} />
            <span>Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setSection('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: section === 'history' ? 700 : 500,
              background: section === 'history' ? 'var(--accent-cyan)' : 'transparent',
              color: section === 'history' ? '#000' : 'var(--text-secondary)'
            }}
          >
            <History size={15} />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: LIKED SONGS */}
      {section === 'liked' && (
        <div>
          {favorites.length > 0 ? (
            <div>
              {/* Liked Header Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={handlePlayAllFavorites}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-pink)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  <Play size={18} fill="#fff" />
                  <span>Play All</span>
                </button>

                <button
                  onClick={handleShuffleFavorites}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  <Shuffle size={16} />
                  <span>Shuffle</span>
                </button>
              </div>

              {/* Favorites Track List */}
              <div className="track-list glass-panel" style={{ padding: '0.75rem' }}>
                {favorites.map((track, i) => (
                  <TrackRow key={track.id} track={track} index={i} trackList={favorites} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Heart size={32} color="var(--accent-pink)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Liked Songs Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Click the heart icon on any song to save it to your local favorites.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PLAYLISTS */}
      {section === 'playlists' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Custom client-side playlists
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-emerald)',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <Plus size={16} />
              <span>Create Playlist</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(pl)}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
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
                  border: '1px solid var(--border-subtle)'
                }}>
                  <Music size={40} color="var(--accent-emerald)" />
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>{pl.name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {pl.tracks?.length || 0} tracks
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlaylist(pl.id);
                  }}
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

      {/* SECTION 3: LISTENING HISTORY */}
      {section === 'history' && (
        <div>
          {history.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Recently streamed tracks ({history.length})
                </span>
                <button
                  onClick={handleClearHistory}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    color: '#ef4444'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Clear History</span>
                </button>
              </div>

              <div className="track-list glass-panel" style={{ padding: '0.75rem' }}>
                {history.map((track, i) => (
                  <TrackRow key={`${track.id}_${i}`} track={track} index={i} trackList={history} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <History size={32} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Play History Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Play any song to start tracking your recent listening history.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
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
                placeholder="Playlist name (e.g. Late Night Vibes)"
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
