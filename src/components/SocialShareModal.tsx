'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, Sparkles } from 'lucide-react';
import type { Track, ThemeMode } from '@/types';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  currentLyric?: string;
  theme?: ThemeMode;
}

export function SocialShareModal({
  isOpen,
  onClose,
  track,
  currentLyric,
  theme = 'dark',
}: SocialShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  const lyricText = currentLyric || `Now Streaming on Maina: "${track.title}" by ${track.artist}`;

  useEffect(() => {
    if (!isOpen || !track) return;
    setIsGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: 9:16 Instagram Story (720 x 1280)
    canvas.width = 720;
    canvas.height = 1280;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = track.coverUrl;

    img.onload = () => {
      // 1. Draw Deep Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1280);
      bgGrad.addColorStop(0, '#15151c');
      bgGrad.addColorStop(0.5, '#0a0a0e');
      bgGrad.addColorStop(1, '#050508');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 720, 1280);

      // 2. Draw Blurred Cover Art Glow
      ctx.save();
      ctx.filter = 'blur(60px)';
      ctx.globalAlpha = 0.35;
      ctx.drawImage(img, -100, 100, 920, 920);
      ctx.restore();

      // 3. Draw Frosted Glass Main Card
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, 160, 560, 880, 24);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 4. Header: MAINA Branding
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.letterSpacing = '6px';
      ctx.textAlign = 'center';
      ctx.fillText('MAINA // SOUND CAPSULE', 360, 230);

      // 5. High-Resolution Album Artwork
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(140, 280, 440, 440, 16);
      ctx.clip();
      ctx.drawImage(img, 140, 280, 440, 440);
      ctx.restore();

      // Artwork border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(140, 280, 440, 440, 16);
      ctx.stroke();

      // 6. Song Title & Artist
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      const title = track.title.length > 25 ? track.title.slice(0, 25) + '...' : track.title;
      ctx.fillText(title, 360, 780);

      ctx.fillStyle = '#aaaaaa';
      ctx.font = '22px monospace';
      const artist = track.artist.length > 30 ? track.artist.slice(0, 30) + '...' : track.artist;
      ctx.fillText(artist, 360, 825);

      // 7. Active Lyric Snippet Quote
      ctx.fillStyle = 'rgba(255, 45, 85, 0.9)';
      ctx.font = 'italic 20px serif';
      ctx.textAlign = 'center';
      const lyric = lyricText.length > 50 ? lyricText.slice(0, 50) + '...' : lyricText;
      ctx.fillText(`"${lyric}"`, 360, 910);

      // 8. Waveform preview visual
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 36; i++) {
        const barH = 10 + Math.sin(i * 0.4) * 20 + (i % 3 === 0 ? 15 : 0);
        const bx = 160 + i * 11;
        const by = 970 - barH / 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, 6, barH, 3);
        ctx.fill();
      }

      // 9. Footer Watermark
      ctx.fillStyle = '#666666';
      ctx.font = '16px monospace';
      ctx.fillText('STREAM ON MAINA // 320 KBPS MASTER AUDIO', 360, 1140);

      setIsGenerating(false);
    };
  }, [isOpen, track, lyricText]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `maina-${track.title.toLowerCase().replace(/\s+/g, '-')}-story.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    } catch {
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm sm:max-w-md p-6 bg-[#0f0f13] border border-neutral-800 rounded-xl text-white shadow-2xl flex flex-col items-center gap-4"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#FF2D55]" />
              <h2 className="editorial-title text-xl">Story Card Generator</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Canvas Preview */}
          <div className="w-48 sm:w-56 h-[340px] sm:h-[400px] border border-neutral-700 rounded-lg overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
            {isGenerating && <div className="animate-pulse text-xs font-mono text-neutral-400">Rendering...</div>}
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>

          {/* Actions */}
          <div className="w-full grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="py-2.5 px-4 bg-white text-black font-mono text-xs uppercase tracking-wider font-bold rounded flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Save PNG</span>
            </button>

            <button
              onClick={handleCopyImage}
              className="py-2.5 px-4 bg-neutral-800 text-white font-mono text-xs uppercase tracking-wider font-bold rounded flex items-center justify-center gap-2 hover:bg-neutral-700 transition-all cursor-pointer border border-neutral-700"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Card'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
