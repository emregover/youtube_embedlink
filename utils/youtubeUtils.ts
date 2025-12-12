/**
 * Extracts the YouTube Video ID from various URL formats.
 * Supports:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/shorts/ID
 * - https://m.youtube.com/...
 * - ID only inputs
 */
export const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  const cleanUrl = url.trim();

  // 1. Check if input is just the ID (11 chars alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // 2. Try URL object parsing (Standard & Reliable)
  try {
    const urlToParse = cleanUrl.match(/^https?:\/\//) ? cleanUrl : `https://${cleanUrl}`;
    const urlObj = new URL(urlToParse);
    
    // Handle youtu.be (e.g. https://youtu.be/ID?si=...)
    if (urlObj.hostname.includes('youtu.be')) {
      // Remove leading slash and trailing slashes if present
      const id = urlObj.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }
    
    // Handle youtube.com
    if (urlObj.hostname.includes('youtube.com')) {
      // Standard watch?v=ID
      if (urlObj.searchParams.has('v')) {
        const id = urlObj.searchParams.get('v');
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
      
      const path = urlObj.pathname;
      // Shorts
      if (path.startsWith('/shorts/')) {
        const id = path.split('/shorts/')[1]?.replace(/\/+$/, '');
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
      // Embed
      if (path.startsWith('/embed/')) {
        const id = path.split('/embed/')[1]?.replace(/\/+$/, '');
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
    }
  } catch (e) {
    console.warn("YouTube URL parsing failed:", e);
  }

  // 3. Fallback Regex for partials or messy inputs
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = cleanUrl.match(regExp);

  if (match && match[7]) {
    const potentialId = match[7];
    if (potentialId.length === 11) return potentialId;
    if (potentialId.length > 11) return potentialId.substring(0, 11);
  }

  return null;
};

/**
 * Generates the embed URL with logic to handle both standard and sandboxed environments.
 */
export const getEmbedUrl = (videoId: string): string => {
  // Ensure origin is clean (no trailing slash) which is required for strict origin checks
  const rawOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const origin = rawOrigin.replace(/\/$/, '');
  
  // DETECT AI STUDIO PREVIEW
  // If we are on a ".google" or "usercontent" domain, disable the API to prevent errors
  const isSandboxed = origin.includes('usercontent.goog') || origin.includes('googleusercontent');
  
  // If sandboxed, TURN OFF the API. The video will play, but custom controls won't work.
  const enableApi = isSandboxed ? '0' : '1'; 

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1', 
    controls: isSandboxed ? '1' : '0', // Show native controls if we can't use custom ones
    enablejsapi: enableApi,
    origin: origin,
    // Maintaining core looping functionality
    loop: '1',
    playlist: videoId,
    playsinline: '1'
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * Generates a basic embed URL without API dependencies.
 * Useful for fallback modes.
 */
export const getSimpleEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: videoId,
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};