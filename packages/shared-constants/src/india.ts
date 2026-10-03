// ============================================================
// PetVerse — India-First Configuration
// Single source of truth for all India-specific constants.
// ============================================================

// ─── Currency ─────────────────────────────────────────────────
export const INDIA_CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
  /** Razorpay and most Indian payment gateways work in paise (1 INR = 100 paise) */
  subunit: 100,
} as const;

// ─── Locale & Timezone ────────────────────────────────────────
export const INDIA_LOCALE = 'en-IN' as const;
export const INDIA_TIMEZONE = 'Asia/Kolkata' as const;

// ─── Phone Number ─────────────────────────────────────────────
export const INDIA_PHONE = {
  countryCode: '+91',
  /** Valid Indian mobile numbers: 10 digits starting with 6–9 */
  regex: /^(\+91[\s-]?)?[6-9]\d{9}$/,
  digits: 10,
  placeholder: '+91 98765 43210',
} as const;

// ─── PIN Code ─────────────────────────────────────────────────
export const INDIA_PIN_CODE = {
  /** All India PIN codes are exactly 6 digits */
  regex: /^\d{6}$/,
  length: 6,
  placeholder: '400001',
} as const;

// ─── GST ──────────────────────────────────────────────────────
export const INDIA_GST = {
  standard: 18,   // 18% for most pet supplies, grooming services
  reduced: 12,    // 12% for some processed food items
  low: 5,         // 5% for basic food items
  exempt: 0,      // 0% for live animals, raw food
} as const;

// ─── Emergency Numbers ────────────────────────────────────────
export const INDIA_EMERGENCY_NUMBERS = {
  police: '100',
  ambulance: '108',
  fire: '101',
  /** Animal Welfare Board of India helpline */
  animalHelpline: '1962',
  /** National Poison Control */
  poisonControl: '1800-116-117',
  /** PCA / SPCA emergency (common across major cities) */
  spcaEmergency: '1800-102-0825',
  /** Women safety (also useful for reporting animal abuse) */
  womenSafety: '1091',
} as const;

// ─── Indian States & Union Territories ───────────────────────
export const INDIA_STATES = [
  // 28 States
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UT' },
  { code: 'AP', name: 'Andhra Pradesh', type: 'State' },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'State' },
  { code: 'AS', name: 'Assam', type: 'State' },
  { code: 'BR', name: 'Bihar', type: 'State' },
  { code: 'CH', name: 'Chandigarh', type: 'UT' },
  { code: 'CG', name: 'Chhattisgarh', type: 'State' },
  { code: 'DD', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT' },
  { code: 'DL', name: 'Delhi', type: 'UT' },
  { code: 'GA', name: 'Goa', type: 'State' },
  { code: 'GJ', name: 'Gujarat', type: 'State' },
  { code: 'HR', name: 'Haryana', type: 'State' },
  { code: 'HP', name: 'Himachal Pradesh', type: 'State' },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'UT' },
  { code: 'JH', name: 'Jharkhand', type: 'State' },
  { code: 'KA', name: 'Karnataka', type: 'State' },
  { code: 'KL', name: 'Kerala', type: 'State' },
  { code: 'LA', name: 'Ladakh', type: 'UT' },
  { code: 'LD', name: 'Lakshadweep', type: 'UT' },
  { code: 'MP', name: 'Madhya Pradesh', type: 'State' },
  { code: 'MH', name: 'Maharashtra', type: 'State' },
  { code: 'MN', name: 'Manipur', type: 'State' },
  { code: 'ML', name: 'Meghalaya', type: 'State' },
  { code: 'MZ', name: 'Mizoram', type: 'State' },
  { code: 'NL', name: 'Nagaland', type: 'State' },
  { code: 'OD', name: 'Odisha', type: 'State' },
  { code: 'PY', name: 'Puducherry', type: 'UT' },
  { code: 'PB', name: 'Punjab', type: 'State' },
  { code: 'RJ', name: 'Rajasthan', type: 'State' },
  { code: 'SK', name: 'Sikkim', type: 'State' },
  { code: 'TN', name: 'Tamil Nadu', type: 'State' },
  { code: 'TS', name: 'Telangana', type: 'State' },
  { code: 'TR', name: 'Tripura', type: 'State' },
  { code: 'UP', name: 'Uttar Pradesh', type: 'State' },
  { code: 'UK', name: 'Uttarakhand', type: 'State' },
  { code: 'WB', name: 'West Bengal', type: 'State' },
] as const;

