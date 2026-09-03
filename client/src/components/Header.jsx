import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Search, X, ListMusic, Menu } from 'lucide-react';

export default function Header({ searchQuery, onSearchChange, onMobileMenuToggle }) {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
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

  return (
    <header className="header-container" style={{
      height: 'var(--header-height)',
      padding: '0 1rem', // Adjust for mobile, will be overriden by content-scrollable but header needs its own
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      background: 'rgba(7, 9, 14, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* Search Input Bar & Mobile Menu Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '680px' }}>
        <button 
          className="mobile-menu-toggle"
          onClick={onMobileMenuToggle}
          title="Open Menu"
        >
          <Menu size={24} />
        </button>
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
            placeholder="Search songs or artists..."
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
      </div>

      {/* Right Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
