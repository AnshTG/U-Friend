import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Theme } from '../types.ts';
import { 
  User, FileText, Download, Play, Zap, Clock, 
  Copy, Check, RefreshCw, ExternalLink, Archive
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  theme: Theme;
  isLast?: boolean;
  onRegenerate?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, theme, isLast, onRegenerate }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSources = () => {
    if (!message.sources || message.sources.length === 0) return null;
    return (
      <div className="mt-4 pt-4 border-t border-black/10 space-y-2 animate-reveal">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black opacity-40">Sources</p>
        <div className="flex flex-wrap gap-2">
          {message.sources.map((source, idx) => (
            <a 
              key={idx} 
              href={source.uri} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3 py-1.5 bg-black/5 hover:bg-black text-black hover:text-white rounded-xl text-[9px] font-black uppercase tracking-tight flex items-center gap-2 transition-all active:scale-95 group max-w-full"
            >
              <ExternalLink size={10} className="flex-shrink-0 group-hover:rotate-12 transition-transform" />
              <span className="truncate">{source.title || 'Source'}</span>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {message.attachments.map((att) => {
          const isImage = att.type.startsWith('image/');
          const isVideo = att.type.startsWith('video/') || att.name.endsWith('.mp4') || att.name.endsWith('.mov');
          const isPdf = att.type.includes('pdf') || att.name.endsWith('.pdf');
          const isZip = att.type.includes('zip') || att.name.endsWith('.zip');

          return (
            <div key={att.id} className="group relative rounded-[1.2rem] overflow-hidden bg-black/5 border border-black/10 shadow-sm transition-all hover:shadow-md duration-500 cursor-pointer">
              {isImage && <img src={att.data} alt={att.name} className="w-32 sm:w-48 h-24 sm:h-32 object-cover" />}
              {isVideo && (
                <div className="w-32 sm:w-48 h-24 sm:h-32 relative flex items-center justify-center bg-black/10">
                   <video className="w-full h-full object-cover">
                     <source src={att.data} type={att.type} />
                   </video>
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-all">
                      <div className="p-2 rounded-full bg-white/80 text-black">
                        <Play size={14} fill="currentColor" />
                      </div>
                   </div>
                </div>
              )}
              {!isImage && !isVideo && (
                <div className="w-28 sm:w-40 h-24 sm:h-32 flex flex-col items-center justify-center p-3 text-center">
                  <div className="p-2 rounded-xl bg-black/5 mb-1.5 group-hover:scale-110 transition-all">
                    {isZip ? <Archive size={20} className="text-orange-500" /> : isPdf ? <FileText size={20} className="text-red-500" /> : <FileText size={20} className="text-black opacity-60" />}
                  </div>
                  <span className="text-[7px] font-black uppercase truncate w-full px-1 text-black opacity-40">{att.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-md gap-3">
                 <a href={att.data} download={att.name} className="p-2 bg-black text-white rounded-lg hover:scale-110 transition-all" title="Download" onClick={e => e.stopPropagation()}>
                    <Download size={14} />
                 </a>
                 {isVideo && (
                   <button onClick={() => {
                     const win = window.open();
                     win?.document.write(`<video controls style="max-width:100%;" src="${att.data}"></video>`);
                   }} className="p-2 bg-black text-white rounded-lg hover:scale-110 transition-all">
                     <Play size={14} fill="white" />
                   </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex items-start gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group/msg relative w-full overflow-hidden`}>
      <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-[0.8rem] sm:rounded-[1rem] flex items-center justify-center transition-all duration-500 group-hover/msg:scale-110 ${isUser ? 'bg-black text-white shadow-lg' : 'bg-black/10 text-black'}`}>
        {isUser ? <User size={16} strokeWidth={2.5} /> : <Zap size={16} className="text-black" fill="currentColor" />}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 max-w-[85%] sm:max-w-[80%]`}>
        <div className={`w-fit px-4 sm:px-5 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] relative prose prose-invert max-w-full transition-all duration-500 glass-panel border border-black/5 overflow-hidden break-words ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
          <div className="text-[13px] sm:text-[14px] leading-relaxed font-medium text-black break-words overflow-hidden">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children }: any) {
                  return !inline ? (
                    <div className="relative group/code my-3 w-full overflow-x-auto rounded-xl border border-black/5 bg-black/5 p-3 sm:p-4">
                      <code className="text-[11px] sm:text-[12px] leading-relaxed font-mono text-black block w-full">{children}</code>
                    </div>
                  ) : (
                    <code className="bg-black/10 px-1.5 py-0.5 rounded-lg font-bold text-black break-all">{children}</code>
                  );
                },
                p: ({children}) => <p className="mb-2 last:mb-0 text-black break-words">{children}</p>,
                li: ({children}) => <li className="text-black list-disc ml-4 break-words">{children}</li>,
                h1: ({children}) => <h1 className="text-black text-lg sm:text-xl font-black uppercase tracking-tight mb-2 break-words">{children}</h1>,
                h2: ({children}) => <h2 className="text-black text-base sm:text-lg font-bold mb-1 break-words">{children}</h2>,
                h3: ({children}) => <h3 className="text-black font-bold mb-1 break-words">{children}</h3>,
                a: ({children, href}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{children}</a>
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {renderAttachments()}
          {renderSources()}

          <div className={`flex items-center gap-2 mt-3 pt-2 border-t border-black/5 opacity-0 group-hover/msg:opacity-100 transition-all duration-500 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
             <button onClick={handleCopy} className="p-1.5 hover:bg-black/5 text-black rounded-lg transition-all active:scale-90">
                {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
             </button>
             {!isUser && isLast && onRegenerate && (
               <button onClick={onRegenerate} className="p-1.5 hover:bg-black/5 text-black rounded-lg transition-all">
                  <RefreshCw size={10} />
               </button>
             )}
             <div className="w-[1px] h-3 bg-black/10 mx-1"></div>
             <div className="flex items-center gap-1.5 text-[8px] opacity-40 font-black uppercase text-black">
                <Clock size={8} />
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;