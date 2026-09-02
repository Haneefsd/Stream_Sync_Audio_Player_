import React, { useState, useEffect } from 'react';
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

  // When page is refreshed via Logo click, reset active query & selected playlist
  useEffect(() => {
    setSearchQuery('');
    setSelectedPlaylist(null);
  }, [pageRefreshKey]);

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
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        onSelectPlaylist={handleSelectPlaylist} 
        selectedPlaylistId={selectedPlaylist?.id}
      />

      {/* 2. Main Viewport & Scrollable Content */}
      <main className="main-viewport">
        <Header 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
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
      <MainApp />
    </AudioPlayerProvider>
  );
}
