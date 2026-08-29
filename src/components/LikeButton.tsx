'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import type { Track } from '@/types';

interface LikeButtonProps {
  track: Track;
  size?: number;
  className?: string;
  theme?: 'dark' | 'light';
  showLabel?: boolean;
}

export function LikeButton({
  track,
  size = 18,
  className = '',
  theme = 'dark',
  showLabel = false,
}: LikeButtonProps) {
  const isLiked = usePlayerStore((s) => s.likedSongs.some((t) => t.id === track.id));
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const [isPopping, setIsPopping] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopping(true);
    toggleLike(track);
    setTimeout(() => setIsPopping(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative group inline-flex items-center gap-1.5 p-1.5 transition-colors cursor-pointer select-none ${className} ${
        isLiked
          ? 'text-[#FF2D55]'
          : theme === 'dark'
          ? 'text-neutral-500 hover:text-white'
          : 'text-neutral-400 hover:text-black'
      }`}
      title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
    >
      <motion.div
        animate={
          isPopping
            ? {
                scale: [1, 0.6, 1.4, 0.9, 1.15, 1],
                rotate: [0, -12, 12, -6, 0],
              }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="relative flex items-center justify-center"
      >
        <Heart
          size={size}
          className={`transition-all duration-300 ${
            isLiked
              ? 'fill-[#FF2D55] text-[#FF2D55] drop-shadow-[0_0_8px_rgba(255,45,85,0.6)]'
              : 'fill-transparent stroke-current'
          }`}
        />

        {/* Instagram-style heart burst ripple */}
        <AnimatePresence>
          {isPopping && isLiked && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-[#FF2D55]/30 pointer-events-none -z-10"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {showLabel && (
        <span className="text-xs font-mono tracking-wider uppercase">
          {isLiked ? 'Liked' : 'Like'}
        </span>
      )}
    </button>
  );
}
