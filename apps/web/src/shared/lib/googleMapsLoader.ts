/**
 * Google Maps JavaScript API dynamic loader singleton
 * Loads Google Maps JavaScript API securely using VITE_GOOGLE_MAPS_API_KEY.
 */

declare global {
  interface Window {
    google?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function isGoogleMapsConfigured(): boolean {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 0 &&
    !trimmed.includes('your-') &&
    !trimmed.includes('change_me') &&
    !trimmed.includes('placeholder')
  );
}

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not defined'));
  }

  // Already loaded
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!isGoogleMapsConfigured()) {
    return Promise.reject(new Error('Google Maps API key is not configured or using placeholder'));
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already injected
    const existingScript = document.getElementById('google-maps-js-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded but google.maps is not available'));
        }
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps script'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        // In async mode, google.maps is initialized shortly
        const interval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(interval);
            resolve(window.google.maps);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(interval);
          if (window.google?.maps) {
            resolve(window.google.maps);
          } else {
            reject(new Error('Timed out waiting for google.maps initialization'));
          }
        }, 5000);
      }
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps JavaScript API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
