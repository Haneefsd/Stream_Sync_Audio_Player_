/**
 * Time and formatting utilities for StreamSync Audio Player
 */

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function getSourceBadge(source) {
  return { label: 'HD Audio', className: 'badge-music' };
}

export function truncateText(text, maxLength = 35) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}
