'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';
import type { ThemeMode } from '@/types';

interface HotkeyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeMode;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause stream' },
  { key: '→', desc: 'Seek forward 5 seconds' },
  { key: '←', desc: 'Seek backward 5 seconds' },
  { key: '↑', desc: 'Increase volume 5%' },
  { key: '↓', desc: 'Decrease volume 5%' },
  { key: 'M', desc: 'Toggle Mute / Unmute' },
  { key: 'F', desc: 'Toggle Studio Fullscreen' },
  { key: 'L', desc: 'Like / Heart current song' },
  { key: 'Shift + S', desc: 'Toggle Fair Shuffle' },
  { key: 'Shift + R', desc: 'Cycle Repeat (Off / All / One)' },
  { key: '?', desc: 'Open Shortcuts Cheat Sheet' },
  { key: 'Esc', desc: 'Close Fullscreen / Modal' },
];

export function HotkeyHelpModal({ isOpen, onClose, theme = 'dark' }: HotkeyHelpModalProps) {
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-lg p-6 sm:p-8 border shadow-2xl relative rounded-sm ${
            isDark ? 'bg-[#111114] border-neutral-700 text-white' : 'bg-white border-neutral-300 text-black'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Keyboard size={18} className="text-[#2563eb]" />
              <div>
                <h2 className="editorial-title text-2xl font-normal">Keyboard Shortcuts</h2>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  Quick Navigation &amp; Playback
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-current cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Shortcuts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {SHORTCUTS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded border border-neutral-200/60 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5"
              >
                <span className="text-xs font-mono text-neutral-400">{item.desc}</span>
                <kbd className="px-2 py-0.5 text-[11px] font-mono border rounded shadow-sm bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 font-bold">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
              Press <kbd className="px-1.5 py-0.2 border rounded text-[10px]">?</kbd> anytime to toggle this cheat sheet
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
