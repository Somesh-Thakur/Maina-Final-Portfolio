'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Flame, Search, Library } from 'lucide-react';
import type { NavTab, ThemeMode } from '@/types';

interface MobileNavProps {
  currentView: NavTab;
  onViewChange: (view: NavTab) => void;
  theme: ThemeMode;
}

const TABS: { id: NavTab; label: string; icon: React.ComponentType<{ size: number; className?: string }> }[] = [
  { id: 'home', label: 'Explore', icon: Compass },
  { id: 'flow', label: 'Flow', icon: Flame },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'Library', icon: Library },
];

export function MobileNav({ currentView, onViewChange, theme }: MobileNavProps) {
  const isDark = theme === 'dark';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-auto">
      <nav
        className={`w-full backdrop-blur-2xl border-t px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-colors duration-300 ${
          isDark
            ? 'bg-[#0a0a0c]/90 border-neutral-800/80 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.8)]'
            : 'bg-white/90 border-neutral-200/80 text-black shadow-[0_-10px_30px_rgba(0,0,0,0.08)]'
        }`}
      >
        <div className="grid grid-cols-4 max-w-md mx-auto relative">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-black'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className={`absolute inset-0 rounded-xl -z-10 ${
                      isDark ? 'bg-white/10' : 'bg-black/5'
                    }`}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110 text-[#FF2D55]' : 'scale-100 opacity-70'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono tracking-wider mt-1 uppercase transition-opacity ${
                    isActive ? 'font-bold opacity-100' : 'opacity-60'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
