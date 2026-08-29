/**
 * Maina Discord RPC — Chrome Extension Background Service Worker
 * Manages WebSocket communication with Discord RPC Bridge and keeps track state.
 */

let ws = null;
let currentTrackState = null;
let isEnabled = true;

// Load persisted user preferences
chrome.storage.local.get(['discord_rpc_enabled'], (res) => {
  if (typeof res.discord_rpc_enabled === 'boolean') {
    isEnabled = res.discord_rpc_enabled;
  }
});

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket('ws://127.0.0.1:3020');

    ws.onopen = () => {
      console.log('[Maina Extension] Connected to Discord RPC Bridge (ws://127.0.0.1:3020)');
      if (currentTrackState && isEnabled) {
        sendUpdateToBridge(currentTrackState);
      }
    };

    ws.onclose = () => {
      ws = null;
      // Auto reconnect after 4 seconds
      setTimeout(connectWebSocket, 4000);
    };

    ws.onerror = () => {
      ws = null;
    };
  } catch (e) {
    ws = null;
  }
}

function sendUpdateToBridge(data) {
  if (!isEnabled) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'UPDATE',
        data,
      })
    );
  }
}

function sendClearToBridge() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'CLEAR' }));
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_PLAYBACK') {
    currentTrackState = message.payload;
    if (isEnabled) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
      sendUpdateToBridge(message.payload);
    }
    sendResponse({ status: 'OK' });
  } else if (message.type === 'CLEAR_PLAYBACK') {
    currentTrackState = null;
    sendClearToBridge();
    sendResponse({ status: 'OK' });
  } else if (message.type === 'GET_STATE') {
    sendResponse({
      track: currentTrackState,
      isConnected: ws !== null && ws.readyState === WebSocket.OPEN,
      isEnabled,
    });
  } else if (message.type === 'TOGGLE_ENABLED') {
    isEnabled = message.enabled;
    chrome.storage.local.set({ discord_rpc_enabled: isEnabled });
    if (!isEnabled) {
      sendClearToBridge();
    } else if (currentTrackState) {
      connectWebSocket();
      sendUpdateToBridge(currentTrackState);
    }
    sendResponse({ isEnabled });
  }
  return true;
});

// Initialize connection on load
connectWebSocket();
