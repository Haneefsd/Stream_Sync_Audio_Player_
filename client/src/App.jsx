import React, { useState, useEffect } from 'react';
import { storageService } from './services/storage';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { AudioPlayerProvider } from './context/AudioPlayerProvider';
import { useAudioPlayer } from './context/AudioPlayerContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import LibraryView from './components/LibraryView';
import LikedSongsView from './components/LikedSongsView';
import PlaylistView from './components/PlaylistView';
import PlayerBar from './components/PlayerBar';
import QueueDrawer from './components/QueueDrawer';
import FullscreenPlayer from './components/FullscreenPlayer';

function MainApp() {
  const { 
    activeTab, 
    setActiveTab, 
    pageRefreshKey,
    isQueueOpen, 
    setIsQueueOpen, 
    isFullscreenPlayerOpen, 
    setIsFullscreenPlayerOpen 
  } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // When page is refreshed via Logo click, reset active query & selected playlist

  useEffect(() => {
    setSearchQuery('');
    setSelectedPlaylist(null);
  }, [pageRefreshKey]);

  // Keep selected playlist in sync with storage updates (e.g. renames, track removals, deletions)
  useEffect(() => {
    const handlePlaylistsUpdated = () => {
      if (selectedPlaylist) {
        const playlists = storageService.getPlaylists();
        const updated = playlists.find(p => p.id === selectedPlaylist.id);
        if (updated) {
          setSelectedPlaylist(updated);
        } else {
          // It was deleted
          setSelectedPlaylist(null);
          if (activeTab === 'playlist') {
            setActiveTab('library');
          }
        }
      }
    };
    window.addEventListener('playlistsUpdated', handlePlaylistsUpdated);
    return () => window.removeEventListener('playlistsUpdated', handlePlaylistsUpdated);
  }, [selectedPlaylist, activeTab, setActiveTab]);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (query.trim() && activeTab !== 'search') {
      setActiveTab('search');
    }
  };

  const handleGenreSearch = (genreQuery) => {
    setSearchQuery(genreQuery);
    setActiveTab('search');
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setActiveTab('playlist');
  };

  return (
    <div className="app-container">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'is-active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        onSelectPlaylist={handleSelectPlaylist} 
        selectedPlaylistId={selectedPlaylist?.id}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <main className="main-viewport">
        <Header 
          searchQuery={searchQuery} 
          onSearchChange={handleSearchChange} 
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* View Switcher */}
        {activeTab === 'home' && (
          <HomeView onSearchGenre={handleGenreSearch} />
        )}

        {activeTab === 'search' && (
          <SearchView 
            query={searchQuery} 
            onSearchSelect={(q) => handleSearchChange(q)}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView 
            onSelectPlaylist={handleSelectPlaylist} 
          />
        )}

        {activeTab === 'favorites' && (
          <LikedSongsView />
        )}

        {/* Dedicated Individual Playlist Page */}
        {activeTab === 'playlist' && selectedPlaylist && (
          <PlaylistView 
            playlist={selectedPlaylist}
            onBack={() => setActiveTab('library')}
            onPlaylistUpdate={(updatedPl) => setSelectedPlaylist(updatedPl)}
            onPlaylistDelete={() => {
              setSelectedPlaylist(null);
              setActiveTab('library');
            }}
          />
        )}
      </main>

      {/* 3. Bottom Sticky Player Bar */}
      <PlayerBar />

      {/* 4. Drawers & Modals */}
      {isQueueOpen && (
        <QueueDrawer onClose={() => setIsQueueOpen(false)} />
      )}

      {isFullscreenPlayerOpen && (
        <FullscreenPlayer onClose={() => setIsFullscreenPlayerOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AudioPlayerProvider>
      <ConfirmationProvider>
        <MainApp />
      </ConfirmationProvider>
    </AudioPlayerProvider>
  );
}
