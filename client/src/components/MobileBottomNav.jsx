import React, { useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { storageService } from '../services/storage';
import {
  Home,
  Search,
  Library,
  Heart,
  Plus,
  X
} from 'lucide-react';

export default function MobileBottomNav({ onSelectPlaylist }) {
  const {
    activeTab,
    setActiveTab,
    refreshPage,
    setIsFullscreenPlayerOpen
  } = useAudioPlayer();

  const { requestConfirmation } = useConfirmation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

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
        setShowCreateModal(false);
        if (onSelectPlaylist) onSelectPlaylist(created);
      }
    });
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onClick: () => {
        if (setIsFullscreenPlayerOpen) setIsFullscreenPlayerOpen(false);
        if (activeTab === 'home') {
          refreshPage();
        } else {
          setActiveTab('home');
        }
      }
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      onClick: () => {
        if (setIsFullscreenPlayerOpen) setIsFullscreenPlayerOpen(false);
        setActiveTab('search');
      }
    },
    {
      id: 'library',
      label: 'Your Library',
      icon: Library,
      onClick: () => {
        if (setIsFullscreenPlayerOpen) setIsFullscreenPlayerOpen(false);
        setActiveTab('library');
      }
    },
    {
      id: 'favorites',
      label: 'Liked Songs',
      icon: Heart,
      onClick: () => {
        if (setIsFullscreenPlayerOpen) setIsFullscreenPlayerOpen(false);
        setActiveTab('favorites');
      }
    },
    {
      id: 'create',
      label: 'Create',
      icon: Plus,
      onClick: () => {
        if (setIsFullscreenPlayerOpen) setIsFullscreenPlayerOpen(false);
        setShowCreateModal(true);
      }
    }
  ];

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isFav = item.id === 'favorites' && isActive;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`mobile-bottom-nav-item ${isActive ? 'is-active' : ''} ${isFav ? 'is-favorites' : ''}`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon
                size={22}
                strokeWidth={isActive || item.id === 'create' ? 2.5 : 2}
                color={isActive ? (isFav ? 'var(--accent-indigo)' : '#ffffff') : 'currentColor'}
                fill={isActive && (item.id === 'home' || item.id === 'favorites') ? (isFav ? 'var(--accent-indigo)' : '#ffffff') : 'none'}
              />
              <span className="mobile-bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Create Playlist Modal for Mobile */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 750,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '1.75rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New Playlist</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', fontWeight: 600 }}>
                  Playlist Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Late Night Vibes"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-emerald)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    opacity: !newPlaylistName.trim() ? 0.5 : 1,
                    cursor: !newPlaylistName.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
