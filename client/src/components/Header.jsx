import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Search, X, ListMusic, Sparkles, Filter } from 'lucide-react';

export default function Header({ searchQuery, onSearchChange, searchSource, onSourceChange }) {
  const { 
    isQueueOpen, 
    setIsQueueOpen, 
    queue, 
    setIsSpotifyModalOpen,
    setActiveTab 
  } = useAudioPlayer();

  const [localQuery, setLocalQuery] = useState(searchQuery || '');

  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && localQuery.trim()) {
      setActiveTab('search');
    }
  };

  const sources = [
    { id: 'all', label: 'All Sources' },
    { id: 'jiosaavn', label: 'JioSaavn 320k' },
    { id: 'youtube', label: 'YouTube Music' }
  ];

  return (
    <header style={{
      height: 'var(--header-height)',
      padding: '0 2.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      background: 'rgba(7, 9, 14, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* Search Input Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '680px' }}>
        <div style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '0.65rem 1.15rem',
          transition: 'all 0.2s ease',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)'
        }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search songs, artists, albums, or paste YouTube/Spotify link..."
            value={localQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setActiveTab('search')}
            style={{
              width: '100%',
              fontSize: '0.92rem',
              color: 'var(--text-primary)'
            }}
          />
          {localQuery && (
            <button onClick={handleClear} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Source Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {sources.map(s => {
            const isSelected = searchSource === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSourceChange && onSourceChange(s.id)}
                className={`glass-pill ${isSelected ? 'active' : ''}`}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Spotify Modal Trigger */}
        <button
          onClick={() => setIsSpotifyModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(29, 185, 84, 0.12)',
            border: '1px solid rgba(29, 185, 84, 0.3)',
            color: '#1db954',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <Sparkles size={15} />
          <span>Resolve Link</span>
        </button>

        {/* Queue Drawer Trigger */}
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-full)',
            background: isQueueOpen ? 'var(--accent-emerald)' : 'var(--bg-elevated)',
            color: isQueueOpen ? 'var(--text-inverse)' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            transition: 'all 0.2s ease'
          }}
          title="Playback Queue"
        >
          <ListMusic size={19} />
          {queue.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'var(--accent-cyan)',
              color: '#000',
              fontSize: '0.65rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-main)'
            }}>
              {queue.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
