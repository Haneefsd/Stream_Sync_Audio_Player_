import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { apiService } from '../services/api';
import TrackCard from './TrackCard';
import TrackRow from './TrackRow';
import { 
  Flame, 
  Sparkles, 
  Play, 
  Radio, 
  Disc3, 
  TrendingUp, 
  Music2, 
  Headphones,
  Zap
} from 'lucide-react';

export default function HomeView({ onSearchGenre }) {
  const { playTrack, setIsSpotifyModalOpen } = useAudioPlayer();
  const [trendingData, setTrendingData] = useState({ jiosaavn: [], youtube: [], featured: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeMood, setActiveMood] = useState('All');

  const moods = [
    { label: 'All', query: 'Top Hits' },
    { label: 'Trending Hindi', query: 'Arijit Singh Pritam Bollywood Hits' },
    { label: 'Global Pop', query: 'Global Billboard Hot 100' },
    { label: 'Chill & Lofi', query: 'Lofi Chill Beats' },
    { label: 'Punjabi Hits', query: 'Punjabi Top Hits AP Dhillon' },
    { label: 'Workout Energy', query: 'Gym Workout High Bass Music' }
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadTrending() {
      setIsLoading(true);
      try {
        const data = await apiService.getTrending();
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
    return () => { isMounted = false; };
  }, []);

  const handleMoodClick = (mood) => {
    setActiveMood(mood.label);
    if (mood.label === 'All') return;
    if (onSearchGenre) {
      onSearchGenre(mood.query);
    }
  };

  const featuredTrack = trendingData.featured?.[0] || trendingData.jiosaavn?.[0] || trendingData.youtube?.[0];

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
            <Zap size={14} /> ZERO DATABASE • MULTI-SOURCE AUDIO AGGREGATOR
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
            High-Fidelity Audio Across All Platforms.
          </h1>

          <p style={{
            fontSize: '1.02rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            lineHeight: 1.6
          }}>
            Stream JioSaavn (direct 320 kbps), YouTube Music, and import your Spotify playlists instantly with zero login walls.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {featuredTrack && (
              <button
                onClick={() => playTrack(featuredTrack, trendingData.featured)}
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

            <button
              onClick={() => setIsSpotifyModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.85rem 1.5rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.92rem'
              }}
            >
              <Sparkles size={17} color="#1db954" />
              <span>Import Spotify Link</span>
            </button>
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

      {/* Section 1: Trending on JioSaavn (320kbps Ultra Fidelity) */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(43, 197, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Disc3 size={18} color="var(--source-jiosaavn)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Trending on JioSaavn</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Direct 320 kbps high-bitrate audio streams</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading high-fidelity tracks...
          </div>
        ) : (
          <div className="track-grid">
            {trendingData.jiosaavn.slice(0, 10).map(track => (
              <TrackCard key={track.id} track={track} trackList={trendingData.jiosaavn} />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Trending on YouTube Music */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} color="#ef4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Popular on YouTube Music</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Global viral hits and trending audio streams</span>
            </div>
          </div>
        </div>

        <div className="track-grid">
          {trendingData.youtube.slice(0, 10).map(track => (
            <TrackCard key={track.id} track={track} trackList={trendingData.youtube} />
          ))}
        </div>
      </div>
    </div>
  );
}
