import React, { useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import { 
  Home, 
  Search, 
  Library, 
  Heart, 
  PlusSquare, 
  Music, 
  Radio, 
  Layers, 
  Settings, 
  Sparkles,
  Zap,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function Sidebar({ onSelectPlaylist }) {
  const { 
    activeTab, 
    setActiveTab, 
    setIsSpotifyModalOpen, 
    audioQuality, 
    setAudioQuality 
  } = useAudioPlayer();

  const [playlists, setPlaylists] = useState(storageService.getPlaylists());
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = storageService.createPlaylist(newPlaylistName.trim());
    setPlaylists(storageService.getPlaylists());
    setNewPlaylistName('');
    setShowNewPlaylistInput(false);
    if (onSelectPlaylist) onSelectPlaylist(created);
  };

  const handleDeletePlaylist = (e, id) => {
    e.stopPropagation();
    const updated = storageService.deletePlaylist(id);
    setPlaylists(updated);
  };

  const navItems = [
    { id: 'home', label: 'Home & Explore', icon: Home },
    { id: 'search', label: 'Search Music', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'favorites', label: 'Liked Songs', icon: Heart }
  ];

  return (
    <aside style={{
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - var(--player-height))',
      padding: '1.5rem 1.25rem',
      userSelect: 'none',
      zIndex: 10
    }}>
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--accent-emerald-glow)'
        }}>
          <Radio size={22} color="#000" strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            StreamSync
          </h2>
          <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', fontWeight: 600, letterSpacing: '0.04em' }}>
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
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.92rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={20} color={isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spotify Resolver Quick Button */}
      <div style={{ marginBottom: '1.75rem' }}>
        <button
          onClick={() => setIsSpotifyModalOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(29, 185, 84, 0.05) 100%)',
            border: '1px solid rgba(29, 185, 84, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#1db954',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={18} />
            <span>Import Spotify</span>
          </div>
          <span style={{ fontSize: '0.65rem', background: '#1db954', color: '#000', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
            AUTO
          </span>
        </button>
      </div>

      {/* Custom Playlists Section */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Playlists
          </span>
          <button
            onClick={() => setShowNewPlaylistInput(!showNewPlaylistInput)}
            title="Create Playlist"
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
          {playlists.map(pl => (
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
                color: 'var(--text-secondary)',
                fontSize: '0.86rem',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                <Music size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pl.name}
                </span>
              </div>
              <button
                onClick={(e) => handleDeletePlaylist(e, pl.id)}
                style={{ opacity: 0.4, padding: '2px' }}
                title="Delete playlist"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Audio Quality & Zero DB Indicator */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={13} color="var(--accent-emerald)" /> Stream Quality
          </span>
          <select
            value={audioQuality}
            onChange={(e) => setAudioQuality(e.target.value)}
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--accent-emerald)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '0.2rem 0.4rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="320kbps">320k Ultra</option>
            <option value="160kbps">160k Normal</option>
            <option value="96kbps">96k Data Saver</option>
          </select>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.4rem 0.6rem',
          borderRadius: 'var(--radius-sm)'
        }}>
          <CheckCircle2 size={13} color="var(--accent-emerald)" />
          <span>Zero Database • Pure Client</span>
        </div>
      </div>
    </aside>
  );
}
