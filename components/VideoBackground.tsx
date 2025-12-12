import React, { useState, useEffect } from 'react';
import { getEmbedUrl, getSimpleEmbedUrl } from '../utils/youtubeUtils';

interface VideoBackgroundProps {
  videoId: string;
  useFallback?: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoId, useFallback = false }) => {
  const [currentVideoId, setCurrentVideoId] = useState(videoId);

  // Sync prop to state
  useEffect(() => {
    if (videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
    }
  }, [videoId, currentVideoId]);

  // Auto-Play "Kickstart"
  // If the browser blocks standard autoplay, we send a manual "playVideo" command via JS.
  // We SKIP this if we are in fallback mode since the API is disabled.
  useEffect(() => {
    if (useFallback) return;

    const timer = setTimeout(() => {
      const iframe = document.getElementById('youtube-background-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        // Send the specific YouTube command to play
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: []
        }), '*');
      }
    }, 1500); // Wait 1.5s to ensure the player API is initialized
    
    return () => clearTimeout(timer);
  }, [currentVideoId, useFallback]);

  const embedUrl = useFallback ? getSimpleEmbedUrl(currentVideoId) : getEmbedUrl(currentVideoId);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-black">
      {/* 
        wrapper:
        - Scale 150% is usually enough to cover screen 16:9 on most devices without being too massive.
        - pointer-events-auto allowed so user can click 'Play' if autoplay policy blocks it.
      */}
      <div className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
        w-[150vw] h-[150vh] min-w-[177.77vh] min-h-[56.25vw]
      ">
        <iframe
          id="youtube-background-player" // Added ID for external control
          key={`${currentVideoId}-${useFallback ? 'basic' : 'api'}`} 
          src={embedUrl}
          title="Background Video"
          className="w-full h-full object-cover pointer-events-auto" // Ensure clickable
          frameBorder="0"
          // CRITICAL: Strict set of permissions + referrerPolicy
          // Removed 'sandbox' to match standard YouTube implementation
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      
      {/* Dark overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
    </div>
  );
};