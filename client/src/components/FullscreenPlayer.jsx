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
    openAddToPlaylist,
    showRemainingTime,
    toggleRemainingTime
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState('visualizer'); // 'visualizer' | 'lyrics'
  const [lyricsData, setLyricsData] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const seekSliderRef = useRef(null);

  // Smooth amplitude multiplier (1 when playing, 0 when paused) & animation state
  const animAmpRef = useRef(isPlaying ? 1 : 0);
  const phaseRef = useRef(0);
  const smoothBassRef = useRef(0.5);
  const smoothMidRef = useRef(0.5);
  const smoothTrebleRef = useRef(0.5);

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

  // Real-time Canvas Visualizer Loop: Intertwined Glowing Harmonic Waves
  useEffect(() => {
    if (activeTab !== 'visualizer') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef?.current;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);
    let lastTime = performance.now();

    const renderFrame = (now) => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth amplitude transition: ease into waves when playing (1), ease into straight line when paused (0)
      const targetAmp = isPlaying ? 1.0 : 0.0;
      animAmpRef.current += (targetAmp - animAmpRef.current) * 0.09;
      if (Math.abs(animAmpRef.current - targetAmp) < 0.002) {
        animAmpRef.current = targetAmp;
      }

      // Continuous phase advancement
      if (isPlaying || animAmpRef.current > 0.01) {
        phaseRef.current += dt * 2.6;
      }
      const phase = phaseRef.current;
      const currentAmp = animAmpRef.current;

      // Extract frequency bins or synthesize lively audio dynamics
      let targetBass = 0.5;
      let targetMid = 0.5;
      let targetTreble = 0.5;

      if (analyser && isPlaying) {
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        let sumBass = 0, countBass = 0;
        let sumMid = 0, countMid = 0;
        let sumTreble = 0, countTreble = 0;

        const maxIdx = Math.min(bufferLength, 64);
        for (let i = 0; i < maxIdx; i++) {
          const val = dataArray[i] / 255;
          if (i < 8) {
            sumBass += val;
            countBass++;
          } else if (i < 24) {
            sumMid += val;
            countMid++;
          } else {
            sumTreble += val;
            countTreble++;
          }
        }

        const rawBass = countBass ? sumBass / countBass : 0;
        const rawMid = countMid ? sumMid / countMid : 0;
        const rawTreble = countTreble ? sumTreble / countTreble : 0;

        if (rawBass > 0.02 || rawMid > 0.02 || rawTreble > 0.02) {
          targetBass = 0.35 + rawBass * 1.1;
          targetMid = 0.35 + rawMid * 1.1;
          targetTreble = 0.35 + rawTreble * 1.1;
        } else {
          // Synthetic audio rhythm in headless/carrier fallback mode
          targetBass = 0.55 + 0.32 * Math.sin(phase * 0.9);
          targetMid = 0.52 + 0.34 * Math.sin(phase * 1.25 + 1.2);
          targetTreble = 0.5 + 0.3 * Math.cos(phase * 1.55 + 2.2);
        }
      } else if (isPlaying) {
        targetBass = 0.55 + 0.32 * Math.sin(phase * 0.9);
        targetMid = 0.52 + 0.34 * Math.sin(phase * 1.25 + 1.2);
        targetTreble = 0.5 + 0.3 * Math.cos(phase * 1.55 + 2.2);
      }

      // Smooth audio dynamics
      smoothBassRef.current += (targetBass - smoothBassRef.current) * 0.15;
      smoothMidRef.current += (targetMid - smoothMidRef.current) * 0.15;
      smoothTrebleRef.current += (targetTreble - smoothTrebleRef.current) * 0.15;

      const bassAmp = smoothBassRef.current;
      const midAmp = smoothMidRef.current;
      const trebleAmp = smoothTrebleRef.current;

      const baseMaxAmp = height * 0.18;

      // WHEN PAUSED (currentAmp === 0): Show the straight glowing line
      if (currentAmp === 0) {
        ctx.save();
        ctx.lineWidth = 2.4;

        const straightGrad = ctx.createLinearGradient(0, 0, width, 0);
        straightGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        straightGrad.addColorStop(0.2, 'rgba(6, 182, 212, 0.85)');
        straightGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.95)');
        straightGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.85)');
        straightGrad.addColorStop(1, 'rgba(168, 85, 247, 0.35)');

        ctx.strokeStyle = straightGrad;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.85)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // WHEN PLAYING (or transitioning): Render the 3 intertwined harmonic waves with generous vertical gaps!
      // Notice: spreadGap separates the baseline of the top wave, middle wave, and bottom wave when playing!
      const waves = [
        {
          // Emerald Green / Mint wave (Upper Tier)
          color: '#10b981',
          shadowColor: 'rgba(16, 185, 129, 0.95)',
          shadowBlur: 12,
          lineWidth: 2.2,
          calcY: (normX, env, spreadGap) => {
            const offset = -spreadGap;
            const h1 = Math.sin(normX * 6.28 * 0.92 + phase * 0.95);
            const h2 = Math.sin(normX * 6.28 * 1.95 - phase * 0.65 + 0.6);
            return offset + (h1 * 0.72 + h2 * 0.28) * env * baseMaxAmp * bassAmp * currentAmp;
          }
        },
        {
          // Electric Cyan / Sky Blue wave (Center Tier)
          color: '#06b6d4',
          shadowColor: 'rgba(6, 182, 212, 0.95)',
          shadowBlur: 14,
          lineWidth: 2.4,
          calcY: (normX, env, spreadGap) => {
            const offset = 0;
            const h1 = Math.sin(normX * 6.28 * 1.38 - phase * 1.15 + 1.7);
            const h2 = Math.cos(normX * 6.28 * 2.45 + phase * 0.85);
            return offset + (h1 * 0.68 + h2 * 0.32) * env * baseMaxAmp * midAmp * currentAmp;
          }
        },
        {
          // Neon Purple / Violet wave (Lower Tier)
          color: '#a855f7',
          shadowColor: 'rgba(168, 85, 247, 0.95)',
          shadowBlur: 12,
          lineWidth: 2.2,
          calcY: (normX, env, spreadGap) => {
            const offset = spreadGap;
            const h1 = Math.sin(normX * 6.28 * 1.08 + phase * 0.82 + 3.14);
            const h2 = Math.sin(normX * 6.28 * 2.75 - phase * 0.95 + 1.25);
            return offset + (h1 * 0.65 + h2 * 0.35) * env * baseMaxAmp * trebleAmp * currentAmp;
          }
        }
      ];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const step = 2; // High precision sampling for silky curves
      waves.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.shadowColor = w.shadowColor;
        ctx.shadowBlur = w.shadowBlur;
        ctx.lineWidth = w.lineWidth;

        for (let x = 0; x <= width; x += step) {
          const normX = x / width;
          // Smooth Hann envelope: tapers to 0 at edges, peaks at center
          const env = Math.pow(Math.sin(normX * Math.PI), 1.4);
          // Vertical gap between adjacent tiers in the center
          const spreadGap = height * 0.16 * env * currentAmp;
          const y = centerY + w.calcY(normX, env, spreadGap);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      ctx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, activeTab, analyserRef]);

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

  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const getTargetTimeFromEvent = (e) => {
    if (!seekSliderRef.current || !duration) return 0;
    const rect = seekSliderRef.current.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    return pct * duration;
  };

  const handleSeekClick = (e) => {
    const target = getTargetTimeFromEvent(e);
    seekTo(target);
  };

  const handleSeekStart = (e) => {
    if (!duration) return;
    setIsDragging(true);
    const target = getTargetTimeFromEvent(e);
    setDragTime(target);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const target = getTargetTimeFromEvent(e);
      setDragTime(target);
    };

    const handleEnd = (e) => {
      setIsDragging(false);
      const target = getTargetTimeFromEvent(e);
      seekTo(target);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, duration, seekTo]);

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
                animation: 'spin 20s linear infinite',
                animationPlayState: isPlaying ? 'running' : 'paused'
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
                width: '48px',
                height: '48px',
                background: '#07090e',
                border: '2.5px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 0, 0, 0.9), inset 0 0 10px rgba(0, 0, 0, 0.95)'
              }}>
                <Disc size={20} color="var(--accent-emerald)" />
              </div>
            </div>

            {/* Audio Visualizer Spectrum Canvas */}
            <div className="fullscreen-spectrum-canvas-container" style={{ width: '100%', position: 'relative', flexShrink: 0 }}>
              <canvas
                ref={canvasRef}
                width={850}
                height={120}
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
        {(() => {
          const displayTime = isDragging ? dragTime : currentTime;
          const displayPercent = duration > 0 ? (displayTime / duration) * 100 : 0;
          return (
            <div className="seek-track-wrapper" style={{ maxWidth: '100%' }}>
              <span style={{ fontSize: '0.85rem', color: isDragging ? 'var(--accent-emerald)' : 'var(--text-muted)', width: '45px', textAlign: 'right', fontWeight: isDragging ? 700 : 400 }}>
                {formatTime(displayTime)}
              </span>

              <div
                ref={seekSliderRef}
                className="slider-container"
                onClick={handleSeekClick}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                style={{ height: '8px', cursor: 'pointer' }}
              >
                <div className="slider-progress" style={{ width: `${displayPercent}%` }}></div>
                <div 
                  className="slider-thumb" 
                  style={{ 
                    left: `${displayPercent}%`, 
                    width: '16px', 
                    height: '16px', 
                    opacity: 1,
                    transform: isDragging ? 'translate(-50%, -50%) scale(1.4)' : undefined,
                    background: isDragging ? 'var(--accent-emerald)' : undefined,
                    boxShadow: isDragging ? '0 0 12px var(--accent-emerald-glow)' : undefined
                  }}
                ></div>
              </div>

              <span
                className="seek-time-toggle"
                onClick={toggleRemainingTime}
                style={{
                  fontSize: '0.85rem',
                  color: showRemainingTime ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  minWidth: '48px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontWeight: showRemainingTime ? 600 : 400,
                  transition: 'color 0.15s ease'
                }}
                title={showRemainingTime ? "Remaining time left (Click to display total duration)" : "Total song duration (Click to display remaining time left)"}
              >
                {showRemainingTime ? `-${formatTime(Math.max(0, (duration || 0) - displayTime))}` : formatTime(duration)}
              </span>
            </div>
          );
        })()}

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
