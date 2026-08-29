'use client';

import React, { useEffect, useRef, useState } from 'react';
import { audioAnalyser } from '@/lib/audioAnalyser';
import { Activity, BarChart2, Disc3, Sparkles } from 'lucide-react';

export type VisualizerMode = 'bars' | 'liquid' | 'particles' | 'orbital';

interface VisualizerProps {
  variant: 'bars' | 'mini';
  theme: 'dark' | 'light';
  isPlaying: boolean;
  showModeToggle?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  hue: number;
}

export function Visualizer({
  variant,
  theme,
  isPlaying,
  showModeToggle = false,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reqRef = useRef<number | null>(null);
  const smoothedRef = useRef<number[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMini = variant === 'mini';
    const numBars = isMini ? 6 : 48;

    if (smoothedRef.current.length !== numBars) {
      smoothedRef.current = new Array(numBars).fill(2);
    }

    // Initialize 36 particles for Particle Constellation mode
    if (particlesRef.current.length === 0) {
      const particles: Particle[] = [];
      for (let i = 0; i < 36; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 2 + 1.5,
          baseSize: Math.random() * 2 + 1.5,
          hue: Math.random() * 60 + 330, // Magenta / Pink / Blue hues
        });
      }
      particlesRef.current = particles;
    }

    let frameCount = 0;

    const render = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioAnalyser.getFrequencyData();
      const waveData = audioAnalyser.getWaveformData();
      const hasSound = isPlaying && freqData.some((v) => v > 0);

      // Mini Player 6-bar sampler
      if (isMini) {
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        const sampleBins = [1, 2, 4, 7, 12, 20];
        const barWidth = 3;
        const gap = 3;
        const totalW = numBars * barWidth + (numBars - 1) * gap;
        const startX = (width - totalW) / 2;

        for (let i = 0; i < numBars; i++) {
          const binIndex = sampleBins[i] || i * 2;
          let target = 2;

          if (hasSound) {
            const raw = freqData[binIndex] || 0;
            const boost = i < 3 ? 1.25 : 1.0;
            target = Math.max(2, (raw / 255) * boost * (height - 2));
          } else if (isPlaying) {
            const fallbackWave = Math.sin(frameCount * 0.15 + i * 0.8) * 0.5 + 0.5;
            target = Math.max(2, fallbackWave * 0.6 * height);
          }

          smoothedRef.current[i] = smoothedRef.current[i] * 0.65 + target * 0.35;
          const barHeight = Math.min(height, Math.max(2, smoothedRef.current[i]));

          const x = startX + i * (barWidth + gap);
          const y = height - barHeight;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 1.5);
          ctx.fill();
        }
      } else {
        // ─── MODE 1: FREQUENCY BARS ───
        if (mode === 'bars') {
          ctx.fillStyle = isDark ? '#ffffff' : '#000000';
          if (isDark) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
          }

          const barWidth = 4;
          const gap = 3;
          const totalW = numBars * barWidth + (numBars - 1) * gap;
          const startX = Math.max(0, (width - totalW) / 2);

          for (let i = 0; i < numBars; i++) {
            let target = 3;

            if (hasSound) {
              const binIndex = Math.min(
                freqData.length - 1,
                Math.floor(Math.pow(i / numBars, 1.4) * (freqData.length * 0.75))
              );
              const val = freqData[binIndex] / 255;
              target = Math.max(3, val * (height - 4));
            } else if (isPlaying) {
              const wave1 = Math.sin(frameCount * 0.08 + i * 0.15) * 0.5 + 0.5;
              const wave2 = Math.cos(frameCount * 0.12 - i * 0.25) * 0.5 + 0.5;
              target = Math.max(3, (wave1 * 0.6 + wave2 * 0.4) * (height * 0.5));
            }

            const smoothing = target > smoothedRef.current[i] ? 0.3 : 0.18;
            smoothedRef.current[i] = smoothedRef.current[i] * (1 - smoothing) + target * smoothing;
            const barHeight = Math.min(height, Math.max(3, smoothedRef.current[i]));

            const x = startX + i * (barWidth + gap);
            const y = height - barHeight;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 1.5);
            ctx.fill();
          }
        }

        // ─── MODE 2: LIQUID WAVES (Displaced Sine Mesh) ───
        else if (mode === 'liquid') {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
          ctx.shadowBlur = isDark ? 8 : 0;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';

          const avgFreq = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
          const energy = hasSound ? avgFreq * 1.5 : isPlaying ? 0.4 : 0.1;

          ctx.beginPath();
          for (let x = 0; x < width; x += 4) {
            const wave1 = Math.sin(x * 0.02 + frameCount * 0.08) * 12 * energy;
            const wave2 = Math.cos(x * 0.04 - frameCount * 0.05) * 6 * energy;
            const y = height / 2 + wave1 + wave2;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // ─── MODE 3: PARTICLE CONSTELLATION ───
        else if (mode === 'particles') {
          const avgFreq = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
          const energy = hasSound ? avgFreq : isPlaying ? 0.3 : 0.05;

          const particles = particlesRef.current;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx * (1 + energy * 2);
            p.y += p.vy * (1 + energy * 2);

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const currentSize = p.baseSize + energy * 4;
            ctx.fillStyle = isDark ? '#ffffff' : '#000000';
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fill();

            // Connect nearby particles with constellation lines
            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
              if (dist < 45) {
                ctx.strokeStyle = isDark
                  ? `rgba(255, 255, 255, ${(1 - dist / 45) * 0.4})`
                  : `rgba(0, 0, 0, ${(1 - dist / 45) * 0.4})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }
        }

        // ─── MODE 4: ORBITAL RADIAL PULSE RING ───
        else if (mode === 'orbital') {
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(centerX, centerY) * 0.65;
          const ringPoints = 32;

          ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
          ctx.lineWidth = 2;
          ctx.shadowBlur = isDark ? 12 : 0;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';

          ctx.beginPath();
          for (let i = 0; i < ringPoints; i++) {
            const angle = (i / ringPoints) * Math.PI * 2;
            const bin = Math.floor((i / ringPoints) * 32);
            let amp = hasSound ? (freqData[bin] / 255) * 16 : isPlaying ? Math.sin(frameCount * 0.1 + i) * 6 : 0;
            const r = radius + Math.max(0, amp);

            const px = centerX + Math.cos(angle) * r;
            const py = centerY + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      reqRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [variant, isDark, isPlaying, mode]);

  if (variant === 'mini') {
    return (
      <canvas
        ref={canvasRef}
        width={48}
        height={20}
        className="w-12 h-5 block"
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        width={400}
        height={44}
        className="w-full h-11 block"
      />

      {showModeToggle && (
        <div className="flex items-center gap-1 mt-1 p-0.5 border border-neutral-300 dark:border-neutral-800/80 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-sm">
          <button
            onClick={() => setMode('bars')}
            className={`px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'bars'
                ? isDark
                  ? 'bg-white text-black font-bold'
                  : 'bg-black text-white font-bold'
                : 'text-neutral-500 hover:text-current'
            }`}
            title="Frequency Bars"
          >
            <BarChart2 size={10} />
            <span>Bars</span>
          </button>

          <button
            onClick={() => setMode('liquid')}
            className={`px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'liquid'
                ? isDark
                  ? 'bg-white text-black font-bold'
                  : 'bg-black text-white font-bold'
                : 'text-neutral-500 hover:text-current'
            }`}
            title="Liquid Waves"
          >
            <Activity size={10} />
            <span>Liquid</span>
          </button>

          <button
            onClick={() => setMode('particles')}
            className={`px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'particles'
                ? isDark
                  ? 'bg-white text-black font-bold'
                  : 'bg-black text-white font-bold'
                : 'text-neutral-500 hover:text-current'
            }`}
            title="Particle Constellation"
          >
            <Sparkles size={10} />
            <span>Particles</span>
          </button>

          <button
            onClick={() => setMode('orbital')}
            className={`px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'orbital'
                ? isDark
                  ? 'bg-white text-black font-bold'
                  : 'bg-black text-white font-bold'
                : 'text-neutral-500 hover:text-current'
            }`}
            title="Orbital Ring"
          >
            <Disc3 size={10} />
            <span>Orbital</span>
          </button>
        </div>
      )}
    </div>
  );
}
