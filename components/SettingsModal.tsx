import React from 'react';
import { Theme } from '../types';
import { X, Settings, Palette, Shield } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 bg-white border border-black/10 text-black">
        <div className="flex items-center justify-between p-8 border-b border-black/5">
          <div className="flex items-center gap-3 font-black text-xl uppercase tracking-widest">
            <Settings className="text-black" />
            <span>Preferences</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={24} className="text-black" /></button>
        </div>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto chat-scrollbar">
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">
              <Palette size={16} />
              <span>Visual Interface</span>
            </div>
            <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">
              <Shield size={16} />
              <span>Data Protocol</span>
            </div>
            <div className="p-6 rounded-3xl bg-black/5 border border-black/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-black">Local Cache</span>
                <span className="text-[10px] bg-green-600/10 text-green-600 px-3 py-1 rounded-full uppercase font-black">Secure</span>
              </div>
              <p className="text-[11px] opacity-60 leading-relaxed font-medium text-black">Neural logs are persisted strictly within your browser's sandboxed environment.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;