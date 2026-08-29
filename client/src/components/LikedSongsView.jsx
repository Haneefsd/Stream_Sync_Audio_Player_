import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { storageService } from '../services/storage';
import TrackRow from './TrackRow';
import { Heart, Play, Shuffle, Search, Music } from 'lucide-react';

export default function LikedSongsView() {
  const { playTrack, toggleShuffle } = useAudioPlayer();
  const [favorites, setFavorites] = useState(storageService.getFavorites());
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    setFavorites(storageService.getFavorites());
  }, []);

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  const handleShuffle = () => {
    if (favorites.length > 0) {
      const randomIndex = Math.floor(Math.random() * favorites.length);
      playTrack(favorites[randomIndex], favorites);
      toggleShuffle();
    }
  };

  const filteredFavorites = favorites.filter(track => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      track.title?.toLowerCase().includes(q) ||
      track.artist?.toLowerCase().includes(q) ||
      track.album?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="content-scrollable">
      {/* Liked Songs Hero Banner */}
      <div 
        className="hero-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(219, 39, 119, 0.1) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Big Gradient Heart Icon */}
        <div style={{
          width: '130px',
          height: '130px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
          flexShrink: 0
        }}>
          <Heart size={64} fill="#fff" color="#fff" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-pink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Playlist
          </span>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1 }}>
            Liked Songs
          </h1>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} saved in your private collection
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {favorites.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-pink)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Play size={18} fill="#fff" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleShuffle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1.35rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                <Shuffle size={16} />
                <span>Shuffle</span>
              </button>
            </>
          )}
        </div>

        {/* Filter within Liked Songs */}
        {favorites.length > 3 && (
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search in liked songs..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: '#fff',
                width: '220px'
              }}
            />
          </div>
        )}
      </div>

      {/* Liked Songs Track List */}
      {filteredFavorites.length > 0 ? (
        <div className="track-list glass-panel" style={{ padding: '0.75rem' }}>
          {filteredFavorites.map((track, i) => (
            <TrackRow 
              key={track.id} 
              track={track} 
              index={i} 
              trackList={filteredFavorites} 
              onRemove={() => {
                storageService.toggleFavorite(track);
                setFavorites(storageService.getFavorites());
              }}
            />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          No liked songs match "{filterQuery}"
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'rgba(236, 72, 153, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <Heart size={36} color="var(--accent-pink)" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Liked Songs Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '360px', margin: '0 auto' }}>
            Songs you like by clicking the heart icon will appear right here in your private collection.
          </p>
        </div>
      )}
    </div>
  );
}
