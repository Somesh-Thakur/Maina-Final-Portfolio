import { DiscordRPCPayload } from '@/types';

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

class DiscordRPCClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 1; // Do not spam browser console
  private isManuallyClosed = false;
  private state: ConnectionState = 'disconnected';

  connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Only attempt local websocket bridge if explicitly requested or on localhost
    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocalhost && this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.state = 'disconnected';
      return;
    }

    this.isManuallyClosed = false;

    try {
      this.ws = new WebSocket('ws://127.0.0.1:3020');

      this.ws.onopen = () => {
        this.state = 'connected';
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onclose = () => {
        this.state = 'disconnected';
        this.ws = null;
        // Do not auto-reconnect in loop
      };

      this.ws.onerror = () => {
        this.state = 'disconnected';
        if (this.ws) {
          try {
            this.ws.close();
          } catch {}
          this.ws = null;
        }
      };
    } catch {
      this.state = 'disconnected';
      this.ws = null;
    }
  }

  disconnect(): void {
    this.isManuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.state = 'disconnected';
  }

  getConnectionState(): ConnectionState {
    return this.state;
  }

  sendUpdate(data: DiscordRPCPayload['data']): void {
    // 1. Dispatch event to Chrome Extension content script
    if (typeof window !== 'undefined') {
      try {
        window.postMessage({ type: 'MAINA_RPC_UPDATE', payload: data }, '*');
        window.dispatchEvent(new CustomEvent('maina-playback-update', { detail: data }));
      } catch {}
    }

    // 2. Send via native WebSocket to local bridge if open
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const { currentTime, duration, isPlaying } = data;
        const now = Date.now();

        const payload = {
          type: 'UPDATE',
          data: {
            ...data,
            startTimestamp: isPlaying ? Math.floor(now - (currentTime || 0) * 1000) : undefined,
            endTimestamp:
              isPlaying && duration && duration > (currentTime || 0)
                ? Math.floor(now + (duration - (currentTime || 0)) * 1000)
                : undefined,
          },
        };

        this.ws.send(JSON.stringify(payload));
      } catch {
        // Silent failure
      }
    }
  }

  sendClear(): void {
    // 1. Dispatch event to Chrome Extension content script
    if (typeof window !== 'undefined') {
      try {
        window.postMessage({ type: 'MAINA_RPC_CLEAR' }, '*');
      } catch {}
    }

    // 2. Send via native WebSocket to local bridge if open
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'CLEAR' }));
      } catch {
        // Silent failure
      }
    }
  }
}

export const discordRPC = new DiscordRPCClient();
