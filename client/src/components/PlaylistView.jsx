import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';
import TrackRow from './TrackRow';
import { 
  Play, 
  Shuffle, 
  Trash2, 
  Music, 
  Camera, 
  Check, 
  Edit2, 
  ArrowLeft, 
  Search, 
  Plus, 
  Clock, 
  Sparkles,
  Upload
} from 'lucide-react';

export default function PlaylistView({ playlist, onBack, onPlaylistUpdate, onPlaylistDelete }) {
  const { playTrack, toggleShuffle } = useAudioPlayer();
  const { requestConfirmation } = useConfirmation();
  const [currentPlaylist, setCurrentPlaylist] = useState(playlist);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverInputUrl, setCoverInputUrl] = useState(playlist.coverUrl || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playlist.name);
  
  // In-page search to add songs
  const [addSongQuery, setAddSongQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedTrackIds, setAddedTrackIds] = useState(new Set());

  useEffect(() => {
    setCurrentPlaylist(playlist);
    setNameInput(playlist.name);
    setCoverInputUrl(playlist.coverUrl || '');
  }, [playlist]);

  const coverImage = storageService.getPlaylistCover(currentPlaylist);

  // Calculate total duration
  const totalDurationSecs = (currentPlaylist.tracks || []).reduce((acc, t) => acc + (t.duration || 0), 0);
  const formatTotalTime = (secs) => {
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} hr ${remMins} min`;
  };

  const handlePlayAll = () => {
    if (currentPlaylist.tracks?.length > 0) {
      playTrack(currentPlaylist.tracks[0], currentPlaylist.tracks);
    }
  };

  const handleShufflePlay = () => {
    if (currentPlaylist.tracks?.length > 0) {
      toggleShuffle(true);
      const randomTrack = currentPlaylist.tracks[Math.floor(Math.random() * currentPlaylist.tracks.length)];
      playTrack(randomTrack, currentPlaylist.tracks);
    }
  };

  const handleRemoveTrack = (trackId) => {
    storageService.removeTrackFromPlaylist(currentPlaylist.id, trackId);
    const updatedPlaylists = storageService.getPlaylists();
    const updated = updatedPlaylists.find(p => p.id === currentPlaylist.id);
    if (updated) {
      setCurrentPlaylist(updated);
      if (onPlaylistUpdate) onPlaylistUpdate(updated);
    }
  };

  const handleSaveCoverUrl = (e) => {
    e.preventDefault();
    const updated = storageService.updatePlaylist(currentPlaylist.id, { coverUrl: coverInputUrl.trim() });
    if (updated) {
      setCurrentPlaylist(updated);
      if (onPlaylistUpdate) onPlaylistUpdate(updated);
    }
    setIsEditingCover(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      const updated = storageService.updatePlaylist(currentPlaylist.id, { coverUrl: base64Url });
      if (updated) {
        setCurrentPlaylist(updated);
        if (onPlaylistUpdate) onPlaylistUpdate(updated);
      }
      setIsEditingCover(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    const updated = storageService.updatePlaylist(currentPlaylist.id, { coverUrl: '' });
    if (updated) {
      setCurrentPlaylist(updated);
      if (onPlaylistUpdate) onPlaylistUpdate(updated);
    }
    setCoverInputUrl('');
    setIsEditingCover(false);
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    requestConfirmation({
      title: 'Rename Playlist',
      message: `Are you sure you want to rename this playlist to "${nameInput.trim()}"?`,
      confirmText: 'Rename',
      cancelText: 'Cancel',
      actionType: 'update',
      onConfirm: () => {
        const updated = storageService.updatePlaylist(currentPlaylist.id, { name: nameInput.trim() });
        if (updated) {
          setCurrentPlaylist(updated);
          if (onPlaylistUpdate) onPlaylistUpdate(updated);
        }
        setIsEditingName(false);
      }
    });
  };

  const handleDelete = () => {
    requestConfirmation({
      title: 'Delete Playlist',
      message: `Are you sure you want to delete "${currentPlaylist.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      actionType: 'delete',
      onConfirm: () => {
        storageService.deletePlaylist(currentPlaylist.id);
        if (onPlaylistDelete) onPlaylistDelete();
      }
    });
  };

  // Search inside playlist page to easily add songs
  useEffect(() => {
    if (!addSongQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await apiService.search(addSongQuery, 6);
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search songs for playlist:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [addSongQuery]);

  const handleAddTrackDirectly = (track) => {
    storageService.addTrackToPlaylist(currentPlaylist.id, track);
    const updatedPlaylists = storageService.getPlaylists();
    const updated = updatedPlaylists.find(p => p.id === currentPlaylist.id);
    if (updated) {
      setCurrentPlaylist(updated);
      if (onPlaylistUpdate) onPlaylistUpdate(updated);
    }
    setAddedTrackIds(prev => new Set(prev).add(track.id));
  };

  return (
    <div className="content-scrollable">
      {/* Back to Library Navigation Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.95rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--accent-emerald)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </button>
      </div>

      {/* Playlist Hero Header */}
      <div 
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '2rem',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 50%, var(--bg-surface) 100%)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
          flexWrap: 'wrap'
        }}
      >
        {/* Cover Photo / Photo Upload Overlay */}
        <div
          style={{
            position: 'relative',
            width: '190px',
            height: '190px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
            cursor: 'pointer',
            flexShrink: 0
          }}
          onClick={() => setIsEditingCover(!isEditingCover)}
          title="Click to Change Playlist Photo"
        >
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={currentPlaylist.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Music size={64} color="var(--accent-emerald)" />
          )}

          {/* Hover Camera Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              opacity: isEditingCover ? 1 : 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => { if (!isEditingCover) e.currentTarget.style.opacity = 0; }}
          >
            <Camera size={26} color="#fff" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>Change Photo</span>
          </div>
        </div>

        {/* Playlist Meta Details */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-emerald)',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={13} />
            <span>PLAYLIST</span>
          </div>

          {!isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, wordBreak: 'break-word' }}>
                {currentPlaylist.name}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                style={{
                  color: 'var(--text-muted)',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
                title="Rename Playlist"
              >
                <Edit2 size={18} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--accent-emerald)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: '#fff',
                  maxWidth: '380px'
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  padding: '0.55rem 0.85rem', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--accent-emerald)', 
                  color: '#000',
                  fontWeight: 700
                }}
              >
                Save
              </button>
            </form>
          )}

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            {currentPlaylist.description || 'Personal playlist collection • High-fidelity audio'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#fff' }}>StreamSync</span>
            <span>•</span>
            <span>{currentPlaylist.tracks?.length || 0} {currentPlaylist.tracks?.length === 1 ? 'song' : 'songs'}</span>
            {totalDurationSecs > 0 && (
              <>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={13} />
                  <span>{formatTotalTime(totalDurationSecs)}</span>
                </div>
              </>
            )}
            <span>•</span>
            <span style={{ color: currentPlaylist.coverUrl ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {currentPlaylist.coverUrl ? 'Custom Cover Photo' : (currentPlaylist.tracks?.length > 0 ? 'Using 1st Song Artwork' : 'Default Art')}
            </span>
          </div>
        </div>
      </div>

      {/* Change Photo Drawer (if open) */}
      {isEditingCover && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
            Update Playlist Cover Photo
          </h3>

          <div className="cover-edit-actions">
            {/* Upload File */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: 'var(--accent-emerald)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              <Upload size={16} />
              <span>Upload Image from Device</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            {/* URL Input */}
            <form onSubmit={handleSaveCoverUrl} className="cover-edit-form">
              <input
                type="url"
                placeholder="Or paste direct image URL (https://...)"
                value={coverInputUrl}
                onChange={(e) => setCoverInputUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.85rem',
                  color: '#fff'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0 1.15rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-emerald)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                Save Photo
              </button>
            </form>

            {/* Reset to 1st Song Image */}
            {currentPlaylist.coverUrl && (
              <button
                onClick={handleRemoveCover}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                Use 1st Song Image
              </button>
            )}

            <button
              onClick={() => setIsEditingCover(false)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Playlist Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="playlist-actions">
          {currentPlaylist.tracks?.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 1.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-emerald)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  boxShadow: '0 0 25px var(--accent-emerald-glow)',
                  cursor: 'pointer'
                }}
              >
                <Play size={18} fill="#000" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleShufflePlay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.35rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <Shuffle size={17} />
                <span>Shuffle</span>
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: '#ef4444',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Delete this playlist"
          >
            <Trash2 size={15} />
            <span>Delete Playlist</span>
          </button>
        </div>
      </div>

      {/* Playlist Songs Table */}
      <div style={{ marginBottom: '3.5rem' }}>
        {currentPlaylist.tracks?.length > 0 ? (
          <div className="track-list glass-panel" style={{ padding: '0.85rem' }}>
            {currentPlaylist.tracks.map((track, i) => (
              <TrackRow
                key={`${track.id}_${i}`}
                track={track}
                index={i}
                trackList={currentPlaylist.tracks}
                onRemove={handleRemoveTrack}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <Music size={28} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              This playlist is empty
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
              Use the search box below to find your favorite songs and add them directly to this playlist!
            </p>
          </div>
        )}
      </div>

      {/* In-Page Search to Add Songs to this Playlist */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Find songs to add to "{currentPlaylist.name}"
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Search for songs, artists, or acoustic covers to quickly add them to this playlist
        </p>

        <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '560px' }}>
          <Search 
            size={18} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            placeholder="Search songs or artists..."
            value={addSongQuery}
            onChange={(e) => setAddSongQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              fontSize: '0.9rem',
              color: '#fff'
            }}
          />
        </div>

        {isSearching && (
          <div style={{ padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Searching tracks...
          </div>
        )}

        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {searchResults.map((track) => {
              const isAlreadyIn = currentPlaylist.tracks?.some(t => t.id === track.id) || addedTrackIds.has(track.id);
              return (
                <div
                  key={track.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden' }}>
                    <img 
                      src={track.thumbnailUrl} 
                      alt={track.title}
                      style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} 
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {track.artist}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => !isAlreadyIn && handleAddTrackDirectly(track)}
                    disabled={isAlreadyIn}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.95rem',
                      borderRadius: 'var(--radius-full)',
                      background: isAlreadyIn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${isAlreadyIn ? 'transparent' : 'rgba(16, 185, 129, 0.35)'}`,
                      color: isAlreadyIn ? 'var(--text-muted)' : 'var(--accent-emerald)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: isAlreadyIn ? 'default' : 'pointer'
                    }}
                  >
                    {isAlreadyIn ? (
                      <>
                        <Check size={14} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
