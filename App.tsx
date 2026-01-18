import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface.tsx';
import { Theme } from './types.ts';

const getSavedTheme = (): Theme => {
  const saved = localStorage.getItem('u-friend-theme');
  return (saved as Theme) || 'modern-light';
};

const getCookieConsent = (): 'accepted' | 'denied' | 'pending' => {
  const saved = localStorage.getItem('u-friend-cookie-consent');
  return (saved as any) || 'pending';
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(getSavedTheme());
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'denied' | 'pending'>(getCookieConsent());

  useEffect(() => {
    if (cookieConsent === 'accepted') {
      localStorage.setItem('u-friend-theme', theme);
      localStorage.setItem('u-friend-cookie-consent', 'accepted');
    }
  }, [theme, cookieConsent]);

  const themeStyles: Record<Theme, { bg: string, accent: string }> = {
    'modern-light': { bg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', accent: '#3b82f6' },
    'modern-dark': { bg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', accent: '#2563eb' },
    'midnight-pro': { bg: 'linear-gradient(135deg, #d1d5db 0%, #94a3b8 100%)', accent: '#4f46e5' },
    'emerald-calm': { bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', accent: '#059669' },
    'sunset-vibe': { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', accent: '#ea580c' },
    'cyber-neon': { bg: '#f8fafc', accent: '#06b6d4' },
    'royal-velvet': { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', accent: '#7c3aed' },
    'nordic-frost': { bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', accent: '#0284c7' },
    'coffee-latte': { bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', accent: '#d97706' },
  };

  const currentStyle = themeStyles[theme];

  return (
    <div 
      className="fixed inset-0 flex flex-col transition-all duration-1000 overflow-hidden"
      style={{ 
        background: currentStyle.bg,
        '--theme-accent': currentStyle.accent
      } as React.CSSProperties}
    >
      <ChatInterface 
        currentTheme={theme} 
        onThemeChange={setTheme} 
        cookieConsent={cookieConsent}
        onCookieConsentChange={setCookieConsent}
      />
    </div>
  );
};

export default App;