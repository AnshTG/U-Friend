import React, { useRef } from 'react';
import { Attachment, Theme } from '../types';
import { Paperclip, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface FileUploaderProps {
  onFileAdded: (attachment: Attachment) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  disabled: boolean;
  theme: Theme;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileAdded, onUploadStart, onUploadEnd, disabled, theme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMimeTypeFromName = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'mp4': return 'video/mp4';
      case 'mov': return 'video/quicktime';
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'json': return 'application/json';
      case 'md': return 'text/markdown';
      default: return 'application/octet-stream';
    }
  };

  const processFile = (file: File | Blob, name: string): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const attachment: Attachment = {
            id: Math.random().toString(36).substring(2, 9),
            name: name,
            type: file instanceof File ? file.type : getMimeTypeFromName(name),
            data: event.target.result as string,
            size: file.size,
          };
          onFileAdded(attachment);
        }
        resolve();
      };
      reader.onerror = () => resolve();
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (onUploadStart) onUploadStart();

    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        try {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(file);
          const zipEntries = Object.keys(loadedZip.files).filter(name => !loadedZip.files[name].dir);
          
          // Take up to 7 items from zip
          const itemsToProcess = zipEntries.slice(0, 7);
          for (const name of itemsToProcess) {
            const zipFile = loadedZip.files[name];
            const content = await zipFile.async('blob');
            await processFile(content, name);
          }
        } catch (err) {
          console.error("ZIP processing error:", err);
        }
      } else {
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
          alert(`File ${file.name} exceeds 100MB limit.`);
          continue;
        }
        await processFile(file, file.name);
      }
    }

    if (onUploadEnd) onUploadEnd();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,video/*,application/pdf,.zip,.txt,.json,.md"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={`
          p-2.5 rounded-xl transition-all transform active:scale-90
          hover:bg-black/5 text-black
          ${disabled ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:text-blue-500'}
        `}
        title="Input"
      >
        <Paperclip size={18} />
      </button>
    </>
  );
};

export default FileUploader;