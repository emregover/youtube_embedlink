import React, { useState, useEffect, useRef } from 'react';
import { getEmbedUrl, getSimpleEmbedUrl, isSandboxedEnvironment } from '../utils/youtubeUtils';

interface VideoBackgroundProps {
  videoId: string;
  autoplay?: boolean;
  useFallback?: boolean;
  onDebugLog?: (msg: string) => void;
  onTogglePlay?: () => void;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videoId, 
  autoplay = true, 
  useFallback = false,
  onDebugLog,
  onTogglePlay
}) => {
  const [currentVideoId, setCurrentVideoId] = useState(videoId);
  const [isSandboxed, setIsSandboxed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sandboxStatus = isSandboxedEnvironment();
    setIsSandboxed(sandboxStatus);
    onDebugLog?.(`[VideoBG] Init: Sandboxed=${sandboxStatus}`);
  }, [onDebugLog]);

  useEffect(() => {
    if (videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
      onDebugLog?.(`[VideoBG] Video ID changed to ${videoId}`);
    }
  }, [videoId, currentVideoId, onDebugLog]);

  // Log mode changes
  useEffect(() => {
    const mode = (useFallback || isSandboxed) ? 'DIRECT (Iframe native controls)' : 'INTERCEPT (Overlay API control)';
    onDebugLog?.(`[VideoBG] Interaction Mode: ${mode} | Autoplay: ${autoplay}`);
  }, [useFallback, isSandboxed, autoplay, onDebugLog]);

  // Global click listener for debugging purposes
  // Captures clicks on the container before they hit the iframe or overlay
  useEffect(() => {
    if (!onDebugLog) return;

    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isOverlay = target.getAttribute('data-overlay') === 'true';
      const isIframe = target.tagName === 'IFRAME';
      
      onDebugLog(`[Click] Pos: ${e.clientX},${e.clientY} | Target: <${target.tagName.toLowerCase()}>${isOverlay ? ' [Overlay]' : ''}${isIframe ? ' [Iframe]' : ''}`);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleCaptureClick, { capture: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handleCaptureClick, { capture: true });
      }
    };
  }, [onDebugLog]);

  // Attempt to kickstart playback for Autoplay=ON only
  useEffect(() => {
    if (useFallback || !autoplay) return;

    const timer = setTimeout(() => {
      const iframe = document.getElementById('youtube-background-player') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        // Silent attempt
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
    // If parent provided a toggler, use it (Smart Toggle)
    if (onTogglePlay) {
      onDebugLog?.('[VideoBG] Overlay Clicked -> Delegating to onTogglePlay');
      onTogglePlay();
      return;
    }

    // Default "Force Play" behavior if no toggler
    onDebugLog?.('[VideoBG] Overlay Clicked -> Sending API Commands (Force Play)');
    
    const iframe = document.getElementById('youtube-background-player') as HTMLIFrameElement;
    if (!iframe) {
      onDebugLog?.('[VideoBG] ERROR: Iframe element missing');
      return;
    }
    
    if (!iframe.contentWindow) {
      onDebugLog?.('[VideoBG] ERROR: Iframe contentWindow missing');
      return;
    }

    try {
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
      
      onDebugLog?.('[VideoBG] Commands Sent: playVideo, unMute');
    } catch (e) {
      onDebugLog?.(`[VideoBG] Exception sending command: ${e}`);
    }
  };

  const embedUrl = useFallback ? getSimpleEmbedUrl(currentVideoId, autoplay) : getEmbedUrl(currentVideoId, autoplay);
  
  // Interaction Strategy:
  // 1. Fallback/Sandbox: API unavailable. Overlay allows click-through (pointer-events-none). User clicks Iframe.
  // 2. Standard: API available. Overlay catches click. User clicks Overlay -> JS sends play command.
  const allowDirectInteraction = useFallback || isSandboxed;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full overflow-hidden z-0 bg-black pointer-events-auto"
    >
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
        data-overlay="true"
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-colors ${!allowDirectInteraction ? 'cursor-pointer hover:bg-black/30' : 'pointer-events-none'}`} 
        onClick={!allowDirectInteraction ? handleBackdropClick : undefined}
        title={!allowDirectInteraction ? "Click to Toggle Play/Pause" : undefined}
      />
    </div>
  );
};