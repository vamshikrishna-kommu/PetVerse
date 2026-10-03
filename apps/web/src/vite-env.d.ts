/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom/vitest" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_VAPID_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  /** Razorpay Key ID for frontend Checkout SDK — India-first payment gateway */
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}
