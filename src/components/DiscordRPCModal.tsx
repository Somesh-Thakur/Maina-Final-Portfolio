'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Radio, Check, Copy, ExternalLink, HelpCircle } from 'lucide-react';
import type { ThemeMode } from '@/types';

interface DiscordRPCModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeMode;
}

export function DiscordRPCModal({ isOpen, onClose, theme = 'dark' }: DiscordRPCModalProps) {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    // Link to GitHub repo folder or raw file archive
    const zipUrl = 'https://github.com/Somesh-Thakur/Maina-Final-Portfolio/archive/refs/heads/main.zip';
    window.open(zipUrl, '_blank');
    setTimeout(() => setIsDownloading(false), 1500);
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                <Radio size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="editorial-title text-2xl font-normal">Discord Rich Presence</h2>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  Chrome Extension &amp; Activity Broadcast
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-current cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Intro Card */}
          <div className="p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-100/50 dark:bg-neutral-900/40 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="font-semibold text-sm">Maina Companion Extension</div>
              <div className="font-mono text-xs text-neutral-500 mt-0.5">
                Broadcast track title, artist, album art &amp; live timer on Discord.
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
            >
              <Download size={14} />
              <span>{isDownloading ? 'Opening...' : 'Download Extension'}</span>
            </button>
          </div>

          {/* 3-Step Installation Guide */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="text-xs font-mono uppercase tracking-widest text-[#FF2D55] font-bold">
              3-Step Installation Guide
            </div>

            {/* Step 1 */}
            <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-black/5 dark:bg-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-neutral-700 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold">Open Extensions Page</div>
                <div className="text-[11px] font-mono text-neutral-400 mt-1 flex items-center gap-2">
                  <code className="px-2 py-0.5 bg-black/40 rounded border border-neutral-700 select-all">
                    chrome://extensions
                  </code>
                  <button
                    onClick={() => copyToClipboard('chrome://extensions', 'step1')}
                    className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedStep === 'step1' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-black/5 dark:bg-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-neutral-700 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold">Enable Developer Mode</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Toggle on the <span className="font-semibold text-neutral-300">Developer mode</span> switch in the top-right corner of the browser page.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-black/5 dark:bg-white/5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-neutral-700 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold">Load Unpacked Extension</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Click <span className="font-semibold text-neutral-300">Load unpacked</span> and select the <code className="px-1.5 py-0.5 bg-black/40 rounded border border-neutral-700">chrome-extension</code> folder.
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
            <a
              href="https://github.com/Somesh-Thakur/Maina-Final-Portfolio/tree/main/chrome-extension"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <span>View Source on GitHub</span>
              <ExternalLink size={12} />
            </a>

            <span className="text-[10px] uppercase tracking-widest text-neutral-400">
              Compatible with Chrome, Brave &amp; Edge
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
