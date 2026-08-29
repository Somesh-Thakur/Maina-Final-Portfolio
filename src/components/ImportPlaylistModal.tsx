'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DownloadCloud, Link2, Loader2, Check } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { importPlaylistFromUrl } from '@/lib/importers';
import type { Playlist, ThemeMode } from '@/types';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeMode;
  onImportSuccess?: (playlist: Playlist) => void;
}

export function ImportPlaylistModal({
  isOpen,
  onClose,
  theme = 'dark',
  onImportSuccess,
}: ImportPlaylistModalProps) {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { customPlaylists } = usePlayerStore();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!url.trim() || isImporting) return;
    setIsImporting(true);
    setErrorMsg(null);

    try {
      const result = await importPlaylistFromUrl(url);
      if (result && result.tracks.length > 0) {
        const newPlaylist: Playlist = {
          id: 'pl_imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: result.title,
          description: result.description,
          coverUrl: result.tracks[0]?.coverUrl,
          tracks: result.tracks,
          createdAt: Date.now(),
        };

        usePlayerStore.setState({
          customPlaylists: [newPlaylist, ...customPlaylists],
        });

        if (onImportSuccess) {
          onImportSuccess(newPlaylist);
        }
        onClose();
      } else {
        setErrorMsg('Could not find matching songs from this link. Please verify URL.');
      }
    } catch {
      setErrorMsg('Failed to process external playlist URL.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`w-full max-w-lg p-6 sm:p-8 rounded-2xl border shadow-2xl relative ${
            isDark ? 'bg-[#0f0f14] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-black'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6">
            <div className="flex items-center gap-2.5">
              <DownloadCloud size={20} className="text-[#2563eb]" />
              <div>
                <h2 className="editorial-title text-2xl">Import External Playlist</h2>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  Spotify • Apple Music • YouTube
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-current cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">
              Paste Public Playlist or Album Link:
            </label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/... or YouTube link"
                className={`w-full pl-10 pr-4 py-3 text-sm font-mono rounded-xl border transition-all focus:outline-none ${
                  isDark
                    ? 'bg-neutral-900/60 border-neutral-700 text-white placeholder-neutral-500 focus:border-white'
                    : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400 focus:border-black'
                }`}
              />
            </div>
          </div>

          <div className="p-3 mb-6 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 text-[11px] font-mono text-neutral-400 flex flex-col gap-1">
            <div className="text-white font-bold">Supported Platforms:</div>
            <div>• Spotify playlists &amp; albums</div>
            <div>• Apple Music public collections</div>
            <div>• YouTube &amp; YouTube Music playlists</div>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* CTA Action */}
          <button
            onClick={handleImport}
            disabled={!url.trim() || isImporting}
            className={`w-full py-3.5 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !url.trim() || isImporting
                ? 'opacity-50 cursor-not-allowed bg-neutral-700 text-neutral-400'
                : 'bg-white text-black hover:bg-neutral-200 shadow-xl'
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Matching &amp; Importing 320kbps Streams...</span>
              </>
            ) : (
              <>
                <DownloadCloud size={16} />
                <span>Import to My Library</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
