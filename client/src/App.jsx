import React, { useState } from 'react';
import { AudioPlayerProvider } from './context/AudioPlayerProvider';
import { useAudioPlayer } from './context/AudioPlayerContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import LibraryView from './components/LibraryView';
import PlayerBar from './components/PlayerBar';
import QueueDrawer from './components/QueueDrawer';
import FullscreenPlayer from './components/FullscreenPlayer';
import SpotifyImportModal from './components/SpotifyImportModal';
import PlaylistDetailModal from './components/PlaylistDetailModal';

function MainApp() {
  const { 
    activeTab, 
    setActiveTab, 
    isQueueOpen, 
    setIsQueueOpen, 
    isFullscreenPlayerOpen, 
    setIsFullscreenPlayerOpen, 
    isSpotifyModalOpen, 
    setIsSpotifyModalOpen 
  } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('all');
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
          searchSource={searchSource}
          onSourceChange={(src) => setSearchSource(src)}
        />

        {/* View Switcher */}
        {activeTab === 'home' && (
          <HomeView onSearchGenre={handleGenreSearch} />
        )}

        {activeTab === 'search' && (
          <SearchView 
            query={searchQuery} 
            source={searchSource} 
          />
        )}

        {activeTab === 'library' && (
          <LibraryView 
            onSelectPlaylist={(pl) => setSelectedPlaylist(pl)} 
            defaultSection="liked" 
          />
        )}

        {activeTab === 'favorites' && (
          <LibraryView 
            onSelectPlaylist={(pl) => setSelectedPlaylist(pl)} 
            defaultSection="liked" 
          />
        )}

        {activeTab === 'playlists' && (
          <LibraryView 
            onSelectPlaylist={(pl) => setSelectedPlaylist(pl)} 
            defaultSection="playlists" 
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

      {isSpotifyModalOpen && (
        <SpotifyImportModal onClose={() => setIsSpotifyModalOpen(false)} />
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
