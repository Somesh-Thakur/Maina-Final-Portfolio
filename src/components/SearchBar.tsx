'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import type { Track } from '@/types';
import { searchSongs } from '@/lib/api/jiosaavn';

interface SearchBarProps {
  onTrackSelect: (track: Track) => void;
  theme: 'dark' | 'light';
}

export function SearchBar({ onTrackSelect, theme }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        try {
          const res = await searchSongs(query);
          setResults(res);
          setIsOpen(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md font-mono">
      <div className={`relative flex items-center border ${isDark ? 'border-white/20 bg-[#0a0a0a]' : 'border-black/20 bg-white'}`}>
        <Search size={16} className={`absolute left-3 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query) setIsOpen(true); }}
          placeholder="SEARCH_CATALOG..."
          className={`w-full py-2 pl-10 pr-10 bg-transparent outline-none text-sm placeholder:tracking-wider ${
            isDark ? 'text-white placeholder:text-white/30' : 'text-black placeholder:text-black/30'
          }`}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className={`absolute right-3 p-1 rounded-sm ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-black/5 text-black/50'}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className={`absolute top-full left-0 right-0 mt-2 border backdrop-blur-md shadow-2xl z-50 max-h-[400px] overflow-y-auto ${
          isDark ? 'bg-[#0a0a0a]/95 border-white/20' : 'bg-white/95 border-black/20'
        }`}>
          {isLoading ? (
            <div className={`flex items-center justify-center p-8 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((track) => (
                <button
                  key={track.id}
                  onClick={() => {
                    onTrackSelect(track);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-4 p-3 text-left transition-colors border-b last:border-b-0 ${
                    isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
                  }`}
                >
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 object-cover grayscale" />
                  <div className="flex-1 min-w-0">
                    <div className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{track.title}</div>
                    <div className={`truncate text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>{track.artist}</div>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {formatDuration(track.duration)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={`p-8 text-center text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              NO RESULTS FOUND
            </div>
          )}
        </div>
      )}
    </div>
  );
}
