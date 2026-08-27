/**
 * Time and formatting utilities
 */

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function getSourceBadge(source) {
  switch (source?.toLowerCase()) {
    case 'jiosaavn':
      return { label: 'JioSaavn 320k', className: 'badge-jiosaavn' };
    case 'youtube':
      return { label: 'YouTube', className: 'badge-youtube' };
    case 'spotify':
      return { label: 'Spotify', className: 'badge-spotify' };
    default:
      return { label: source || 'Stream', className: 'badge-jiosaavn' };
  }
}

export function truncateText(text, maxLength = 35) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}
