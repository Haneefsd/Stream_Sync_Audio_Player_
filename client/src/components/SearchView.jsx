import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import TrackCard from './TrackCard';
import TrackRow from './TrackRow';
import { Search, LayoutGrid, List, History, Trash2, X } from 'lucide-react';

export default function SearchView({ query, onSearchSelect }) {
  const { playTrack } = useAudioPlayer();
  const cachedSearch = storageService.getLastSearchResults();

  const [results, setResults] = useState(cachedSearch?.results || []);
  const [activeQuery, setActiveQuery] = useState(query || cachedSearch?.query || '');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchHistory, setSearchHistory] = useState(storageService.getSearchHistory());

  // Search effect
  useEffect(() => {
    const searchQuery = query !== undefined ? query : activeQuery;
    if (!searchQuery || !searchQuery.trim()) {
      if (!cachedSearch?.results) {
        setResults([]);
      }
      return;
    }

    setActiveQuery(searchQuery);

    let isMounted = true;
    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        storageService.addSearchHistory(searchQuery);
        setSearchHistory(storageService.getSearchHistory());

        const data = await apiService.search(searchQuery, 24);
        if (isMounted) {
          setResults(data);
          // Persist the search results in client storage
          storageService.saveLastSearchResults(searchQuery, data);
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
  }, [query]);

  const handleSelectHistoryItem = (item) => {
    setActiveQuery(item);
    if (onSearchSelect) {
      onSearchSelect(item);
    }
  };

  const handleRemoveHistoryItem = (item, e) => {
    if (e) e.stopPropagation();
    storageService.removeSearchHistoryItem(item);
    setSearchHistory(storageService.getSearchHistory());
  };

  const handleClearHistory = () => {
    storageService.clearSearchHistory();
    setSearchHistory([]);
  };

  const handleClearSavedResults = () => {
    storageService.clearLastSearchResults();
    setResults([]);
    setActiveQuery('');
  };

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
          {/* While displaying search results, only display the search keyword */}
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {activeQuery ? activeQuery : 'Search Music'}
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {results.length > 0 ? `${results.length} tracks found` : 'Search any song, artist, album, or acoustic cover'}
          </span>
        </div>

        {/* View Mode & Actions Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {results.length > 0 && (
            <button
              onClick={handleClearSavedResults}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              Clear Results
            </button>
          )}

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
          <span>Searching music...</span>
        </div>
      )}

      {/* Saved Search Results Display */}
      {!isLoading && results.length > 0 && (
        viewMode === 'grid' ? (
          <div className="track-grid">
            {results.map(track => (
              <TrackCard key={track.id} track={track} trackList={results} />
            ))}
          </div>
        ) : (
          <div className="track-list glass-panel" style={{ padding: '0.75rem' }}>
            {results.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} trackList={results} />
            ))}
          </div>
        )
      )}

      {/* Empty State / Previous Searches List with Cross to remove individual items */}
      {!isLoading && results.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {searchHistory.length > 0 ? (
            <div className="glass-panel" style={{ padding: '1.75rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <History size={18} />
                  <span>Previous Searches</span>
                </div>

                <button
                  onClick={handleClearHistory}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                  <span>Clear All</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {searchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectHistoryItem(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--accent-emerald)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Search size={15} color="var(--text-muted)" />
                      <span>{item}</span>
                    </div>

                    {/* Cross Button to remove individual search result */}
                    <button
                      onClick={(e) => handleRemoveHistoryItem(item, e)}
                      title={`Remove "${item}"`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
                {activeQuery ? activeQuery : 'Type to search music'}
              </h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.9rem' }}>
                Search by track title, artist name, album, or acoustic covers.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
