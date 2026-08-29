/**
 * Adaptive Responsive Document Picture-in-Picture (PiP) Engine for Maina
 * Automatically shifts layout between Compact / Standard / Expanded Studio modes
 * with live track sync, interactive seekbar, volume controls, and mini audio visualizer.
 */

import { usePlayerStore } from '@/stores/usePlayerStore';

let pipWindow: Window | null = null;

export async function openDocumentPiP(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const dPiP = (window as any).documentPictureInPicture;

  if (!dPiP || typeof dPiP.requestWindow !== 'function') {
    console.warn('[PiP] Document Picture-in-Picture API not supported on this browser.');
    return false;
  }

  // If already open, focus it
  if (pipWindow && !pipWindow.closed) {
    pipWindow.focus();
    return true;
  }

  try {
    pipWindow = await dPiP.requestWindow({
      width: 380,
      height: 460,
    });

    if (!pipWindow) return false;

    // Inject base reset and responsive layout styles
    const styleEl = pipWindow.document.createElement('style');
    styleEl.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        user-select: none;
      }
      body {
        background-color: #0a0a0c;
        color: #f0f0f0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
        overflow: hidden;
        width: 100vw;
        height: 100vh;
      }
      #pip-root {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px;
        background: radial-gradient(circle at 50% 20%, #171722 0%, #0a0a0c 85%);
        transition: all 0.2s ease;
      }

      /* Mode: Compact / Micro (< 320px width or < 180px height) */
      .mode-compact #pip-root {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        gap: 12px;
      }
      .mode-compact .pip-badge,
      .mode-compact .pip-seekbar,
      .mode-compact .pip-volume,
      .mode-compact .pip-visualizer-box {
        display: none !important;
      }
      .mode-compact .pip-artwork {
        width: 44px !important;
        height: 44px !important;
        border-radius: 4px;
      }
      .mode-compact .pip-meta {
        flex: 1;
        text-align: left;
      }
      .mode-compact .pip-controls {
        gap: 8px !important;
      }

      /* Mode: Expanded / Studio (>= 480px width) */
      .mode-expanded #pip-root {
        flex-direction: row;
        align-items: center;
        gap: 24px;
        padding: 24px;
      }
      .mode-expanded .pip-left-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-shrink: 0;
      }
      .mode-expanded .pip-right-col {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1;
        gap: 12px;
        min-width: 0;
      }
      .mode-expanded .pip-meta {
        text-align: left;
      }

      /* Interactive Elements */
      button {
        outline: none;
        cursor: pointer;
        transition: transform 0.1s ease, opacity 0.2s ease;
      }
      button:active {
        transform: scale(0.92);
      }
      .pip-btn {
        background: #1e1e24;
        border: 1px solid #33333e;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pip-play-btn {
        background: #ffffff;
        border: none;
        color: #000000;
        font-weight: bold;
      }
      .pip-slider {
        accent-color: #ffffff;
        cursor: pointer;
      }

      /* Live Visualizer Bars */
      .viz-bar {
        width: 3px;
        background: #ffffff;
        border-radius: 1px;
        animation: vizJump 0.6s ease infinite alternate;
      }
      @keyframes vizJump {
        0% { height: 4px; }
        100% { height: 16px; }
      }
    `;
    pipWindow.document.head.appendChild(styleEl);

    renderAdaptivePiP(pipWindow);

    pipWindow.addEventListener('pagehide', () => {
      pipWindow = null;
    });

    return true;
  } catch (err) {
    console.error('[PiP] Failed to open Document PiP window:', err);
    return false;
  }
}

function renderAdaptivePiP(w: Window) {
  const doc = w.document;
  const root = doc.createElement('div');
  root.id = 'pip-root';
  doc.body.appendChild(root);

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getLayoutMode = (width: number, height: number) => {
    if (width < 320 || height < 180) return 'mode-compact';
    if (width >= 480 && height >= 200) return 'mode-expanded';
    return 'mode-standard';
  };

  const syncLayoutMode = () => {
    const mode = getLayoutMode(w.innerWidth, w.innerHeight);
    doc.body.className = mode;
  };

  // Resize listener
  w.addEventListener('resize', syncLayoutMode);
  syncLayoutMode();

  const updateUI = () => {
    const state = usePlayerStore.getState();
    const track = state.currentTrack;

    if (!track) {
      root.innerHTML = `
        <div style="margin: auto; opacity: 0.5; font-size: 12px; font-family: monospace; letter-spacing: 1px;">
          NO ACTIVE STREAM
        </div>
      `;
      return;
    }

    const mode = getLayoutMode(w.innerWidth, w.innerHeight);

    if (mode === 'mode-compact') {
      // Compact Micro Layout
      root.innerHTML = `
        <img src="${track.coverUrl}" class="pip-artwork" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px; border: 1px solid #333;" />
        <div class="pip-meta" style="min-width: 0; overflow: hidden; margin: 0 8px;">
          <div style="font-size: 13px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
          <div style="font-size: 10px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace;">${track.artist}</div>
        </div>
        <div class="pip-controls" style="display: flex; align-items: center; gap: 8px;">
          <button id="pip-play" class="pip-btn pip-play-btn" style="width: 38px; height: 38px; font-size: 14px;">${state.isPlaying ? '⏸' : '▶'}</button>
          <button id="pip-next" class="pip-btn" style="width: 32px; height: 32px; font-size: 11px;">⏭</button>
        </div>
      `;
    } else if (mode === 'mode-expanded') {
      // Expanded Studio Layout (Horizontal Side-by-Side)
      root.innerHTML = `
        <div class="pip-left-col">
          <img src="${track.coverUrl}" class="pip-artwork" style="width: 140px; height: 140px; border-radius: 6px; object-fit: cover; border: 1px solid #333; box-shadow: 0 10px 25px rgba(0,0,0,0.6);" />
          <div style="display: flex; gap: 3px; height: 16px; align-items: flex-end; margin-top: 10px;" class="pip-visualizer-box">
            <div class="viz-bar" style="animation-delay: 0.1s"></div>
            <div class="viz-bar" style="animation-delay: 0.3s"></div>
            <div class="viz-bar" style="animation-delay: 0.2s"></div>
            <div class="viz-bar" style="animation-delay: 0.4s"></div>
            <div class="viz-bar" style="animation-delay: 0.15s"></div>
          </div>
        </div>

        <div class="pip-right-col">
          <div class="pip-badge" style="font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #FF2D55; font-family: monospace; font-weight: bold;">
            MAINA STUDIO // 320 KBPS
          </div>
          <div class="pip-meta">
            <div style="font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
            <div style="font-size: 11px; color: #999; font-family: monospace; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.artist}</div>
          </div>

          <!-- Progress Seekbar -->
          <div class="pip-seekbar" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; font-size: 9px; font-family: monospace; color: #777; margin-bottom: 4px;">
              <span>${formatTime(state.currentTime)}</span>
              <span>${formatTime(state.duration)}</span>
            </div>
            <input id="pip-seek" class="pip-slider" type="range" min="0" max="${state.duration || 100}" value="${state.currentTime || 0}" style="width: 100%; height: 3px;" />
          </div>

          <!-- Transport Controls -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <button id="pip-prev" class="pip-btn" style="width: 32px; height: 32px; font-size: 12px;">⏮</button>
              <button id="pip-play" class="pip-btn pip-play-btn" style="width: 40px; height: 40px; font-size: 16px;">${state.isPlaying ? '⏸' : '▶'}</button>
              <button id="pip-next" class="pip-btn" style="width: 32px; height: 32px; font-size: 12px;">⏭</button>
            </div>

            <!-- Volume Slider -->
            <div class="pip-volume" style="display: flex; align-items: center; gap: 6px;">
              <button id="pip-mute" style="background: none; border: none; color: #888; font-size: 12px;">${state.isMuted ? '🔇' : '🔊'}</button>
              <input id="pip-vol" class="pip-slider" type="range" min="0" max="1" step="0.05" value="${state.isMuted ? 0 : state.volume}" style="width: 60px; height: 3px;" />
            </div>
          </div>
        </div>
      `;
    } else {
      // Standard Layout (Vertical Center Stack)
      root.innerHTML = `
        <div class="pip-badge" style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #888; text-align: center; font-family: monospace;">
          MAINA // PIP DOCK
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%;">
          <img src="${track.coverUrl}" class="pip-artwork" style="width: 150px; height: 150px; border-radius: 6px; object-fit: cover; border: 1px solid #333; box-shadow: 0 10px 25px rgba(0,0,0,0.7);" />
          <div class="pip-meta" style="text-align: center; width: 100%; overflow: hidden;">
            <div style="font-size: 15px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
            <div style="font-size: 11px; color: #aaa; font-family: monospace; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.artist}</div>
          </div>
        </div>

        <!-- Progress Seekbar -->
        <div class="pip-seekbar" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; font-size: 9px; font-family: monospace; color: #777; margin-bottom: 4px;">
            <span>${formatTime(state.currentTime)}</span>
            <span>${formatTime(state.duration)}</span>
          </div>
          <input id="pip-seek" class="pip-slider" type="range" min="0" max="${state.duration || 100}" value="${state.currentTime || 0}" style="width: 100%; height: 3px;" />
        </div>

        <!-- Transport Controls -->
        <div class="pip-controls" style="display: flex; gap: 16px; align-items: center; justify-content: center;">
          <button id="pip-prev" class="pip-btn" style="width: 36px; height: 36px; font-size: 13px;">⏮</button>
          <button id="pip-play" class="pip-btn pip-play-btn" style="width: 44px; height: 44px; font-size: 16px;">${state.isPlaying ? '⏸' : '▶'}</button>
          <button id="pip-next" class="pip-btn" style="width: 36px; height: 36px; font-size: 13px;">⏭</button>
        </div>
      `;
    }

    // Attach Interactive Event Listeners
    doc.getElementById('pip-prev')?.addEventListener('click', () => state.prevTrack());
    doc.getElementById('pip-play')?.addEventListener('click', () => state.togglePlay());
    doc.getElementById('pip-next')?.addEventListener('click', () => state.nextTrack());
    doc.getElementById('pip-mute')?.addEventListener('click', () => state.toggleMute());

    const seekEl = doc.getElementById('pip-seek') as HTMLInputElement | null;
    if (seekEl) {
      seekEl.addEventListener('input', (e: any) => {
        state.seekTo(Number(e.target.value));
      });
    }

    const volEl = doc.getElementById('pip-vol') as HTMLInputElement | null;
    if (volEl) {
      volEl.addEventListener('input', (e: any) => {
        state.setVolume(Number(e.target.value));
      });
    }
  };

  updateUI();

  // Subscribe to store updates with throttling check
  usePlayerStore.subscribe(() => {
    if (!w.closed) updateUI();
  });
}
