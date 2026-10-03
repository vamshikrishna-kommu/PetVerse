// ============================================================
// PetVerse — Shared Constants
// ============================================================

// ─── India-First Configuration (re-exported for convenience) ──
export * from './india';

export const APP_NAME = 'PetVerse';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'An Intelligent AI-Powered Pet Care & Management Ecosystem — India\'s #1 Pet Care Ecosystem';

// ─── API ─────────────────────────────────────────────────────
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// ─── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ─── Auth ────────────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const OTP_EXPIRY_MINUTES = 5;
export const BCRYPT_ROUNDS = 12;

// ─── Rate Limits ─────────────────────────────────────────────
export const RATE_LIMIT_GLOBAL_MAX = 100;
export const RATE_LIMIT_GLOBAL_WINDOW_MS = 15 * 60 * 1000; // 15 min
export const RATE_LIMIT_AUTH_MAX = 10;
export const RATE_LIMIT_AUTH_WINDOW_MS = 60 * 1000; // 1 min

// ─── File Upload ─────────────────────────────────────────────
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// ─── Error Codes ─────────────────────────────────────────────
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',

  // Business
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PET_NOT_OWNED: 'PET_NOT_OWNED',
  QR_NOT_FOUND: 'QR_NOT_FOUND',
} as const;

// ─── Pet Species Labels ───────────────────────────────────────
export const PET_SPECIES_LABELS: Record<string, string> = {
  dog: '🐶 Dog',
  cat: '🐱 Cat',
  bird: '🦜 Bird',
  rabbit: '🐰 Rabbit',
  fish: '🐠 Fish',
  reptile: '🦎 Reptile',
  other: '🐾 Other',
};

// ─── Expense Category Labels ──────────────────────────────────
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  food: '🥩 Food',
  vet: '🏥 Vet',
  medicine: '💊 Medicine',
  grooming: '✂️ Grooming',
  toys: '🎾 Toys',
  insurance: '🛡️ Insurance',
  other: '📦 Other',
};

// ─── Appointment Type Labels ──────────────────────────────────
export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  checkup: 'Health Checkup',
  vaccination: 'Vaccination',
  surgery: 'Surgery',
  grooming: 'Grooming',
  consultation: 'Consultation',
};

// ─── Notification Events ──────────────────────────────────────
export const NOTIFICATION_EVENTS = {
  REMINDER_DUE: 'reminder.due',
  APPOINTMENT_UPCOMING: 'appointment.upcoming',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  POST_LIKED: 'post.liked',
  POST_COMMENTED: 'post.commented',
  ADOPTION_APPLICATION: 'adoption.application',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  PET_FOUND_NEARBY: 'lost_found.pet_found_nearby',
  EMERGENCY_ALERT: 'emergency.alert',
} as const;

// ─── Cloudinary Folders ───────────────────────────────────────
export const CLOUDINARY_FOLDERS = {
  USER_AVATARS: 'petverse/avatars/users',
  PET_AVATARS: 'petverse/avatars/pets',
  MEDICAL_RECORDS: 'petverse/medical',
  HEALTH_ATTACHMENTS: 'petverse/health/attachments',
  HEALTH_IMAGING: 'petverse/health/imaging',
  COMMUNITY_POSTS: 'petverse/community/posts',
  PRODUCTS: 'petverse/products',
  LOST_FOUND: 'petverse/lost-found',
  ADOPTION: 'petverse/adoption',
} as const;

// ─── Health Labels ────────────────────────────────────────────
export const HEALTH_SEVERITY_LABELS: Record<string, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
  critical: 'Critical',
};

export const VISIT_TYPE_LABELS: Record<string, string> = {
  routine_checkup: 'Routine Checkup',
  sick_visit: 'Sick Visit',
  follow_up: 'Follow-up',
  emergency: 'Emergency',
  vaccination: 'Vaccination',
  surgery: 'Surgery',
  dental: 'Dental',
  dermatology: 'Dermatology',
  specialist: 'Specialist',
  telemedicine: 'Telemedicine',
  other: 'Other',
};

export const LAB_CATEGORY_LABELS: Record<string, string> = {
  blood: '🩸 Blood Panel',
  urine: '🧪 Urinalysis',
  biochemistry: '⚗️ Biochemistry',
  hormones: '🔬 Hormones',
  microbiology: '🦠 Microbiology',
  parasitology: '🐛 Parasitology',
  other: '📋 Other',
};

export const IMAGING_TYPE_LABELS: Record<string, string> = {
  xray: '🩻 X-Ray',
  mri: '🧲 MRI',
  ct: '💠 CT Scan',
  ultrasound: '📡 Ultrasound',
  ecg: '💓 ECG',
  other: '🔭 Other',
};

export const PRESCRIPTION_ROUTE_LABELS: Record<string, string> = {
  oral: 'Oral',
  topical: 'Topical',
  injectable: 'Injectable',
  inhaled: 'Inhaled',
  ophthalmic: 'Ophthalmic (Eye)',
  otic: 'Otic (Ear)',
  rectal: 'Rectal',
  other: 'Other',
};

