import React, { useState } from 'react';
import { Theme } from '../types.ts';
import { ArrowRight, Bot, Sparkles, Shield, Globe, Cookie } from 'lucide-react';

interface IntroScreenProps {
  theme: Theme;
  onStart: () => void;
  cookieConsent: 'accepted' | 'denied' | 'pending';
  onCookieConsentChange: (status: 'accepted' | 'denied' | 'pending') => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ theme, onStart, cookieConsent, onCookieConsentChange }) => {
  const [showConsentModal, setShowConsentModal] = useState(false);

  const handleStartClick = () => {
    if (cookieConsent === 'pending') {
      // This will trigger the conditional rendering below that "removes" the intro content
      setShowConsentModal(true);
    } else {
      onStart();
    }
  };

  const handleConsent = (accepted: boolean) => {
    onCookieConsentChange(accepted ? 'accepted' : 'denied');
    setShowConsentModal(false);
    onStart();
  };

  // If the modal is shown, we return ONLY the modal view to satisfy the request 
  // that "all the current content should be removed" before asking for consent.
  if (showConsentModal) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white animate-reveal">
        <div className="max-w-md w-full p-10 rounded-[3rem] bg-white border border-black/10 shadow-2xl space-y-10 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="p-6 rounded-[2.5rem] bg-black text-white animate-float">
              <Cookie size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black uppercase tracking-tight text-black">A Quick Question</h3>
              <p className="text-[14px] opacity-70 font-medium leading-relaxed text-black">
                Do you want me to remember your chats on this device? 
                Choose "Save Chats" to keep them, or "Don't Save" for a fresh start every time.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleConsent(true)}
              className="w-full py-5 bg-black text-white rounded-[2rem] font-bold uppercase tracking-widest text-[12px] transition-all active:scale-95 shadow-lg"
            >
              Save My Chats
            </button>
            <button 
              onClick={() => handleConsent(false)}
              className="w-full py-5 bg-black/5 hover:bg-black/10 text-black rounded-[2rem] font-bold uppercase tracking-widest text-[11px] transition-all"
            >
              Don't Save Anything
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start h-full px-6 text-center bg-transparent relative overflow-y-auto chat-scrollbar animate-reveal w-full text-black">
      <div className="max-w-3xl w-full py-16 lg:py-24 space-y-16 relative z-10 flex flex-col items-center min-h-screen">
        <div className="space-y-6 w-full">
          <div className="w-28 h-28 bg-black rounded-[2.5rem] mx-auto flex items-center justify-center text-white shadow-xl transition-all duration-700 group cursor-pointer animate-float">
            <Bot size={56} strokeWidth={1} className="group-hover:rotate-12 transition-transform" />
          </div>
          <div className="pt-2 space-y-3 text-center">
            <h1 className="text-5xl lg:text-8xl font-black tracking-tighter uppercase leading-none text-black">
              U Friend
            </h1>
            <p className="text-[10px] font-black tracking-[0.8em] uppercase opacity-40 text-black">
              Your Smart AI Helper
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left w-full">
          {[
            { icon: <Globe size={24} />, title: "Smart Helper", desc: "I can look at your photos, watch your videos, and read your documents." },
            { icon: <Sparkles size={24} />, title: "ZIP Reader", desc: "I can open ZIP files and look at 7 things inside them at once." },
            { icon: <Shield size={24} />, title: "Safe & Private", desc: "Your chats stay on your phone or computer. I keep your data safe." }
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-[2.5rem] glass-panel border border-black/5 flex flex-col gap-4 transition-all hover:bg-black/5 group">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center group-hover:scale-110 transition-all">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-[12px] uppercase tracking-wider text-black">{item.title}</h3>
                <p className="text-[12px] opacity-60 font-medium leading-relaxed text-black">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 flex flex-col items-center w-full">
          <button 
            onClick={handleStartClick}
            className="group w-full max-w-sm py-5 px-10 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[13px] flex items-center justify-center gap-4 transition-all duration-500 shadow-xl transform active:scale-95"
          >
            Start Chatting
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] pt-4 w-full opacity-30 text-black">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cookieConsent === 'accepted' ? 'bg-green-600' : cookieConsent === 'denied' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`}></div>
              {cookieConsent === 'accepted' ? 'Saving Chats' : cookieConsent === 'denied' ? 'Not Saving' : 'Checking'}
            </div>
            <span>•</span>
            <span>Version 3.5</span>
          </div>
        </div>

        <footer className="w-full max-w-2xl mt-auto pt-12 pb-10">
          <hr className="border-black/10 mb-6 w-full" />
          <p className="text-[9px] opacity-50 uppercase font-black tracking-[0.2em] text-black leading-relaxed">
            All rights reserved. © U Friend 2026<br className="sm:hidden" /> Developed by Ansh Yadav
          </p>
        </footer>
      </div>
    </div>
  );
};

export default IntroScreen;