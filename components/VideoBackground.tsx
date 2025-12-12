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
    // We send both playVideo and unMute.
    // This handles the case where autoplay was OFF (starts playing)
    // AND the case where autoplay was ON (ensures sound is on if browser muted it).
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
  
  // Interaction Logic:
  // If we are in Fallback Mode (API disabled/unavailable):
  //   - We MUST let the click pass through to the iframe (`allowDirectInteraction = true`).
  //   - The user will interact with the native YouTube player controls (or thumbnail click).
  // If we are in Standard Mode (API connected):
  //   - We BLOCK the pass-through (`allowDirectInteraction = false`).
  //   - We capture the click on the overlay div.
  //   - We use the `handleBackdropClick` to strictly send API commands.
  //   - This is more reliable than hoping the `controls=0` iframe handles the click correctly.
  const allowDirectInteraction = useFallback;

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
      
      {/* 
         Overlay behaves as the "Play Button" for the whole screen.
         - If !allowDirectInteraction: It captures clicks and calls API. Cursor is pointer.
         - If allowDirectInteraction: It ignores clicks (pointer-events-none), letting them hit the iframe.
      */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-colors ${!allowDirectInteraction ? 'cursor-pointer hover:bg-black/30' : 'pointer-events-none'}`} 
        onClick={!allowDirectInteraction ? handleBackdropClick : undefined}
        title={!allowDirectInteraction ? "Click to Play / Unmute" : undefined}
      />
    </div>
  );
};