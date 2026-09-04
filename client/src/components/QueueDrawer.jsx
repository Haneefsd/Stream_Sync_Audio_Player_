import React from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatTime } from '../utils/formatters';
import { X, Trash2, ListMusic } from 'lucide-react';

export default function QueueDrawer({ onClose }) {
  const { 
    queue, 
    currentIndex, 
    currentTrack, 
    playTrack, 
    removeFromQueue, 
    clearQueue 
  } = useAudioPlayer();

  const upNextList = currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '380px',
        maxWidth: '100vw',
        height: 'calc(100vh - var(--player-height))',
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        padding: '1.5rem',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
        animation: 'slideInRight 0.25s ease-out'
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Drawer Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ListMusic size={20} color="var(--accent-emerald)" />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Play Queue ({upNextList.length})</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {upNextList.length} {upNextList.length === 1 ? 'song' : 'songs'} to be played
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px'
              }}
              title="Clear Queue"
            >
              Clear
            </button>
          )}
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.25rem' }}>
        {/* Now Playing Block */}
        {currentTrack ? (
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Now Playing
            </span>
            <div 
              className="glass-panel"
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'var(--accent-emerald)'
              }}
            >
              <img 
                src={currentTrack.thumbnailUrl} 
                alt={currentTrack.title}
                style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-emerald)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.artist}
                </div>
              </div>
              <div className="sound-wave" style={{ height: '14px' }}>
                <div className="sound-wave-bar"></div>
                <div className="sound-wave-bar"></div>
                <div className="sound-wave-bar"></div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            No track currently playing
          </div>
        )}

        {/* Up Next List */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Up Next ({upNextList.length} to be played)
          </span>

          {upNextList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
              {upNextList.map((track, i) => {
                const actualIndex = currentIndex + 1 + i;
                return (
                  <div
                    key={`${track.id}_${actualIndex}`}
                    onClick={() => playTrack(track)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden', flex: 1 }}>
                      <img 
                        src={track.thumbnailUrl} 
                        alt={track.title}
                        style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {track.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {track.artist}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '0.75rem' }}>{formatTime(track.duration)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(actualIndex);
                        }}
                        style={{ padding: '4px' }}
                        title="Remove from queue"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '3rem 0' }}>
              Queue is empty. Add songs to play continuously!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
