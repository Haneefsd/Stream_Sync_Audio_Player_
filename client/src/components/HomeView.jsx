import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import TrackCard from './TrackCard';
import {
  Flame,
  Play,
  Zap,
  RotateCw,
  Sparkles
} from 'lucide-react';

export default function HomeView({ onSearchGenre }) {
  const { playTrack, pageRefreshKey } = useAudioPlayer();
  const [trendingData, setTrendingData] = useState({ sectionTitle: 'Trending Hits', tracks: [], featured: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMood, setActiveMood] = useState('All');

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

  const fetchTrendingRecommendations = async (showRefreshSpin = false) => {
    if (showRefreshSpin) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Analyze all old search results, history, and favorited artists
      const hints = storageService.getPersonalizedHints();
      const historyParam = hints.join(',');

      const data = await apiService.getTrending(historyParam);
      setTrendingData(data);
    } catch (err) {
      console.error('Failed to load trending recommendations:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setActiveMood('All');
    fetchTrendingRecommendations(false);
  }, [pageRefreshKey]);

  const handleManualRefresh = (e) => {
    e.stopPropagation();
    if (isRefreshing) return;
    fetchTrendingRecommendations(true);
  };

  const handleMoodClick = (mood) => {
    setActiveMood(mood.label);
    if (mood.label === 'All') return;
    if (onSearchGenre) {
      onSearchGenre(mood.query);
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
            <Zap size={14} /> STATELESS AUDIO PLAYER
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

      {/* Dynamic Trending & Recommended Mix with Small Refresh Button */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} color="var(--accent-emerald)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  Trending Hits
                </h2>

                {/* Small Refresh Button for Trending Hits */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: isRefreshing ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    cursor: isRefreshing ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isRefreshing) {
                      e.currentTarget.style.color = 'var(--accent-emerald)';
                      e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isRefreshing) {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }
                  }}
                  title="Refresh Trending & Recommended Hits"
                >
                  <RotateCw
                    size={14}
                    style={{
                      animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading recommended tracks...
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
