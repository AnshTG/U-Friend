
export type Theme = 
  | 'modern-light' 
  | 'modern-dark' 
  | 'midnight-pro' 
  | 'emerald-calm' 
  | 'sunset-vibe' 
  | 'cyber-neon' 
  | 'royal-velvet' 
  | 'nordic-frost' 
  | 'coffee-latte';

export type ChatMode = 'general' | 'study' | 'search' | 'image';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // Base64
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  mode?: ChatMode;
  sources?: { title: string; uri: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  activeMode: ChatMode;
}

export interface AppState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  theme: Theme;
  cookieConsent: 'accepted' | 'denied' | 'pending';
}
