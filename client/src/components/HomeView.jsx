import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import TrackCard from './TrackCard';
import { 
  Flame, 
  Play, 
  Zap, 
  History, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

export default function HomeView({ onSearchGenre }) {
  const { playTrack } = useAudioPlayer();
  const [trendingData, setTrendingData] = useState({ sectionTitle: 'Trending Hits', tracks: [], featured: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeMood, setActiveMood] = useState('All');
  const [searchHistory, setSearchHistory] = useState(storageService.getSearchHistory().slice(0, 6));

  const moods = [
    { label: 'All', query: 'Top Hits Music' },
    { label: 'Aditya Rikhari & Anuv Jain', query: 'Aditya Rikhari Anuv Jain' },
    { label: 'Aditya Rikhari Hits', query: 'Aditya Rikhari' },
    { label: 'Anuv Jain Essentials', query: 'Anuv Jain' },
    { label: 'Trending Hindi', query: 'Arijit Singh Pritam Bollywood Hits' },
    { label: 'Global Pop', query: 'Global Billboard Hot 100' },
    { label: 'Chill & Lofi', query: 'Lofi Chill Beats' },
    { label: 'Punjabi Hits', query: 'Punjabi Top Hits AP Dhillon' }
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadTrending() {
      setIsLoading(true);
      try {
        // Collect past search queries & played artists for personalized recommendations
        const hints = storageService.getPersonalizedHints();
        const historyParam = hints.join(',');

        const data = await apiService.getTrending(historyParam);
        if (isMounted) {
          setTrendingData(data);
        }
      } catch (err) {
        console.error('Failed to load trending:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadTrending();
    setSearchHistory(storageService.getSearchHistory().slice(0, 6));
    return () => { isMounted = false; };
  }, []);

  const handleMoodClick = (mood) => {
    setActiveMood(mood.label);
    if (mood.label === 'All') return;
    if (onSearchGenre) {
      onSearchGenre(mood.query);
    }
  };

  const handleHistoryClick = (query) => {
    if (onSearchGenre) {
      onSearchGenre(query);
    }
  };

  const featuredTrack = trendingData.featured?.[0] || trendingData.tracks?.[0];

  return (
    <div className="content-scrollable">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--accent-emerald)',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '1.25rem'
          }}>
            <Zap size={14} /> ZERO DATABASE • STATELESS AUDIO PLAYER
          </div>

          <h1 style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            High-Fidelity Music Streaming.
          </h1>

          <p style={{
            fontSize: '1.02rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            lineHeight: 1.6
          }}>
            Stream any song, artist, album, and live performance seamlessly with zero login walls and instant playback.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {featuredTrack && (
              <button
                onClick={() => playTrack(featuredTrack, trendingData.tracks || trendingData.featured)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 1.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-emerald)',
                  color: 'var(--text-inverse)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 0 25px var(--accent-emerald-glow)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Play size={18} fill="#000" />
                <span>Play Featured Track</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Floating Artwork Widget */}
        {featuredTrack && (
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '240px'
          }}>
            <div style={{
              width: '220px',
              height: '220px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              position: 'relative'
            }}>
              <img 
                src={featuredTrack.thumbnailUrl} 
                alt={featuredTrack.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span style={{ marginTop: '0.85rem', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
              {featuredTrack.title}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {featuredTrack.artist}
            </span>
          </div>
        )}
      </div>

      {/* Recent Searches Quick-Row (if search history exists) */}
      {searchHistory.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <History size={14} />
            <span>RECENT SEARCHES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {searchHistory.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleHistoryClick(q)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mood / Genre Filter Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2.5rem' }}>
        {moods.map(m => (
          <button
            key={m.label}
            onClick={() => handleMoodClick(m)}
            className={`glass-pill ${activeMood === m.label ? 'active' : ''}`}
            style={{
              padding: '0.55rem 1.1rem',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Dynamic Trending & Discovery Mix (Personalized by Search History) */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} color="var(--accent-emerald)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {trendingData.sectionTitle || 'Trending Hits Today'}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Personalized discovery mix • Updates dynamically based on your taste
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading personalized tracks...
          </div>
        ) : (
          <div className="track-grid">
            {(trendingData.tracks || []).map(track => (
              <TrackCard key={track.id} track={track} trackList={trendingData.tracks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
