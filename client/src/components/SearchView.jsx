import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { apiService } from '../services/api';
import TrackCard from './TrackCard';
import TrackRow from './TrackRow';
import { Search, LayoutGrid, List, Music, Sparkles, Filter } from 'lucide-react';

export default function SearchView({ query, source }) {
  const { playTrack } = useAudioPlayer();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'jiosaavn' | 'youtube'

  useEffect(() => {
    if (!query || !query.trim()) {
      setResults([]);
      return;
    }

    let isMounted = true;
    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiService.search(query, source || activeFilter, 24);
        if (isMounted) {
          setResults(data);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounce);
    };
  }, [query, source, activeFilter]);

  const filteredResults = activeFilter === 'all' 
    ? results 
    : results.filter(r => r.source === activeFilter);

  return (
    <div className="content-scrollable">
      {/* Search Header Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {query ? `Results for "${query}"` : 'Search Music'}
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {filteredResults.length} tracks found across streaming networks
          </span>
        </div>

        {/* View Mode & Filter Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Source Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', padding: '3px' }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: activeFilter === 'all' ? 700 : 500,
                background: activeFilter === 'all' ? 'var(--accent-emerald)' : 'transparent',
                color: activeFilter === 'all' ? '#000' : 'var(--text-secondary)'
              }}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('jiosaavn')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: activeFilter === 'jiosaavn' ? 700 : 500,
                background: activeFilter === 'jiosaavn' ? 'var(--source-jiosaavn)' : 'transparent',
                color: activeFilter === 'jiosaavn' ? '#000' : 'var(--text-secondary)'
              }}
            >
              JioSaavn
            </button>
            <button
              onClick={() => setActiveFilter('youtube')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: activeFilter === 'youtube' ? 700 : 500,
                background: activeFilter === 'youtube' ? '#ef4444' : 'transparent',
                color: activeFilter === 'youtube' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              YouTube
            </button>
          </div>

          {/* Grid / List Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.4rem',
                borderRadius: '4px',
                background: viewMode === 'grid' ? 'var(--bg-active)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent-emerald)' : 'var(--text-muted)'
              }}
              title="Grid view"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.4rem',
                borderRadius: '4px',
                background: viewMode === 'list' ? 'var(--bg-active)' : 'transparent',
                color: viewMode === 'list' ? 'var(--accent-emerald)' : 'var(--text-muted)'
              }}
              title="List view"
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem', color: 'var(--text-muted)' }}>
          <div className="sound-wave" style={{ height: '24px' }}>
            <div className="sound-wave-bar" style={{ width: '4px' }}></div>
            <div className="sound-wave-bar" style={{ width: '4px' }}></div>
            <div className="sound-wave-bar" style={{ width: '4px' }}></div>
            <div className="sound-wave-bar" style={{ width: '4px' }}></div>
          </div>
          <span>Searching high-fidelity streams across JioSaavn & YouTube...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredResults.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 0',
          textAlign: 'center'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            color: 'var(--text-muted)'
          }}>
            <Search size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {query ? 'No matching songs found' : 'Type to search anything'}
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.9rem' }}>
            Search by track title, artist name, movie album, or paste a Spotify link to start streaming.
          </p>
        </div>
      )}

      {/* Results Display */}
      {!isLoading && filteredResults.length > 0 && (
        viewMode === 'grid' ? (
          <div className="track-grid">
            {filteredResults.map(track => (
              <TrackCard key={track.id} track={track} trackList={filteredResults} />
            ))}
          </div>
        ) : (
          <div className="track-list glass-panel" style={{ padding: '0.75rem' }}>
            {filteredResults.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} trackList={filteredResults} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
