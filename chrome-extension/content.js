/**
 * Maina Discord RPC — Chrome Extension Content Script
 * Injected into Maina web tabs to receive real-time playback updates and forward to the background worker.
 */

// Listen for window postMessage from Maina web player
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.type === 'MAINA_RPC_UPDATE') {
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_PLAYBACK',
        payload: event.data.payload,
      });
    } catch {
      // Extension context invalidated on reload
    }
  } else if (event.data && event.data.type === 'MAINA_RPC_CLEAR') {
    try {
      chrome.runtime.sendMessage({
        type: 'CLEAR_PLAYBACK',
      });
    } catch {}
  }
});

// Also listen for custom DOM events
window.addEventListener('maina-playback-update', (e) => {
  const customEvt = e;
  if (customEvt.detail) {
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_PLAYBACK',
        payload: customEvt.detail,
      });
    } catch {}
  }
});

// Announce presence capability to the web page
window.postMessage({ type: 'MAINA_EXTENSION_INSTALLED' }, '*');
