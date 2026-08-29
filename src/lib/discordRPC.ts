import { DiscordRPCPayload } from '@/types';

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

class DiscordRPCClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private baseDelay = 1000;
  private maxDelay = 8000;
  private isManuallyClosed = false;
  private state: ConnectionState = 'disconnected';

  connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isManuallyClosed = false;
    this.state = this.reconnectAttempts > 0 ? 'reconnecting' : 'disconnected';

    try {
      this.ws = new WebSocket('ws://localhost:3020');

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
        if (!this.isManuallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.state = 'disconnected';
        if (this.ws) {
          try {
            this.ws.close();
          } catch {}
        }
      };
    } catch {
      this.state = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isManuallyClosed || this.reconnectTimer) return;

    // Exponential backoff with jitter up to maxDelay (8s)
    const exp = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts), this.maxDelay);
    const jitter = Math.random() * 500;
    const delay = exp + jitter;
    this.reconnectAttempts++;
    this.state = 'reconnecting';

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
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
