// Maina Discord Rich Presence (RPC) WebSocket Bridge Gateway
// Listens on ws://localhost:3020 and relays real-time playback state to Discord desktop client

import { WebSocketServer, WebSocket } from 'ws';
import type { DiscordRPCPayload } from '../src/types';

const CONFIG = {
  PORT: process.env.RPC_PORT || 3020,
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || '123456789012345678', // Replace with your Discord Application ID
};

let rpcClient: any = null;
let isRpcReady = false;

async function initDiscordRPC() {
  try {
    const { Client } = await import('discord-rpc');
    rpcClient = new Client({ transport: 'ipc' });

    rpcClient.on('ready', () => {
      isRpcReady = true;
      console.log(`[Maina RPC Gateway] Connected to Discord client as user: ${rpcClient.user?.username || 'Maina'}`);
    });

    rpcClient.login({ clientId: CONFIG.CLIENT_ID }).catch(() => {
      console.log('[Maina RPC Gateway] Note: Discord desktop client not detected or RPC not enabled. Logging to console only.');
      isRpcReady = false;
    });
  } catch {
    console.log('[Maina RPC Gateway] Note: discord-rpc module not loaded. Logging events to console.');
  }
}

initDiscordRPC();

const wss = new WebSocketServer({ port: Number(CONFIG.PORT) });

console.log('──────────────────────────────────────────────────────────');
console.log(`[Maina RPC Gateway] Online on ws://localhost:${CONFIG.PORT}`);
console.log(`[Maina RPC Gateway] Application ID: ${CONFIG.CLIENT_ID}`);
console.log('──────────────────────────────────────────────────────────');

wss.on('connection', (ws: WebSocket) => {
  console.log('[Maina RPC] Web client connected to gateway');

  ws.on('message', (data: Buffer) => {
    try {
      const message: DiscordRPCPayload = JSON.parse(data.toString());

      if (message.type === 'UPDATE' && message.data) {
        const { title, artist, album, duration, currentTime, isPlaying, coverUrl } = message.data;

        if (isPlaying) {
          console.log(`[Maina RPC] ▶ PLAYING: "${title}" by ${artist} [${formatTime(currentTime)} / ${formatTime(duration)}] (${album || 'Single'})`);

          if (isRpcReady && rpcClient) {
            const startTimestamp = Date.now() - Math.floor(currentTime || 0) * 1000;
            const endTimestamp = duration && duration > currentTime
              ? Date.now() + Math.floor(duration - currentTime) * 1000
              : undefined;

            rpcClient.setActivity({
              details: title ? title.slice(0, 128) : 'Listening to Music',
              state: artist ? artist.slice(0, 128) : 'Maina Audio Engine',
              startTimestamp,
              endTimestamp,
              largeImageKey: coverUrl || 'maina_logo',
              largeImageText: album ? album.slice(0, 128) : title,
              smallImageKey: 'play_icon',
              smallImageText: 'Playing on Maina',
              instance: false,
            }).catch((err: any) => {
              console.error('[Maina RPC] Failed to set activity:', err.message);
            });
          }
        } else {
          console.log(`[Maina RPC] ⏸ PAUSED: "${title}" by ${artist}`);
          if (isRpcReady && rpcClient) {
            rpcClient.clearActivity().catch(() => {});
          }
        }
      } else if (message.type === 'CLEAR') {
        console.log('[Maina RPC] ⏹ Cleared playback presence');
        if (isRpcReady && rpcClient) {
          rpcClient.clearActivity().catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('[Maina RPC] Payload parse error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('[Maina RPC] Web client disconnected');
  });

  ws.on('error', (err: Error) => {
    console.error('[Maina RPC] WebSocket client error:', err.message);
  });
});

function formatTime(secs: number) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
