import React, { useState } from 'react';
import { AudioPlayerProvider } from './context/AudioPlayerProvider';
import { useAudioPlayer } from './context/AudioPlayerContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import LibraryView from './components/LibraryView';
import LikedSongsView from './components/LikedSongsView';
import PlayerBar from './components/PlayerBar';
import QueueDrawer from './components/QueueDrawer';
import FullscreenPlayer from './components/FullscreenPlayer';
import PlaylistDetailModal from './components/PlaylistDetailModal';

function MainApp() {
  const { 
    activeTab, 
    setActiveTab, 
    isQueueOpen, 
    setIsQueueOpen, 
    isFullscreenPlayerOpen, 
    setIsFullscreenPlayerOpen 
  } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

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

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar onSelectPlaylist={(pl) => setSelectedPlaylist(pl)} />

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
            onSelectPlaylist={(pl) => setSelectedPlaylist(pl)} 
          />
        )}

        {activeTab === 'favorites' && (
          <LikedSongsView />
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

      {selectedPlaylist && (
        <PlaylistDetailModal 
          playlist={selectedPlaylist} 
          onClose={() => setSelectedPlaylist(null)}
          onUpdate={() => {}}
        />
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
