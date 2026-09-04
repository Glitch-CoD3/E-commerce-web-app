function formatRelativeTime(dateString) {
  const created = new Date(dateString);
  const now = new Date();

  // Invalid date
  if (isNaN(created.getTime())) {
    return 'Invalid date';
  }

  const diffMs = now.getTime() - created.getTime();

  // Future date
  if (diffMs < 0) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(days / 365);

  return `${years} year${years !== 1 ? 's' : ''} ago`;
}


export {
    formatRelativeTime
}