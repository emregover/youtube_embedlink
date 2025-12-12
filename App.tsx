import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VideoBackground } from './components/VideoBackground';
import { InputBar } from './components/InputBar';
import { AlertCircleIcon } from './components/Icons';

const App: React.FC = () => {
  // Video Configuration State
  const [videoConfig, setVideoConfig] = useState({
    id: 'n_Dv4JMiwK8', // Default: "Sci-Fi Cyberpunk City"
    autoplay: true
  });

  // Enable debug by default to help diagnose issues
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const isApiConnected = useRef(false);

  // Logger helper
  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  // Listen for YouTube Iframe API messages
  useEffect(() => {
    // Reset state on video change or mount
    isApiConnected.current = false;
    setHasConnectionError(false);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'undefined';
    addLog(`App mounted/Video changed.`);
    addLog(`Domain: ${origin}`);
    addLog(`Strategy: Standard YouTube + Widget Referrer`);

    const handleMessage = (event: MessageEvent) => {
      // YouTube messages are usually JSON strings or objects
      if (event.origin.includes('youtube')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          // Filter for relevant events to avoid noise
          if (data.event === 'infoDelivery' && data.info) {
             if (data.info.playerState !== undefined) {
               const states: Record<number, string> = {
                 '-1': 'Unstarted',
                 '0': 'Ended',
                 '1': 'Playing',
                 '2': 'Paused',
                 '3': 'Buffering',
                 '5': 'Cued'
               };
               addLog(`State Change: ${states[data.info.playerState] || data.info.playerState}`);
             }
             if (data.info.error) {
               addLog(`ERROR CODE: ${data.info.error}`);
               addLog('Meaning: 100/101/150 = Owner blocks embed.');
               // For explicit embed errors, we force basic mode immediately
               setHasConnectionError(true);
             }
          } else if (data.event === 'onReady') {
            isApiConnected.current = true;
            // Only clear error if we aren't already in a forced error state from a specific error code
            setHasConnectionError(false);
            addLog('Player Ready - API Connected');
            
            // Try to force play on ready ONLY IF autoplay is enabled
            if (videoConfig.autoplay) {
              const iframe = document.getElementById('youtube-background-player') as HTMLIFrameElement;
              if (iframe && iframe.contentWindow) {
                 iframe.contentWindow.postMessage(JSON.stringify({
                   event: 'command',
                   func: 'playVideo',
                   args: []
                 }), '*');
              }
            }

          } else if (data.event === 'initialDelivery') {
             isApiConnected.current = true;
             setHasConnectionError(false);
             addLog('Initial Delivery (Connection Est.)');
          }
        } catch (e) {
          // Ignore parse errors from other sources
        }
      }
    };

    window.addEventListener('message', handleMessage);
    addLog('Listener attached. Waiting for YouTube API...');

    // NOTE: Removed connection timeout logic entirely to prevent any unwanted reloads.
    // If the API connects, great. If not, the video will still play in basic mode without forcing a state change.
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [addLog, videoConfig.id, videoConfig.autoplay]); // Re-run on video config change

  // Manual Play Trigger
  const forcePlay = () => {
    const iframe = document.getElementById('youtube-background-player') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      addLog('Sending Force Play command...');
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*');
    } else {
      addLog('Could not find iframe to send command.');
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    addLog('Logs copied to clipboard.');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Component */}
      <VideoBackground 
        videoId={videoConfig.id} 
        autoplay={videoConfig.autoplay}
        useFallback={hasConnectionError}
        onDebugLog={addLog}
      />

      {/* Main Content Area */}
      <main className="z-10 w-full flex flex-col items-center justify-center space-y-8 px-4 pointer-events-none">
        
        {/* Header/Title */}
        <div className="text-center space-y-2 pointer-events-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-2xl">
            TubeBackdrop
          </h1>
          <p className="text-white/60 text-lg md:text-xl font-light tracking-wide max-w-md mx-auto">
            Transform your screen. Paste a link.
          </p>
        </div>

        {/* Input Interaction */}
        <div className="w-full flex justify-center pointer-events-auto">
          <InputBar 
            onVideoChange={(id, autoplay) => {
              setVideoConfig({ id, autoplay });
              addLog(`Switched video to: ${id} (Autoplay: ${autoplay})`);
            }} 
            currentVideoId={videoConfig.id} 
          />
        </div>

      </main>

      {/* Footer Info */}
      <footer className="absolute bottom-6 text-white/20 text-xs font-light tracking-widest uppercase flex flex-col items-center gap-2 pointer-events-auto">
        <span>Designed for Focus & Ambience</span>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="hover:text-white/50 transition-colors underline decoration-dotted"
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
          
          {hasConnectionError && (
             <span className="flex items-center gap-1 text-yellow-500/50" title="Running in Basic Mode (API Disconnected)">
               <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50"></span>
               Basic Mode
             </span>
          )}
        </div>
      </footer>

      {/* DEBUG PANEL */}
      {showDebug && (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 w-80 max-h-[50vh]">
          
          <div className="p-4 rounded-lg bg-black/80 border border-green-500/30 backdrop-blur-md text-xs font-mono text-green-400 shadow-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-green-500/30 pb-2">
               <span className="font-bold">DEBUG & LOGS</span>
               <div className="flex gap-1">
                 <span className={`w-2 h-2 rounded-full ${isApiConnected.current ? 'bg-green-500' : hasConnectionError ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></span>
               </div>
            </div>
            
            <div className="space-y-1">
               <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-[10px]">Video ID</span>
                <span>{videoConfig.id}</span>
               </div>
               <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-[10px]">Autoplay</span>
                <span>{videoConfig.autoplay ? 'ON' : 'OFF'}</span>
               </div>
               <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-[10px]">Mode</span>
                <span>{hasConnectionError ? 'Basic (Fallback)' : 'API (Standard)'}</span>
               </div>
               <div>
                  <a 
                    href={`https://www.youtube.com/watch?v=${videoConfig.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline block text-right"
                  >
                    Open on YouTube
                  </a>
               </div>
            </div>

            <div className="h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/20 bg-black/50 p-2 rounded border border-white/5 font-mono text-[10px] leading-tight flex flex-col-reverse">
               {logs.length === 0 && <span className="text-gray-600 italic">No events yet...</span>}
               {logs.map((log, i) => (
                 <div key={i} className="border-b border-white/5 last:border-0 py-0.5 break-words">
                   {log}
                 </div>
               ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={forcePlay}
                disabled={hasConnectionError}
                className={`flex-1 py-1.5 rounded border transition-colors ${hasConnectionError ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-green-900/30 hover:bg-green-900/50 text-green-200 border-green-500/30'}`}
              >
                Force Play
              </button>
              <button 
                onClick={copyLogs}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 py-1.5 rounded border border-white/10 transition-colors"
              >
                Copy Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;