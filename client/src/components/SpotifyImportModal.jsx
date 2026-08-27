import React, { useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { formatTime } from '../utils/formatters';
import { 
  Sparkles, 
  X, 
  Play, 
  Plus, 
  ListPlus, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Music
} from 'lucide-react';

export default function SpotifyImportModal({ onClose }) {
  const { playTrack, addToQueue } = useAudioPlayer();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedData, setResolvedData] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const sampleLinks = [
    { label: 'Sample Track', url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT' },
    { label: 'Sample Top 50 Playlist', url: 'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF' }
  ];

  const handleResolve = async (linkToUse = null) => {
    const targetUrl = (linkToUse || url).trim();
    if (!targetUrl) return;

    setIsLoading(true);
    setError(null);
    setResolvedData(null);
    setSavedSuccess(false);

    try {
      const data = await apiService.resolveSpotify(targetUrl);
      setResolvedData(data);
    } catch (err) {
      setError(err.message || 'Could not resolve Spotify metadata. Check link format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySingle = (track) => {
    playTrack(track);
    if (onClose) onClose();
  };

  const handlePlayResolvedPlaylist = () => {
    if (!resolvedData || !resolvedData.tracks || resolvedData.tracks.length === 0) return;
    // Play first track and queue the rest
    playTrack(resolvedData.tracks[0], resolvedData.tracks);
    if (onClose) onClose();
  };

  const handleSaveAsPlaylist = () => {
    if (!resolvedData) return;
    const name = resolvedData.title || 'Imported Spotify Playlist';
    const newPl = storageService.createPlaylist(name, resolvedData.description || 'Imported via StreamSync');
    
    // Add all tracks
    (resolvedData.tracks || []).forEach(t => {
      storageService.addTrackToPlaylist(newPl.id, t);
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29, 185, 84, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#1db954" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Spotify Stream Resolver</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Zero auth required • Resolves metadata into playable audio</span>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Input Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Paste Spotify track, playlist, or album link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
              style={{
                flex: 1,
                padding: '0.85rem 1.1rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                color: '#fff'
              }}
            />
            <button
              onClick={() => handleResolve()}
              disabled={isLoading || !url.trim()}
              style={{
                padding: '0 1.5rem',
                borderRadius: 'var(--radius-sm)',
                background: '#1db954',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.9rem',
                opacity: (isLoading || !url.trim()) ? 0.6 : 1,
                cursor: (isLoading || !url.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Resolving...' : 'Resolve'}
            </button>
          </div>

          {/* Quick Sample Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Try sample:</span>
            {sampleLinks.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setUrl(s.url);
                  handleResolve(s.url);
                }}
                style={{
                  color: 'var(--accent-emerald)',
                  textDecoration: 'underline',
                  fontSize: '0.75rem'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Results Container */}
        {resolvedData && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '0.5rem' }}>
            {/* If Single Track */}
            {resolvedData.type === 'track' && resolvedData.resolved && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <img 
                  src={resolvedData.resolved.thumbnailUrl} 
                  alt={resolvedData.resolved.title}
                  style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.75rem', color: '#1db954', fontWeight: 700 }}>SPOTIFY RESOLVED TO 320K STREAM</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {resolvedData.resolved.title}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {resolvedData.resolved.artist}
                  </span>
                </div>
                <button
                  onClick={() => handlePlaySingle(resolvedData.resolved)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-emerald)',
                    color: '#000',
                    fontWeight: 700
                  }}
                >
                  <Play size={16} fill="#000" />
                  <span>Play</span>
                </button>
              </div>
            )}

            {/* If Playlist or Album */}
            {(resolvedData.type === 'playlist' || resolvedData.type === 'album') && (
              <div>
                {/* Playlist Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  {resolvedData.thumbnailUrl && (
                    <img 
                      src={resolvedData.thumbnailUrl} 
                      alt={resolvedData.title}
                      style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#1db954', fontWeight: 700 }}>
                      {resolvedData.type}
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{resolvedData.title}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {resolvedData.totalTracks || resolvedData.tracks?.length || 0} tracks resolved
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handlePlayResolvedPlaylist}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.65rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-emerald)',
                        color: '#000',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      <Play size={16} fill="#000" />
                      <span>Play All</span>
                    </button>

                    <button
                      onClick={handleSaveAsPlaylist}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.65rem 1rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: savedSuccess ? 'var(--accent-emerald)' : '#fff',
                        fontSize: '0.85rem'
                      }}
                    >
                      {savedSuccess ? <Check size={16} /> : <Plus size={16} />}
                      <span>{savedSuccess ? 'Saved' : 'Save as Playlist'}</span>
                    </button>
                  </div>
                </div>

                {/* Track List Preview */}
                <div className="glass-panel" style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.5rem' }}>
                  {resolvedData.tracks?.map((t, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handlePlaySingle(t)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <span style={{ color: 'var(--text-muted)', width: '20px', textAlign: 'center' }}>{idx + 1}</span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.artist}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatTime(t.duration)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