export const ALLERGY_TYPE_LABELS: Record<string, string> = {
  medication: '💊 Medication',
  food: '🍖 Food',
  environmental: '🌿 Environmental',
  contact: '✋ Contact',
};

export const CONDITION_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  resolved: 'Resolved',
  monitoring: 'Monitoring',
  recurring: 'Recurring',
};

// ─── Query Keys (TanStack Query) ──────────────────────────────
export const QUERY_KEYS = {
  AUTH_ME: ['auth', 'me'],
  PETS: (userId?: string) => (userId ? ['pets', userId] : ['pets']),
  PET: (petId: string) => ['pets', petId],
  PET_RECORDS: (petId: string) => ['pets', petId, 'records'],
  PET_VACCINATIONS: (petId: string) => ['pets', petId, 'vaccinations'],
  PET_GROWTH: (petId: string) => ['pets', petId, 'growth'],
  // Health Management
  HEALTH_DASHBOARD: (petId: string) => ['health', petId, 'dashboard'],
  HEALTH_ANALYTICS: (petId: string) => ['health', petId, 'analytics'],
  HEALTH_SUMMARY: (petId: string) => ['health', petId, 'summary'],
  HEALTH_RECORDS: (petId: string) => ['health', petId, 'records'],
  HEALTH_RECORD: (petId: string, recordId: string) => ['health', petId, 'records', recordId],
  HEALTH_VITALS: (petId: string) => ['health', petId, 'vitals'],
  HEALTH_VITALS_LATEST: (petId: string) => ['health', petId, 'vitals', 'latest'],
  HEALTH_CONDITIONS: (petId: string) => ['health', petId, 'conditions'],
  HEALTH_ALLERGIES: (petId: string) => ['health', petId, 'allergies'],
  HEALTH_PRESCRIPTIONS: (petId: string) => ['health', petId, 'prescriptions'],
  HEALTH_LABS: (petId: string) => ['health', petId, 'labs'],
  HEALTH_LAB: (petId: string, labId: string) => ['health', petId, 'labs', labId],
  HEALTH_IMAGING: (petId: string) => ['health', petId, 'imaging'],
  HEALTH_IMAGING_STUDY: (petId: string, studyId: string) => ['health', petId, 'imaging', studyId],
  HEALTH_SURGERIES: (petId: string) => ['health', petId, 'surgeries'],
  HEALTH_ATTACHMENTS: (petId: string) => ['health', petId, 'attachments'],
  // Vaccination Management
  VACCINATIONS: {
    ALL: ['vaccinations'] as const,
    SCHEDULE: (petId: string) => ['vaccinations', 'schedule', petId] as const,
    ANALYTICS: (petId: string) => ['vaccinations', 'analytics', petId] as const,
    RECORD: (id: string) => ['vaccinations', 'record', id] as const,
  },
  MEDICATIONS: {
    DIRECTORY: ['medications', 'directory'] as const,
    CATEGORIES: ['medications', 'categories'] as const,
    BY_PET: (petId: string) => ['medications', 'prescriptions', petId] as const,
    COURSES: (petId: string) => ['medications', 'courses', petId] as const,
    ADMINISTRATIONS: (courseId: string) => ['medications', 'administrations', courseId] as const,
    COMPLIANCE: (petId: string, courseId: string) => ['medications', 'compliance', petId, courseId] as const,
  },
  VACCINATION_SCHEDULE: (petId: string) => ['vaccination', petId, 'schedule'],
  VACCINATION_ANALYTICS: (petId: string) => ['vaccination', petId, 'analytics'],
  VACCINATION_RECORDS: (petId: string) => ['vaccination', petId, 'records'],
  VACCINATION_REACTIONS: (petId: string) => ['vaccination', petId, 'reactions'],
  VACCINATION_CERTIFICATES: (petId: string) => ['vaccination', petId, 'certificates'],
  VACCINE_DEFINITIONS: (species?: string) => ['vaccination', 'definitions', species],
  // Other
  REMINDERS: ['reminders'],
  APPOINTMENTS: ['appointments'],
  POSTS: (filters?: Record<string, unknown>) => ['posts', filters],
  POST: (postId: string) => ['posts', postId],
  PRODUCTS: (filters?: Record<string, unknown>) => ['products', filters],
  PRODUCT: (productId: string) => ['products', productId],
  ORDERS: ['orders'],
  EXPENSES: (filters?: Record<string, unknown>) => ['expenses', filters],
  NOTIFICATIONS: ['notifications'],
  LOST_FOUND: (filters?: Record<string, unknown>) => ['lost-found', filters],
  ADOPTION: (filters?: Record<string, unknown>) => ['adoption', filters],
  NEARBY: (coords: [number, number], type?: string) => ['nearby', coords, type],
  REVIEWS: (targetId: string) => ['reviews', targetId],
} as const;
