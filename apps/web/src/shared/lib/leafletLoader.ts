/**
 * Dynamic Leaflet loader singleton.
 * Loads Leaflet library and CSS asynchronously from open CDN at ZERO cost (no API keys, no billing).
 */

declare global {
  interface Window {
    L?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not defined'));
  }

  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // 1. Inject Leaflet CSS if not already present
    const cssId = 'leaflet-css-cdn';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS if not already present
    const scriptId = 'leaflet-js-cdn';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.L) {
        resolve(window.L);
        return;
      }
      existingScript.addEventListener('load', () => {
        if (window.L) resolve(window.L);
        else reject(new Error('Leaflet script loaded but window.L is undefined'));
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Leaflet script'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.async = true;

    script.onload = () => {
      if (window.L) {
        resolve(window.L);
      } else {
        reject(new Error('Leaflet script loaded but window.L not found'));
      }
    };

    script.onerror = () => {
      // Fallback to cdnjs if unpkg fails
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      fallbackScript.crossOrigin = '';
      fallbackScript.async = true;
      fallbackScript.onload = () => {
        if (window.L) resolve(window.L);
        else reject(new Error('Failed to load Leaflet from CDN fallback'));
      };
      fallbackScript.onerror = () => {
        reject(new Error('Failed to load Leaflet library from CDNs'));
      };
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
