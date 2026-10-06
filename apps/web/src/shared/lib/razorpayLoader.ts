/**
 * Razorpay Checkout SDK dynamic script loader.
 * Loads https://checkout.razorpay.com/v1/checkout.js securely.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function loadRazorpay(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('razorpay-checkout-sdk');
    if (existing) {
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }
      existing.addEventListener('load', () => resolve(window.Razorpay));
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error('Razorpay SDK loaded but window.Razorpay is undefined'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Razorpay Checkout script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
