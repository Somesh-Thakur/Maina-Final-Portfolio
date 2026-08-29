'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { Playlist, ThemeMode } from '@/types';

interface AIPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeMode;
  onPlaylistCreated?: (playlist: Playlist) => void;
}

const INSPIRATION_CHIPS = [
  '2000s Bollywood nostalgia meets Lo-Fi beats',
  'Late night cyberpunk synth drive with female vocals',
  'Monsoon acoustic coffeehouse with warm strings',
  'High-BPM gym workout phonk & energetic bass',
  'Deep meditation ambient soundscapes with rain',
];

export function AIPlaylistModal({
  isOpen,
  onClose,
  theme = 'dark',
  onPlaylistCreated,
}: AIPlaylistModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { customPlaylists } = usePlayerStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();
      if (json.status === 'SUCCESS' && json.data) {
        const newPlaylist: Playlist = json.data;
        usePlayerStore.setState({
          customPlaylists: [newPlaylist, ...customPlaylists],
        });
        if (onPlaylistCreated) {
          onPlaylistCreated(newPlaylist);
        }
        onClose();
      } else {
        setErrorMsg(json.message || 'Failed to generate playlist. Please try again.');
      }
    } catch {
      setErrorMsg('Network error while communicating with AI service.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`w-full max-w-xl p-6 sm:p-8 rounded-2xl border shadow-2xl relative ${
            isDark ? 'bg-[#0f0f14] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-black'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6">
            <div className="flex items-center gap-2.5">
              <Sparkles size={20} className="text-[#FF2D55]" />
              <div>
                <h2 className="editorial-title text-2xl">Bespoke AI Playlist Studio</h2>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  Generate Curated Audio Journeys from Any Prompt
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-current cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Textarea Input */}
          <div className="mb-4">
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">
              Describe your desired vibe or sonic world:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Atmospheric indie pop for rainy nights in Tokyo..."
              className={`w-full p-4 text-sm font-sans rounded-xl border transition-all resize-none focus:outline-none ${
                isDark
                  ? 'bg-neutral-900/60 border-neutral-700 text-white placeholder-neutral-500 focus:border-white'
                  : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
              }`}
            />
          </div>

          {/* Suggestion Chips */}
          <div className="mb-6">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-2">
              Or Try An Inspiration Prompt:
            </span>
            <div className="flex flex-wrap gap-2">
              {INSPIRATION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setPrompt(chip)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer text-left ${
                    isDark
                      ? 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-600 hover:text-white'
                      : 'border-neutral-200 bg-neutral-100/60 text-neutral-600 hover:border-neutral-400 hover:text-black'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* CTA Action */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full py-3.5 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !prompt.trim() || isGenerating
                ? 'opacity-50 cursor-not-allowed bg-neutral-700 text-neutral-400'
                : 'bg-white text-black hover:bg-neutral-200 shadow-xl'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>AI Weaving Master Playlist...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>Generate Playlist</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
