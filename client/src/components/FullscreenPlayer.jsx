import React, { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { apiService } from '../services/api';
import { formatTime } from '../utils/formatters';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Activity,
  FileText,
  Disc,
  FolderPlus
} from 'lucide-react';

export default function FullscreenPlayer({ onClose }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    shuffle,
    analyserRef,
    togglePlay,
    handleNextTrack,
    handlePrevTrack,
    seekTo,
    toggleRepeatMode,
    toggleShuffle,
    openAddToPlaylist
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState('visualizer'); // 'visualizer' | 'lyrics'
  const [lyricsData, setLyricsData] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [visualizerType, setVisualizerType] = useState('bars'); // 'bars' | 'wave' | 'circle'

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const seekSliderRef = useRef(null);

  // Fetch Lyrics on Track Change
  useEffect(() => {
    if (!currentTrack) return;
    let isMounted = true;
    async function loadLyrics() {
      setIsLoadingLyrics(true);
      try {
        const data = await apiService.getLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration);
        if (isMounted) {
          setLyricsData(data);
        }
      } catch (err) {
        if (isMounted) setLyricsData(null);
      } finally {
        if (isMounted) setIsLoadingLyrics(false);
      }
    }
    loadLyrics();
    return () => { isMounted = false; };
  }, [currentTrack]);

  // Real-time Canvas Visualizer Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef?.current;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Fallback gentle idle wave when paused or unattached
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(10, Math.sin(Date.now() * 0.003 + i * 0.2) * 20 + 25);
        }
      }

      if (visualizerType === 'bars') {
        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;

          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.4)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 3, barHeight);

          x += barWidth;
        }
      } else if (visualizerType === 'wave') {
        ctx.lineWidth = 3;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#06b6d4');
        gradient.addColorStop(1, '#6366f1');
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255.0;
          const y = height / 2 + (v - 0.5) * height * 0.8;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    renderFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, visualizerType, analyserRef]);

  // Autoscroll Synced Lyrics
  useEffect(() => {
    if (activeTab !== 'lyrics' || !lyricsData?.syncedLyrics || !lyricsContainerRef.current) return;

    const lines = lyricsData.syncedLyrics;
    let activeIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex >= 0) {
      const activeEl = document.getElementById(`lyrics-line-${activeIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, activeTab, lyricsData]);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekClick = (e) => {
    if (!seekSliderRef.current || !duration) return;
    const rect = seekSliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(pct * duration);
  };

  return (
    <div className="fullscreen-player-container">
      {/* Top Bar with Tabs and Close */}
      <div className="fullscreen-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>

        {/* Tab Switcher (Visualizer vs Lyrics) */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', padding: '4px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('visualizer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'visualizer' ? 700 : 500,
              background: activeTab === 'visualizer' ? 'var(--accent-emerald)' : 'transparent',
              color: activeTab === 'visualizer' ? '#000' : 'var(--text-secondary)'
            }}
          >
            <Activity size={16} />
            <span>Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab('lyrics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'lyrics' ? 700 : 500,
              background: activeTab === 'lyrics' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'lyrics' ? '#000' : 'var(--text-secondary)'
            }}
          >
            <FileText size={16} />
            <span>Lyrics</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="fullscreen-top-add-playlist"
            onClick={() => { if (openAddToPlaylist) openAddToPlaylist(currentTrack); }}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
            title="Add to Playlist"
          >
            <FolderPlus size={19} />
          </button>

          <button
            onClick={onClose}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)'
            }}
            title="Minimize"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="fullscreen-center-stage" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0, padding: '0.5rem 1.5rem' }}>
        {/* VISUALIZER TAB */}
        {activeTab === 'visualizer' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: '1.25rem' }}>
            {/* Spinning Vinyl Cover Art - Perfect Complete Circle */}
            <div
              className="fullscreen-vinyl-disc"
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                flexShrink: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px var(--accent-emerald-glow)',
                border: '5px solid #081d53ff',
                animation: isPlaying ? 'spin 18s linear infinite' : 'none'
              }}
            >
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '50px',
                height: '50px',
                background: '#07090e',
                border: '3px solid #fff',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Disc size={20} color="var(--accent-emerald)" />
              </div>
            </div>

            {/* Audio Visualizer Spectrum Canvas */}
            <div className="fullscreen-spectrum-canvas-container" style={{ width: '100%', position: 'relative', flexShrink: 0 }}>
              <canvas
                ref={canvasRef}
                width={720}
                height={90}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}

        {/* LYRICS TAB */}
        {activeTab === 'lyrics' && (
          <div
            ref={lyricsContainerRef}
            style={{
              width: '100%',
              maxWidth: '680px',
              height: '100%',
              overflowY: 'auto',
              padding: '2rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              textAlign: 'center',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
            }}
          >
            {isLoadingLyrics ? (
              <div style={{ color: 'var(--text-muted)', margin: 'auto' }}>Fetching lyrics...</div>
            ) : lyricsData?.syncedLyrics?.length > 0 ? (
              lyricsData.syncedLyrics.map((line, idx) => {
                const isActive = currentTime >= line.time && (idx === lyricsData.syncedLyrics.length - 1 || currentTime < lyricsData.syncedLyrics[idx + 1].time);
                return (
                  <div
                    key={idx}
                    id={`lyrics-line-${idx}`}
                    onClick={() => seekTo(line.time)}
                    style={{
                      fontSize: isActive ? '1.85rem' : '1.3rem',
                      fontWeight: isActive ? 800 : 500,
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                      lineHeight: 1.4,
                      maxWidth: '600px'
                    }}
                  >
                    {line.text}
                  </div>
                );
              })
            ) : lyricsData?.plainLyrics ? (
              <div style={{ fontSize: '1.25rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                {lyricsData.plainLyrics}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', margin: 'auto' }}>
                No lyrics found for this track.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Track Controls Area */}
      <div className="fullscreen-bottom-controls-area" style={{ width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', zIndex: 10 }}>
        {/* Track Title and Artist */}
        <div className="fullscreen-track-info" style={{ textAlign: 'center' }}>
          <h2 className="fullscreen-track-title" style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{currentTrack.title}</h2>
          <p className="fullscreen-track-artist" style={{ color: 'var(--text-secondary)' }}>{currentTrack.artist}</p>
        </div>

        {/* Seek Bar */}
        <div className="seek-track-wrapper" style={{ maxWidth: '100%' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '45px', textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>

          <div
            ref={seekSliderRef}
            className="slider-container"
            onClick={handleSeekClick}
            style={{ height: '8px' }}
          >
            <div className="slider-progress" style={{ width: `${progressPercent}%` }}></div>
            <div className="slider-thumb" style={{ left: `${progressPercent}%`, width: '16px', height: '16px', opacity: 1 }}></div>
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '45px' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Large Media Control Buttons (Desktop only, on mobile the docked PlayerBar handles playback) */}
        <div className="fullscreen-desktop-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          <button 
            onClick={() => { if(openAddToPlaylist) openAddToPlaylist(currentTrack); }} 
            style={{ color: 'var(--text-muted)', transition: 'color 0.15s ease' }}
            title="Add to Playlist"
          >
            <FolderPlus size={22} />
          </button>

          <button onClick={toggleShuffle} style={{ color: shuffle ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            <Shuffle size={22} />
          </button>

          <button onClick={handlePrevTrack} style={{ color: 'var(--text-primary)' }}>
            <SkipBack size={28} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px var(--accent-emerald-glow)'
            }}
          >
            {isPlaying ? <Pause size={30} fill="#000" /> : <Play size={30} fill="#000" style={{ marginLeft: '4px' }} />}
          </button>

          <button onClick={() => handleNextTrack(false)} style={{ color: 'var(--text-primary)' }}>
            <SkipForward size={28} fill="currentColor" />
          </button>

          <button onClick={toggleRepeatMode} style={{ color: repeatMode !== 'off' ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}
