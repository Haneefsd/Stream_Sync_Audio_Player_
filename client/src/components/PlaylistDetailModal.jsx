import React, { useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { storageService } from '../services/storage';
import TrackRow from './TrackRow';
import { X, Play, Trash2, Music, Camera, Image, Check, Edit2 } from 'lucide-react';

export default function PlaylistDetailModal({ playlist, onClose, onUpdate }) {
  const { playTrack } = useAudioPlayer();
  const { requestConfirmation } = useConfirmation();
  const [currentPlaylist, setCurrentPlaylist] = useState(playlist);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverInputUrl, setCoverInputUrl] = useState(playlist.coverUrl || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playlist.name);

  if (!currentPlaylist) return null;

  const coverImage = storageService.getPlaylistCover(currentPlaylist);

  const handlePlayAll = () => {
    if (currentPlaylist.tracks?.length > 0) {
      playTrack(currentPlaylist.tracks[0], currentPlaylist.tracks);
      onClose();
    }
  };

  const handleRemoveTrack = (trackId) => {
    const trackToRemove = currentPlaylist.tracks.find(t => t.id === trackId);
    
    requestConfirmation({
      title: 'Remove Track',
      message: `Are you sure you want to remove "${trackToRemove?.title || 'this track'}" from the playlist?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      actionType: 'delete',
      onConfirm: () => {
        storageService.removeTrackFromPlaylist(currentPlaylist.id, trackId);
        const updatedPlaylists = storageService.getPlaylists();
        const updated = updatedPlaylists.find(p => p.id === currentPlaylist.id);
        if (updated) {
          setCurrentPlaylist(updated);
        }
        if (onUpdate) onUpdate();
      }
    });
  };

  const handleSaveCoverUrl = (e) => {
    e.preventDefault();
    const updated = storageService.updatePlaylist(currentPlaylist.id, { coverUrl: coverInputUrl.trim() });
    if (updated) {
      setCurrentPlaylist(updated);
    }
    setIsEditingCover(false);
    if (onUpdate) onUpdate();
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
      }
      setIsEditingCover(false);
      if (onUpdate) onUpdate();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    const updated = storageService.updatePlaylist(currentPlaylist.id, { coverUrl: '' });
    if (updated) {
      setCurrentPlaylist(updated);
    }
    setCoverInputUrl('');
    setIsEditingCover(false);
    if (onUpdate) onUpdate();
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
        }
        setIsEditingName(false);
        if (onUpdate) onUpdate();
      }
    });
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-strong)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Playlist Cover Art with Change Photo Button */}
            <div 
              style={{
                position: 'relative',
                width: '90px',
                height: '90px',
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
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
                <Music size={36} color="var(--accent-emerald)" />
              )}

              {/* Hover Camera Icon */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.55)',
                opacity: isEditingCover ? 1 : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => { if (!isEditingCover) e.currentTarget.style.opacity = 0; }}
              >
                <Camera size={22} color="#fff" />
              </div>
            </div>

            {/* Playlist Name & Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PLAYLIST
              </span>

              {!isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{currentPlaylist.name}</h2>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    style={{ color: 'var(--text-muted)', padding: '4px' }}
                    title="Rename Playlist"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--accent-emerald)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#fff'
                    }}
                  />
                  <button type="submit" style={{ color: 'var(--accent-emerald)', padding: '4px' }}>
                    <Check size={18} />
                  </button>
                </form>
              )}

              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {currentPlaylist.tracks?.length || 0} tracks • {currentPlaylist.coverUrl ? 'Custom Photo' : (currentPlaylist.tracks?.length > 0 ? 'Using 1st Song Image' : 'Default Cover')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentPlaylist.tracks?.length > 0 && (
              <button
                onClick={handlePlayAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.4rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-emerald)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: '0 0 20px var(--accent-emerald-glow)'
                }}
              >
                <Play size={16} fill="#000" />
                <span>Play</span>
              </button>
            )}

            <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Change Photo Panel Drawer */}
        {isEditingCover && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Change Playlist Photo
            </span>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* File Upload Button */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-emerald)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                <Image size={16} />
                <span>Upload from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Paste URL Form */}
              <form onSubmit={handleSaveCoverUrl} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
                <input
                  type="url"
                  placeholder="Or paste image URL (https://...)"
                  value={coverInputUrl}
                  onChange={(e) => setCoverInputUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.82rem',
                    color: '#fff'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-emerald)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  Save URL
                </button>
              </form>

              {/* Reset / Use 1st Song Image Button */}
              {currentPlaylist.coverUrl && (
                <button
                  onClick={handleRemoveCover}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  Use 1st Song Image
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tracks List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          {currentPlaylist.tracks?.length > 0 ? (
            <div className="track-list">
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
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>
              No tracks in this playlist yet. Add tracks using the options menu on any track card!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
