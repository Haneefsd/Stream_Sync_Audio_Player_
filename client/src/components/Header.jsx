import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Search, X, ListMusic, Radio } from 'lucide-react';

export default function Header({ searchQuery, onSearchChange }) {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    currentIndex,
    setActiveTab,
    refreshPage
  } = useAudioPlayer();

  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);

  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  const handleLogoClick = () => {
    setIsLogoSpinning(true);
    setTimeout(() => setIsLogoSpinning(false), 650);
    refreshPage();
  };

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
      padding: '0 1.25rem',
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
      {/* Mobile Brand Logo & Name (Visible only on mobile in place of the search bar) */}
      <div 
        className="header-brand-mobile"
        onClick={handleLogoClick}
        title="Refresh home (playback continues)"
        style={{
          alignItems: 'center',
          gap: '0.7rem',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '9px',
          background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--accent-emerald-glow)',
          transform: isLogoSpinning ? 'rotate(360deg)' : 'none',
          transition: isLogoSpinning ? 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          flexShrink: 0
        }}>
          <Radio size={20} color="#000" strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15
          }}>
            StreamSync
          </h2>
          <span style={{ fontSize: '0.62rem', color: 'var(--accent-emerald)', fontWeight: 700, letterSpacing: '0.04em' }}>
            STATELESS AUDIO
          </span>
        </div>
      </div>

      {/* Desktop Search Input Bar (Visible on desktop/tablet, hidden on mobile) */}
      <div className="header-search-bar" style={{ alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '680px' }}>
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
          {(() => {
            const songsToBePlayed = currentIndex >= 0 ? Math.max(0, queue.length - 1 - currentIndex) : queue.length;
            if (songsToBePlayed <= 0) return null;
            return (
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
                {songsToBePlayed}
              </span>
            );
          })()}
        </button>
      </div>
    </header>
  );
}
