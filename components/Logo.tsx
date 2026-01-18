
import React from 'react';

const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
        <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" className="stroke-current opacity-20" strokeWidth="2" />
        <path d="M50 15L82 31V69L50 85L18 69V31L50 15Z" className="stroke-current" strokeWidth="4" />
        <path d="M35 35V55C35 63.2843 41.7157 70 50 70C58.2843 70 65 63.2843 65 55V35" className="stroke-current" strokeWidth="8" strokeLinecap="round" />
        <circle cx="50" cy="50" r="4" className="fill-current animate-pulse" />
      </svg>
    </div>
  );
};

export default Logo;
