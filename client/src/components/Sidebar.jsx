import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { storageService } from '../services/storage';
import {
  Home,
  Search,
  Library,
  Heart,
  PlusSquare,
  Music,
  Radio,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function Sidebar({ onSelectPlaylist, selectedPlaylistId, isOpen, onClose }) {
  const {
    activeTab,
    setActiveTab,
    refreshPage
  } = useAudioPlayer();

  const { requestConfirmation } = useConfirmation();

  const [playlists, setPlaylists] = useState(storageService.getPlaylists());
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setPlaylists(storageService.getPlaylists());
    };
    window.addEventListener('playlistsUpdated', handleUpdate);
    return () => window.removeEventListener('playlistsUpdated', handleUpdate);
  }, []);

  const handleLogoClick = () => {
    setIsLogoSpinning(true);
    setTimeout(() => setIsLogoSpinning(false), 650);
    refreshPage();
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
        const created = storageService.createPlaylist(newPlaylistName.trim());
        setNewPlaylistName('');
        setShowNewPlaylistInput(false);
        if (onSelectPlaylist) onSelectPlaylist(created);
      }
    });
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

  const navItems = [
    { id: 'home', label: 'Home & Explore', icon: Home },
    { id: 'search', label: 'Search Music', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'favorites', label: 'Liked Songs', icon: Heart }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      {/* Brand / Logo (Clicking refreshes the page without stopping music) */}
      <div
        onClick={handleLogoClick}
        title="Refresh page (playback will not stop)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
          padding: '0.5rem',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--accent-emerald-glow)',
          transform: isLogoSpinning ? 'rotate(360deg)' : 'none',
          transition: isLogoSpinning ? 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          flexShrink: 0
        }}>
          <Radio size={22} color="#000" strokeWidth={2.5} />
        </div>
        <div className="sidebar-logo-text">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            StreamSync
          </h2>
          <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', fontWeight: 700, letterSpacing: '0.04em' }}>
            STATELESS AUDIO
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.75rem' }}>
        {navItems.map(item => {

          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth <= 768 && onClose) onClose();
              }}
              className="sidebar-nav-item"
              style={{
                background: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? (item.id === 'favorites' ? 'var(--accent-indigo)' : 'var(--accent-emerald)') : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} color={isActive ? (item.id === 'favorites' ? 'var(--accent-indigo)' : 'var(--accent-emerald)') : 'var(--text-secondary)'} />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Custom Playlists Section */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
          <span className="sidebar-section-header" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Playlists
          </span>
          <button
            onClick={() => setShowNewPlaylistInput(!showNewPlaylistInput)}
            title="Create Playlist"
            className="sidebar-add-btn"
            style={{ color: 'var(--text-secondary)', padding: '2px' }}
          >
            <PlusSquare size={17} />
          </button>
        </div>

        {showNewPlaylistInput && (
          <form onSubmit={handleCreatePlaylist} style={{ marginBottom: '0.85rem' }}>
            <input
              type="text"
              autoFocus
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--accent-emerald)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: '#fff'
              }}
            />
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {playlists.map(pl => {
            const coverImage = storageService.getPlaylistCover(pl);
            const isPlaylistActive = activeTab === 'playlist' && selectedPlaylistId === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(pl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: isPlaylistActive ? 'var(--bg-active)' : 'transparent',
                  color: isPlaylistActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontWeight: isPlaylistActive ? 600 : 500,
                  fontSize: '0.86rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isPlaylistActive) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isPlaylistActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                  {/* Playlist mini cover or music icon */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {coverImage ? (
                      <img src={coverImage} alt={pl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Music size={13} color="var(--text-muted)" />
                    )}
                  </div>

                  <span className="sidebar-label">
                    {pl.name}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeletePlaylist(e, pl.id, pl.name)}
                  className="sidebar-add-btn"
                  style={{ opacity: 0.4, padding: '2px' }}
                  title="Delete playlist"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
