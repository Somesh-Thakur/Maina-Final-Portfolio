'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { Track, ThemeMode } from '@/types';

interface AddToPlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeMode;
}

export function AddToPlaylistModal({
  track,
  isOpen,
  onClose,
  theme = 'dark',
}: AddToPlaylistModalProps) {
  const isDark = theme === 'dark';

  const {
    customPlaylists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
  } = usePlayerStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!isOpen || !track) return null;

  const handleToggle = (playlistId: string) => {
    const playlist = customPlaylists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const alreadyIn = playlist.tracks.some((t) => t.id === track.id);
    if (alreadyIn) {
      removeFromPlaylist(playlistId, track.id);
    } else {
      addToPlaylist(playlistId, track);
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newId = createPlaylist(newTitle.trim());
    addToPlaylist(newId, track);
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-sm p-5 sm:p-6 border shadow-2xl relative rounded-sm ${
            isDark ? 'bg-[#111114] border-neutral-700 text-white' : 'bg-white border-neutral-300 text-black'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="editorial-badge text-[9px] py-0.5 px-2">Vault</span>
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Add to Playlist
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-current cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Selected Track Preview */}
          <div className="flex items-center gap-3 p-2.5 mb-4 border border-neutral-200 dark:border-neutral-800/80 bg-black/5 dark:bg-white/5 rounded-sm">
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-10 h-10 object-cover grayscale contrast-125 rounded-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase truncate">{track.title}</div>
              <div className="font-mono text-[10px] text-neutral-500 truncate">{track.artist}</div>
            </div>
          </div>

          {/* Playlists List with Checkboxes */}
          <div className="max-h-56 overflow-y-auto custom-lyrics-scrollbar flex flex-col gap-1 mb-4 pr-1">
            {customPlaylists.length > 0 ? (
              customPlaylists.map((playlist) => {
                const isSelected = playlist.tracks.some((t) => t.id === track.id);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleToggle(playlist.id)}
                    className={`w-full flex items-center justify-between p-2.5 text-left text-xs font-mono border transition-all rounded-sm cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'border-white/40 bg-white/10 text-white font-bold'
                          : 'border-black/40 bg-black/5 text-black font-bold'
                        : isDark
                        ? 'border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                        : 'border-neutral-200/80 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ListMusic size={14} className="text-neutral-500 shrink-0" />
                      <span className="truncate">{playlist.name}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? isDark
                            ? 'border-white bg-white text-black'
                            : 'border-black bg-black text-white'
                          : 'border-neutral-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs font-mono text-neutral-500">
                No playlists created yet.
              </div>
            )}
          </div>

          {/* Create New Playlist Inline Form / Button */}
          {isCreating ? (
            <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <input
                type="text"
                required
                autoFocus
                placeholder="New Playlist Name..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={`w-full p-2 text-xs font-mono border outline-none ${
                  isDark
                    ? 'border-neutral-700 bg-black text-white focus:border-white'
                    : 'border-neutral-300 bg-neutral-50 text-black focus:border-black'
                }`}
              />
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 text-[11px] font-mono text-neutral-500 hover:text-current cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1 text-[11px] font-mono border uppercase tracking-wider cursor-pointer ${
                    isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white'
                  }`}
                >
                  Create &amp; Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className={`w-full py-2 text-xs font-mono uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'border-neutral-700 hover:border-white text-neutral-300 hover:text-white'
                  : 'border-neutral-300 hover:border-black text-neutral-700 hover:text-black'
              }`}
            >
              <Plus size={13} />
              <span>New Playlist</span>
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
