import React, { useState, useEffect } from 'react';
import { getEmbedUrl, getSimpleEmbedUrl } from '../utils/youtubeUtils';

interface VideoBackgroundProps {
  videoId: string;
  autoplay?: boolean;
  useFallback?: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoId, autoplay = true, useFallback = false }) => {
  const [currentVideoId, setCurrentVideoId] = useState(videoId);

  useEffect(() => {
    if (videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
    }
  }, [videoId, currentVideoId]);

  // Attempt to kickstart playback for Autoplay=ON only
  // If autoplay is off, we wait for user interaction (click).
  useEffect(() => {
    if (useFallback || !autoplay) return;

    const timer = setTimeout(() => {
      const iframe = document.getElementById('youtube-background-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: []
        }), '*');
      }
    }, 1500); 
    
    return () => clearTimeout(timer);
  }, [currentVideoId, useFallback, autoplay]);

  const handleBackdropClick = () => {
    // Only used when we are overlaying the iframe (Autoplay=ON)
    // We strictly want to ensure it plays and unmutes, avoiding accidental pauses
    const iframe = document.getElementById('youtube-background-player') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*');
      
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'unMute',
        args: []
      }), '*');
    }
  };

  const embedUrl = useFallback ? getSimpleEmbedUrl(currentVideoId, autoplay) : getEmbedUrl(currentVideoId, autoplay);
  
  // Logic to determine if we should let the user click the iframe directly.
  // 1. If Fallback: Yes (API won't work).
  // 2. If Autoplay OFF: Yes (Native click is best for starting unmuted playback).
  // 3. If Autoplay ON: No (We want to capture click to Unmute without Pausing).
  const allowDirectInteraction = useFallback || !autoplay;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-black">
      <div className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
        w-[150vw] h-[150vh] min-w-[177.77vh] min-h-[56.25vw]
      ">
        <iframe
          id="youtube-background-player"
          key={`${currentVideoId}-${useFallback ? 'basic' : 'api'}-${autoplay ? 'auto' : 'manual'}`} 
          src={embedUrl}
          title="Background Video"
          className="w-full h-full object-cover pointer-events-auto"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-colors ${!allowDirectInteraction ? 'cursor-pointer hover:bg-black/30' : 'pointer-events-none'}`} 
        onClick={!allowDirectInteraction ? handleBackdropClick : undefined}
        title={!allowDirectInteraction ? "Click to Unmute" : undefined}
      />
    </div>
  );
};