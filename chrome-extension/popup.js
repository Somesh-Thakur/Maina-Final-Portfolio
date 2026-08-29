/**
 * Maina Discord RPC — Popup Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('status-badge');
  const coverImg = document.getElementById('cover-img');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const toggle = document.getElementById('rpc-toggle');

  // Request state from background service worker
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (!response) return;

    // 1. Connection status
    if (response.isConnected) {
      badge.textContent = 'Connected';
      badge.className = 'badge badge-connected';
    } else {
      badge.textContent = 'Bridge Idle';
      badge.className = 'badge badge-disconnected';
    }

    // 2. Toggle status
    toggle.checked = !!response.isEnabled;

    // 3. Track metadata
    if (response.track) {
      trackTitle.textContent = response.track.title || 'Untitled';
      trackArtist.textContent = response.track.artist || 'Unknown Artist';
      if (response.track.coverUrl) {
        coverImg.src = response.track.coverUrl;
      }
    }
  });

  // Handle toggle change
  toggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.runtime.sendMessage({
      type: 'TOGGLE_ENABLED',
      enabled: isChecked,
    });
  });
});
