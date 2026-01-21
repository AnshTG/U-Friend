
import React, { useState, useRef, useEffect } from 'react';
import { Message, Theme, Attachment, ChatSession, ChatMode } from '../types.ts';
import { sendMessageToGemini } from '../services/geminiService.ts';
import MessageItem from './MessageItem.tsx';
import FileUploader from './FileUploader.tsx';
import IntroScreen from './IntroScreen.tsx';
import SettingsModal from './SettingsModal.tsx';
import Logo from './Logo.tsx';
import { 
  Send, Loader2, Menu, X, Plus, 
  MessageSquare, Settings as SettingsIcon, 
  Trash2, Sparkles, Globe, GraduationCap, Image as ImageIcon,
  ChevronDown, RefreshCw, Mic, MicOff, Heart, WifiOff, Search, Square
} from 'lucide-react';

interface ChatInterfaceProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  cookieConsent: 'accepted' | 'denied' | 'pending';
  onCookieConsentChange: (status: 'accepted' | 'denied' | 'pending') => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentTheme, onThemeChange, cookieConsent, onCookieConsentChange 
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('u-friend-sessions');
    if (saved && cookieConsent === 'accepted') {
      try {
        return JSON.parse(saved);
      } catch (e) { return []; }
    }
    return [];
  });
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  // Intro page is for new users only. If consent is already given/denied or sessions exist, skip intro.
  const [showIntro, setShowIntro] = useState(() => {
    const hasSeenIntro = localStorage.getItem('u-friend-intro-seen');
    return !hasSeenIntro && cookieConsent === 'pending';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [activeMode, setActiveMode] = useState<ChatMode>('general');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchDetected, setIsSearchDetected] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    const text = inputValue.trim().toLowerCase();
    const searchTriggers = ['who is', 'latest', 'news', 'weather', 'current', '2025', 'stock', 'today', 'price'];
    if (activeMode !== 'search' && text.length > 5) {
      setIsSearchDetected(searchTriggers.some(t => text.includes(t)) || text.endsWith('?'));
    } else {
      setIsSearchDetected(false);
    }
  }, [inputValue, activeMode]);

  useEffect(() => {
    if (cookieConsent === 'accepted') {
      localStorage.setItem('u-friend-sessions', JSON.stringify(sessions));
    }
  }, [sessions, cookieConsent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeSession?.messages, isLoading, pendingAttachments, hasError]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) setInputValue(prev => prev + (prev.trim() ? ' ' : '') + transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) { setIsListening(false); }
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Interaction',
      messages: [],
      createdAt: Date.now(),
      activeMode: 'general'
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setHasError(false);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!navigator.onLine) {
      setErrorMessage("Network connection unavailable.");
      setHasError(true);
      return;
    }
    if ((!inputValue.trim() && pendingAttachments.length === 0) || isLoading || isUploading) return;

    const promptText = inputValue;
    const files = [...pendingAttachments];
    const mode = isSearchDetected ? 'search' : activeMode;

    setInputValue('');
    setPendingAttachments([]);
    setIsLoading(true);
    setHasError(false);

    let targetId = activeSessionId;
    if (!targetId) {
      const newId = Date.now().toString();
      targetId = newId;
      setSessions(prev => [{
        id: newId,
        title: promptText.substring(0, 30) || 'Interaction',
        messages: [],
        createdAt: Date.now(),
        activeMode: mode
      }, ...prev]);
      setActiveSessionId(newId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      attachments: files,
      timestamp: Date.now(),
      mode
    };

    setSessions(prev => prev.map(s => s.id === targetId ? {
      ...s,
      messages: [...s.messages, userMsg],
      title: s.messages.length === 0 ? (promptText.substring(0, 30) || 'New Chat') : s.title
    } : s));

    abortControllerRef.current = new AbortController();

    try {
      const currentSession = sessions.find(s => s.id === targetId);
      const history = currentSession ? currentSession.messages : [];
      
      const result = await sendMessageToGemini(
        promptText, history, files, mode, abortControllerRef.current.signal
      );

      if (result.error) {
        setErrorMessage(result.text);
        setHasError(true);
      } else {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: result.text,
          timestamp: Date.now(),
          mode,
          sources: result.sources,
          attachments: result.generatedImage ? [{
            id: 'gen-' + Date.now(),
            name: 'Neural Image',
            type: 'image/png',
            data: result.generatedImage,
            size: 0
          }] : undefined
        };
        setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, aiMsg] } : s));
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setHasError(true);
        setErrorMessage("Critical failure in multimodal synthesis.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const modeOptions: { id: ChatMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'general', label: 'General', icon: <Sparkles size={16} />, desc: 'Standard Logic' },
    { id: 'study', label: 'Study', icon: <GraduationCap size={16} />, desc: 'Concept Analysis' },
    { id: 'search', label: 'Search', icon: <Globe size={16} />, desc: 'Real-time Web' },
    { id: 'image', label: 'Creative', icon: <ImageIcon size={16} />, desc: 'Visual Synthesis' },
  ];

  const handleFinishIntro = () => {
    localStorage.setItem('u-friend-intro-seen', 'true');
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <IntroScreen 
        theme={currentTheme} 
        onStart={handleFinishIntro} 
        cookieConsent={cookieConsent}
        onCookieConsentChange={onCookieConsentChange}
      />
    );
  }

  return (
    <div className="flex h-full w-full relative overflow-hidden animate-reveal text-black">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 transform transition-all duration-500 glass-panel
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        p-6 flex flex-col gap-8
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Logo size={32} className="text-black" />
             <h1 className="text-xl font-black tracking-tighter uppercase text-black">U Friend</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-black/5 rounded-full"><X size={20} className="text-black" /></button>
        </div>

        <button onClick={createNewChat} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95 group">
          <Plus size={18} />
          <span>New Interaction</span>
        </button>

        <div className="flex-1 flex flex-col gap-3 overflow-y-auto chat-scrollbar pr-2">
          <h2 className="text-[10px] uppercase font-black px-2 tracking-[0.4em] opacity-40">History</h2>
          {sessions.map((s) => (
            <button key={s.id} onClick={() => { setActiveSessionId(s.id); setHasError(false); setIsSidebarOpen(false); }} className={`group flex items-center justify-between gap-3 px-4 py-4 rounded-2xl transition-all text-xs border ${activeSessionId === s.id ? 'bg-black/5 border-black/10' : 'hover:bg-black/5 border-transparent opacity-60'}`}>
              <div className="flex items-center gap-3 truncate">
                <MessageSquare size={14} className="opacity-40" />
                <span className="truncate font-bold text-black">{s.title}</span>
              </div>
              <Trash2 size={12} className="opacity-0 group-hover:opacity-60 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(x => x.id !== s.id)); if(activeSessionId === s.id) setActiveSessionId(null); }} />
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-black/5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 opacity-60">
             <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-black">Ansh Yadav</span>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl hover:bg-black/5 transition-all text-xs font-black uppercase tracking-widest opacity-60 text-black">
            <SettingsIcon size={18} />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full relative">
        <button onClick={() => setIsSidebarOpen(true)} className="absolute top-6 left-6 z-20 p-3 rounded-2xl glass-panel lg:hidden">
          <Menu size={22} className="text-black" />
        </button>

        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scrollbar px-6 lg:px-12 py-12 lg:py-16 space-y-6 max-w-5xl mx-auto w-full">
          {(!activeSession || activeSession.messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 animate-reveal">
              <Logo size={140} className="text-black animate-float" />
              <div className="space-y-4">
                <h3 className="text-6xl font-black uppercase tracking-tighter text-black">U Friend</h3>
                <p className="text-sm opacity-60 max-w-sm mx-auto font-medium text-black">Multimodal analysis engine ready.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl px-4">
                {modeOptions.map(m => (
                  <button key={m.id} onClick={() => setActiveMode(m.id)} className={`p-8 rounded-[3rem] border transition-all text-left flex flex-col gap-6 group glass-panel ${activeMode === m.id ? 'bg-black text-white shadow-2xl scale-105 border-transparent' : 'hover:bg-black/5 border-black/5'}`}>
                    <div className={`p-3 rounded-2xl w-fit ${activeMode === m.id ? 'bg-white/10' : 'bg-black/5'}`}>{m.icon}</div>
                    <div className="space-y-1">
                      <span className="text-[12px] font-black uppercase tracking-widest block">{m.label}</span>
                      <span className="text-[9px] opacity-40 font-bold uppercase">{m.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-6">
              {activeSession.messages.map((msg, i) => (
                <MessageItem key={msg.id} message={msg} theme={currentTheme} isLast={i === activeSession.messages.length - 1} onRegenerate={handleSendMessage} />
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-start gap-3 pl-4">
              <div className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center"><Loader2 className="animate-spin text-black" size={20} /></div>
              <div className="p-4 rounded-[1.5rem] glass-panel text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse text-black">Thinking...</div>
            </div>
          )}

          {hasError && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="flex items-center gap-6 p-6 bg-red-500/10 border border-red-500/20 text-red-600 rounded-[2rem] max-w-lg w-full">
                <div className="p-4 rounded-2xl bg-red-500/10"><WifiOff size={24} /></div>
                <div className="space-y-1">
                  <h4 className="font-black text-xs uppercase tracking-widest">Protocol Failure</h4>
                  <p className="text-xs font-medium opacity-80">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 lg:px-12 lg:pb-8 relative">
          <div className="max-w-4xl mx-auto relative group">
            {showModeDropdown && (
              <div className="absolute bottom-full left-0 mb-6 w-80 rounded-[2.5rem] shadow-4xl overflow-hidden glass-panel z-50 border border-black/10">
                <div className="p-5 border-b border-black/5 text-[10px] font-black uppercase tracking-[0.4em] opacity-40 text-black">Flow Matrix</div>
                <div className="p-3 space-y-1">
                  {modeOptions.map(m => (
                    <button key={m.id} onClick={() => { setActiveMode(m.id); setShowModeDropdown(false); }} className={`w-full flex items-start gap-3 p-4 rounded-[1.5rem] transition-all ${activeMode === m.id ? 'bg-black text-white' : 'hover:bg-black/5 text-black'}`}>
                      <div className={`mt-0.5 p-1.5 rounded-lg ${activeMode === m.id ? 'bg-white/10' : 'bg-black/5'}`}>{m.icon}</div>
                      <div className="text-left">
                        <div className="text-[10px] font-black uppercase">{m.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 mb-4 glass-panel rounded-[2rem] border border-black/10">
                {pendingAttachments.map((att) => (
                  <div key={att.id} className="relative group bg-black/5 p-1.5 rounded-xl flex items-center gap-2 text-[9px] font-black border border-black/5 text-black">
                    {att.type.startsWith('image/') && <img src={att.data} className="w-8 h-8 rounded-lg object-cover" />}
                    <span className="truncate max-w-[100px]">{att.name}</span>
                    <button onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))} className="p-1 hover:bg-red-500/20 rounded-lg text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            <div 
              className={`flex flex-col rounded-[2.5rem] border transition-all duration-500 glass-panel relative ${isFocused ? 'shadow-2xl border-black/20' : 'shadow-none border-black/10'}`}
              style={{ minHeight: '1.5cm' }}
            >
              <textarea 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Talk with U Friend..." 
                className="w-full bg-transparent border-none focus:ring-0 py-4 px-8 resize-none text-[15px] font-medium leading-tight placeholder:text-black placeholder:opacity-30 text-black transition-all"
                rows={1}
                style={{ height: 'auto', minHeight: 'calc(1.5cm - 40px)' }}
                onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }}
              />
              
              <div className="flex items-center justify-between px-6 pb-4 pt-1 border-t border-black/5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowModeDropdown(!showModeDropdown)} className={`flex items-center gap-2 py-2 px-4 rounded-[1.2rem] transition-all text-[9px] font-black uppercase tracking-[0.1em] text-black ${showModeDropdown ? 'bg-black/10' : 'hover:bg-black/5'}`}>
                    {modeOptions.find(m => m.id === activeMode)?.icon}
                    <span className="hidden sm:inline">{activeMode}</span>
                  </button>
                  <div className="w-[1px] h-6 bg-black/10 mx-1 hidden sm:block"></div>
                  <FileUploader 
                    onFileAdded={(att) => setPendingAttachments(prev => [...prev, att].slice(0, 15))} // Higher limit as zip adds multiple
                    onUploadStart={() => setIsUploading(true)}
                    onUploadEnd={() => setIsUploading(false)}
                    disabled={isLoading || pendingAttachments.length >= 15} 
                    theme={currentTheme} 
                  />
                  <button onClick={toggleVoiceInput} className={`p-2 rounded-xl transition-all text-black ${isListening ? 'text-red-500' : 'opacity-60 hover:opacity-100'}`}>
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  {isSearchDetected && (
                    <div className="flex items-center gap-2 ml-4 text-black opacity-60">
                      <Search size={14} />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] hidden sm:inline">Search Triggered</span>
                    </div>
                  )}
                </div>
                
                {isLoading ? (
                  <button onClick={stopGeneration} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <Square size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSendMessage} 
                    disabled={(!inputValue.trim() && pendingAttachments.length === 0) || isUploading} 
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${(!inputValue.trim() && pendingAttachments.length === 0) || isUploading ? 'opacity-20 cursor-not-allowed' : 'bg-black text-white hover:scale-105 active:scale-95 shadow-xl'}`}>
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentTheme={currentTheme} onThemeChange={onThemeChange} />
    </div>
  );
};

export default ChatInterface;
