import React from 'react';
import { Theme } from '../types';
import { Check, Sun, Moon, Cloud, Leaf, Sunrise, Zap, Crown, Snowflake, Coffee } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const themes: { id: Theme; label: string; colors: string[]; icon: React.ReactNode }[] = [
    { id: 'modern-light', label: 'Classic White', colors: ['bg-white', 'bg-blue-600'], icon: <Sun size={14} /> },
    { id: 'modern-dark', label: 'Slate Gray', colors: ['bg-slate-200', 'bg-slate-800'], icon: <Moon size={14} /> },
    { id: 'midnight-pro', label: 'Cloudy Sky', colors: ['bg-blue-100', 'bg-blue-900'], icon: <Cloud size={14} /> },
    { id: 'emerald-calm', label: 'Soft Emerald', colors: ['bg-emerald-50', 'bg-emerald-800'], icon: <Leaf size={14} /> },
    { id: 'sunset-vibe', label: 'Peach Warmth', colors: ['bg-orange-50', 'bg-orange-800'], icon: <Sunrise size={14} /> },
    { id: 'cyber-neon', label: 'Aqua Flux', colors: ['bg-cyan-50', 'bg-cyan-800'], icon: <Zap size={14} /> },
    { id: 'royal-velvet', label: 'Soft Lavender', colors: ['bg-purple-50', 'bg-purple-800'], icon: <Crown size={14} /> },
    { id: 'nordic-frost', label: 'Ice Blue', colors: ['bg-sky-50', 'bg-sky-800'], icon: <Snowflake size={14} /> },
    { id: 'coffee-latte', label: 'Cream Latte', colors: ['bg-amber-50', 'bg-amber-800'], icon: <Coffee size={14} /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`
            flex items-center justify-between px-4 py-4 rounded-2xl transition-all border group
            ${currentTheme === theme.id 
              ? 'border-black bg-black/5 shadow-md' 
              : 'border-black/5 hover:bg-black/5'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${currentTheme === theme.id ? 'bg-black text-white' : 'bg-black/5 opacity-40 text-black'}`}>
              {theme.icon}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest ${currentTheme === theme.id ? 'text-black' : 'opacity-40 text-black'}`}>
              {theme.label}
            </span>
          </div>
          {currentTheme === theme.id && <div className="bg-black text-white rounded-full p-1"><Check size={10} /></div>}
        </button>
      ))}
    </div>
  );
};

export default ThemeSelector;