export type IndiaStateCode = typeof INDIA_STATES[number]['code'];
export type IndiaStateName = typeof INDIA_STATES[number]['name'];

// ─── Major Cities ─────────────────────────────────────────────
export const INDIA_MAJOR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Surat',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
  'Varanasi',
  'Srinagar',
  'Aurangabad',
  'Dhanbad',
  'Amritsar',
  'Navi Mumbai',
  'Allahabad',
  'Ranchi',
  'Howrah',
  'Coimbatore',
  'Jabalpur',
  'Gwalior',
  'Vijayawada',
  'Jodhpur',
  'Madurai',
  'Raipur',
  'Kota',
  'Chandigarh',
  'Guwahati',
  'Solapur',
  'Hubli',
  'Mysuru',
  'Thiruvananthapuram',
  'Bhubaneswar',
] as const;

// ─── Veterinary-Specific India Constants ──────────────────────
/** Key rabies-endemic states in India (affects protocol recommendations) */
export const INDIA_RABIES_ENDEMIC_STATES: IndiaStateCode[] = [
  'UP', 'RJ', 'MP', 'HR', 'GJ', 'MH', 'WB', 'BR', 'JH'
];

/** India-specific mandatory vaccines per PCA/AWBI guidelines */
export const INDIA_MANDATORY_VACCINES = {
  dog: ['rabies', 'dhpp', 'leptospirosis'],
  cat: ['rabies', 'fvrcp'],
} as const;

/** Common Indian veterinary hospital chains */
export const INDIA_VET_CHAINS = [
  'Cessna Lifeline Veterinary Hospital',
  'Critter Care Veterinary',
  'Charlie\'s Animal Rescue Centre (CARE)',
  'Blue Cross of India',
  'CUPA (Compassion Unlimited Plus Action)',
  'People for Animals (PFA)',
  'PAWS Mumbai',
  'Animal Aid Unlimited',
  'Friendicoes SECA',
] as const;

// ─── Coordinate Bounds for India ─────────────────────────────
export const INDIA_BOUNDS = {
  /** Approximate bounding box for India */
  minLat: 8.4,
  maxLat: 37.6,
  minLng: 68.7,
  maxLng: 97.4,
  /** Geographic center of India */
  centerLat: 20.5937,
  centerLng: 78.9629,
} as const;

/** Default coordinates for major Indian cities (for dev-seed data) */
export const INDIA_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Mumbai:       { lat: 19.0760, lng: 72.8777 },
  Delhi:        { lat: 28.6139, lng: 77.2090 },
  Bengaluru:    { lat: 12.9716, lng: 77.5946 },
  Hyderabad:    { lat: 17.3850, lng: 78.4867 },
  Ahmedabad:    { lat: 23.0225, lng: 72.5714 },
  Chennai:      { lat: 13.0827, lng: 80.2707 },
  Kolkata:      { lat: 22.5726, lng: 88.3639 },
  Pune:         { lat: 18.5204, lng: 73.8567 },
  Jaipur:       { lat: 26.9124, lng: 75.7873 },
  Surat:        { lat: 21.1702, lng: 72.8311 },
};

// ─── Payment Methods ──────────────────────────────────────────
export const INDIA_PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI (GPay, PhonePe, Paytm)', icon: '📱' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'wallet', label: 'Paytm / Mobikwik Wallet', icon: '👛' },
  { id: 'emi', label: 'EMI (No Cost EMI available)', icon: '📅' },
] as const;

// ─── Unified Export ───────────────────────────────────────────
export const INDIA_CONFIG = {
  currency: INDIA_CURRENCY,
  locale: INDIA_LOCALE,
  timezone: INDIA_TIMEZONE,
  phone: INDIA_PHONE,
  pinCode: INDIA_PIN_CODE,
  gst: INDIA_GST,
  emergencyNumbers: INDIA_EMERGENCY_NUMBERS,
  states: INDIA_STATES,
  majorCities: INDIA_MAJOR_CITIES,
  bounds: INDIA_BOUNDS,
  cityCoords: INDIA_CITY_COORDS,
  paymentMethods: INDIA_PAYMENT_METHODS,
} as const;
