'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { audioAnalyser } from '@/lib/audioAnalyser';
import { audioFX } from '@/lib/audioFX';
import { offlineStorage } from '@/lib/offlineStorage';
import { extractColors } from '@/lib/colorExtractor';
import { discordRPC } from '@/lib/discordRPC';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Sparkles } from 'lucide-react';
import type { Track } from '@/types';

export function AudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextBufferAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTimeRef = useRef(0);
  const prefetchSet = useRef(new Set<string>());
  const analyserInitialized = useRef(false);
  const retryCountRef = useRef(0);
  const isHydratedRef = useRef(false);
  const aiRadioFetchingRef = useRef(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const history = usePlayerStore((s) => s.history);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const savedCurrentTime = usePlayerStore((s) => s.currentTime);

  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Connect Discord RPC on mount
  useEffect(() => {
    discordRPC.connect();
    return () => {
      discordRPC.disconnect();
    };
  }, []);

  // Sync track source + check offline IndexedDB cache + extract ambient colors
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const setupTrack = async () => {
      if (!audioRef.current || !currentTrack) return;

      // Check if track is cached in IndexedDB
      const offlineBlobUrl = await offlineStorage.getOfflineTrackBlobUrl(currentTrack.id);
      const effectiveSrc = offlineBlobUrl || currentTrack.audioUrl;

      audioRef.current.src = effectiveSrc;
      audioRef.current.load();
      extractColors(currentTrack.coverUrl);
      prefetchSet.current.clear();
      retryCountRef.current = 0;

      // Restore saved currentTime on initial hydration once
      if (!isHydratedRef.current && savedCurrentTime > 0) {
        audioRef.current.currentTime = savedCurrentTime;
        lastTimeRef.current = savedCurrentTime;
        isHydratedRef.current = true;
      } else {
        lastTimeRef.current = 0;
      }
    };

    setupTrack();
  }, [currentTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause state & initialize Web Audio Analyser + AudioFX DSP
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!analyserInitialized.current && audioRef.current) {
              audioAnalyser.initAnalyser(audioRef.current);
              audioFX.init(audioRef.current);
              analyserInitialized.current = true;
            }
            audioAnalyser.resumeContext();
            audioFX.resume();
          })
          .catch((err) => {
            // Isolate browser autoplay restrictions (NotAllowedError)
            if (err.name === 'NotAllowedError') {
              console.warn('[AudioController] Autoplay restricted by browser. Waiting for user interaction.');
              usePlayerStore.setState({ isPlaying: false });
            }
          });
      }
    } else {
      audioRef.current.pause();
    }

    updateDiscordRPC();
  }, [isPlaying, currentTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle seek from store
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state, prevState) => {
      if (!audioRef.current) return;
      const diff = Math.abs(state.currentTime - prevState.currentTime);
      if (diff > 1.5 && Math.abs(state.currentTime - lastTimeRef.current) > 1) {
        audioRef.current.currentTime = state.currentTime;
        lastTimeRef.current = state.currentTime;
      }
    });
    return unsubscribe;
  }, []);

  const updateDiscordRPC = useCallback(() => {
    const track = usePlayerStore.getState().currentTrack;
    const playing = usePlayerStore.getState().isPlaying;
    const dur = audioRef.current?.duration || 0;
    const curr = audioRef.current?.currentTime || 0;

    if (track) {
      discordRPC.sendUpdate({
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: dur,
        currentTime: curr,
        isPlaying: playing,
        coverUrl: track.coverUrl,
      });
    } else {
      discordRPC.sendClear();
    }
  }, []);

  // Smart "Vibe DJ" queue auto-refiller when queue has <= 1 track
  const checkAutoRefillQueue = useCallback(async () => {
    const state = usePlayerStore.getState();
    if (state.queue.length <= 1 && !aiRadioFetchingRef.current && state.currentTrack) {
      aiRadioFetchingRef.current = true;
      try {
        const seedTracks = [state.currentTrack, ...state.history.slice(0, 2)];
        const res = await fetch('/api/ai/radio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seedTracks }),
        });
        const json = await res.json();
        if (json.status === 'SUCCESS' && Array.isArray(json.data) && json.data.length > 0) {
          json.data.forEach((rec: Track) => {
            // Avoid adding duplicates of current track
            if (rec.id !== state.currentTrack?.id) {
              addToQueue(rec);
            }
          });
        }
      } catch (err) {
        console.error('AI Radio queue auto-fill error:', err);
      } finally {
        aiRadioFetchingRef.current = false;
      }
    }
  }, [addToQueue]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration;

    // Throttle store updates
    if (Math.abs(current - lastTimeRef.current) > 0.5) {
      setCurrentTime(current);
      lastTimeRef.current = current;
    }

    // Gapless preloading & Auto-refill at 80%
    if (dur > 0 && current > dur * 0.8) {
      checkAutoRefillQueue();

      if (queue.length > 0) {
        const nextInQueue = queue[0];
        if (nextInQueue && !prefetchSet.current.has(nextInQueue.id)) {
          prefetchSet.current.add(nextInQueue.id);
          if (nextBufferAudioRef.current) {
            nextBufferAudioRef.current.src = nextInQueue.audioUrl;
            nextBufferAudioRef.current.preload = 'auto';
            nextBufferAudioRef.current.load();
          }
        }
      }
    }
  }, [queue, setCurrentTime, checkAutoRefillQueue]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    const { repeatMode } = usePlayerStore.getState();
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setCurrentTime(0);
      return;
    }
    nextTrack();
  }, [nextTrack, setCurrentTime]);

  const handleCanPlay = useCallback(() => {
    if (usePlayerStore.getState().isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Robust Error Handling with Bitrate Fallback & Auto-Skip
  const handleError = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    console.warn(`[AudioController] Playback error on "${currentTrack.title}" (${currentTrack.audioUrl})`);

    // Soft retry 1: Swap 320kbps to 160kbps fallback
    if (retryCountRef.current < 1) {
      retryCountRef.current++;
      let fallbackUrl = currentTrack.audioUrl;

      if (fallbackUrl.includes('_320.mp4')) {
        fallbackUrl = fallbackUrl.replace('_320.mp4', '_160.mp4');
      } else if (fallbackUrl.includes('_160.mp4')) {
        fallbackUrl = fallbackUrl.replace('_160.mp4', '_96.mp4');
      } else {
        fallbackUrl = `${fallbackUrl}?t=${Date.now()}`;
      }

      console.log(`[AudioController] Attempting fallback retry (attempt ${retryCountRef.current}): ${fallbackUrl}`);

      setTimeout(() => {
        if (audioRef.current && currentTrack) {
          audioRef.current.src = fallbackUrl;
          audioRef.current.load();
          if (usePlayerStore.getState().isPlaying) {
            audioRef.current.play().catch(() => {});
          }
        }
      }, 1000);
      return;
    }

    // Permanent Failure after retry
    showToast(`Stream unavailable for "${currentTrack.title}", skipping to next track...`);

    const { queue } = usePlayerStore.getState();
    if (queue.length > 0) {
      setTimeout(() => {
        nextTrack();
      }, 1500);
    } else {
      usePlayerStore.setState({ isPlaying: false });
    }
  }, [currentTrack, nextTrack, showToast]);

  const handleStalled = useCallback(() => {
    console.warn('[AudioController] Stream stalled. Checking buffer...');
  }, []);

  const handleAbort = useCallback(() => {
    console.log('[AudioController] Stream swapped.');
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onStalled={handleStalled}
        onAbort={handleAbort}
        className="hidden"
      />

      {/* Secondary buffer element for gapless playback transitions */}
      <audio ref={nextBufferAudioRef} crossOrigin="anonymous" preload="none" className="hidden" />

      {/* Floating Error Recovery Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] max-w-md px-4 py-2.5 bg-neutral-900/95 border border-red-500/40 text-red-300 rounded-sm shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-mono"
          >
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
