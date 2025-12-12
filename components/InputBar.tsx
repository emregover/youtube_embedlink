import React, { useState, useRef, useEffect } from 'react';
import { extractVideoId } from '../utils/youtubeUtils';
import { LinkIcon, PlayIcon, AlertCircleIcon, XIcon } from './Icons';

interface InputBarProps {
  onVideoChange: (id: string) => void;
  currentVideoId: string;
}

export const InputBar: React.FC<InputBarProps> = ({ onVideoChange, currentVideoId }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    const newId = extractVideoId(trimmedInput);
    if (newId) {
      onVideoChange(newId);
      setInputValue('');
      inputRef.current?.blur();
    } else {
      setError('Invalid YouTube URL. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) setError(null);
  };

  const handleClear = () => {
    setInputValue('');
    setError(null);
    inputRef.current?.focus();
  };

  // Keyboard shortcut to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-2xl px-4 animate-float">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`
          relative flex items-center w-full p-2
          bg-white/10 border backdrop-blur-md rounded-2xl
          transition-all duration-300 ease-out
          ${error ? 'border-red-400/50 bg-red-900/10' : isFocused ? 'border-white/40 bg-white/20 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]' : 'border-white/10 hover:border-white/20 hover:bg-white/15'}
        `}>
          <div className="pl-4 pr-3 text-white/70">
            <LinkIcon className="w-5 h-5" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste YouTube or Shorts link..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-lg py-3 font-light"
          />

          {inputValue && (
             <button
             type="button"
             onClick={handleClear}
             className="p-2 mr-2 text-white/50 hover:text-white transition-colors"
           >
             <XIcon className="w-5 h-5" />
           </button>
          )}

          <button
            type="submit"
            disabled={!inputValue}
            className={`
              px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300
              ${inputValue 
                ? 'bg-white text-black hover:bg-white/90 translate-x-0 opacity-100' 
                : 'bg-white/5 text-white/30 cursor-not-allowed translate-x-4 opacity-0 hidden sm:flex'}
            `}
          >
            <span>Play</span>
            <PlayIcon className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Error Message Toast */}
        <div className={`
          absolute top-full left-0 mt-3 flex items-center gap-2 text-red-300 text-sm font-medium
          transition-all duration-300
          ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}>
          <AlertCircleIcon className="w-4 h-4" />
          {error}
        </div>

        {/* Helper Hint */}
        <div className={`
          absolute top-full right-0 mt-3 text-white/30 text-xs font-light
          transition-all duration-300
          ${isFocused && !error ? 'opacity-100' : 'opacity-0'}
        `}>
          Press <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to play
        </div>
      </form>
    </div>
  );
};