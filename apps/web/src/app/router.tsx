import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Outlet,
} from 'react-router-dom';
import AppLayout from '@/shared/components/layout/AppLayout';
import AuthLayout from '@/shared/components/layout/AuthLayout';
import ProtectedRoute from '@/shared/components/layout/ProtectedRoute';
import AdminRoute from '@/shared/components/layout/AdminRoute';
import PageLoader from '@/shared/components/feedback/PageLoader';

// ─── Lazy Pages ────────────────────────────────────────────

// Auth
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const OTPPage = lazy(() => import('@/features/auth/pages/OTPPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));

// Core & Settings
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/features/profile/pages/SettingsPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));

// Pets & Health
const PetsPage = lazy(() => import('@/features/pets/pages/PetsPage'));
const AddPetPage = lazy(() => import('@/features/pets/pages/AddPetPage'));
const PetDetailPage = lazy(() => import('@/features/pets/pages/PetDetailPage'));
const PetHealthPage = lazy(() => import('@/features/health/pages/PetHealthPage'));
const PetVaccinationsPage = lazy(() => import('@/features/vaccination/pages/VaccinationDashboardPage').then(m => ({ default: m.VaccinationDashboardPage })));
const PetMedicationsPage = lazy(() => import('@/features/medication/pages/MedicationDashboardPage'));
const PetGrowthPage = lazy(() => import('@/features/growth/pages/PetGrowthPage'));
const RemindersPage = lazy(() => import('@/features/reminders/pages/RemindersPage'));

// Safety & Identification
const LostFoundPage = lazy(() => import('@/features/lost-found/pages/LostFoundPage'));
const EmergencyPage = lazy(() => import('@/features/emergency/pages/EmergencyPage'));
const PetQRPage = lazy(() => import('@/features/qr-identity/pages/PetQRPage'));
const PublicPetPage = lazy(() => import('@/features/qr-identity/pages/PublicPetPage'));

// AI Hub
const AIHubPage = lazy(() => import('@/features/ai-assistant/pages/AIHubPage'));
const AIAssistantPage = lazy(() => import('@/features/ai-assistant/pages/AIAssistantPage'));
const BreedScanPage = lazy(() => import('@/features/ai-assistant/pages/BreedScanPage'));
const DietRecommendPage = lazy(() => import('@/features/ai-assistant/pages/DietRecommendPage'));

// Appointments
const AppointmentsPage = lazy(() => import('@/features/appointments/pages/AppointmentsPage'));
const BookAppointmentPage = lazy(() => import('@/features/appointments/pages/BookAppointmentPage'));

// Nearby Services
const NearbyPage = lazy(() => import('@/features/nearby/pages/NearbyPage'));
const ProviderDetailPage = lazy(() => import('@/features/nearby/pages/ProviderDetailPage'));

// Expenses, Community, Marketplace, Adoption
const ExpensesPage = lazy(() => import('@/features/expenses/pages/ExpensesPage'));
const CommunityPage = lazy(() => import('@/features/community/pages/CommunityPage'));
const CommunityPostDetailPage = lazy(() => import('@/features/community/pages/CommunityPostDetailPage'));
const MarketplacePage = lazy(() => import('@/features/marketplace/pages/MarketplacePage'));
const AdoptionPage = lazy(() => import('@/features/adoption/pages/AdoptionPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'));
const AdminPetsPage = lazy(() => import('@/features/admin/pages/AdminPetsPage'));
const AdminLostFoundPage = lazy(() => import('@/features/admin/pages/AdminLostFoundPage'));
const AdminAuditLogsPage = lazy(() => import('@/features/admin/pages/AdminAuditLogsPage'));
const AutomationBuilder = lazy(() => import('@/features/admin/pages/AutomationBuilder'));
const EventMonitorDashboard = lazy(() => import('@/features/admin/pages/EventMonitorDashboard'));
const NotificationAnalytics = lazy(() => import('@/features/admin/pages/NotificationAnalytics'));

// Public / Feedback
const NotFoundPage = lazy(() => import('@/shared/components/feedback/NotFoundPage'));

// ─── Suspense Wrapper ──────────────────────────────────────
const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// ─── Router ────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public landing
  { path: '/', element: <S><LandingPage /></S> },

  // Public Pet Safety Tag (scanned via QR code — no auth required)
  { path: '/public/pet/:qrCode', element: <S><PublicPetPage /></S> },

  // Auth routes (no sidebar)
  {
    element: <AuthLayout><Outlet /></AuthLayout>,
    children: [
      { path: '/auth/login', element: <S><LoginPage /></S> },
      { path: '/auth/register', element: <S><RegisterPage /></S> },
      { path: '/auth/verify', element: <S><OTPPage /></S> },
      { path: '/auth/forgot-password', element: <S><ForgotPasswordPage /></S> },
      { path: '/auth/reset-password', element: <S><ResetPasswordPage /></S> },
    ],
  },

  // Protected app routes (with sidebar layout)
  {
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <S><DashboardPage /></S> },
      { path: '/profile', element: <S><ProfilePage /></S> },
      { path: '/settings', element: <S><SettingsPage /></S> },
      { path: '/profile/settings', element: <S><SettingsPage /></S> },
      { path: '/notifications', element: <S><NotificationsPage /></S> },

      // Pets & Health
      { path: '/pets', element: <S><PetsPage /></S> },
      { path: '/pets/new', element: <S><AddPetPage /></S> },
      { path: '/pets/:petId', element: <S><PetDetailPage /></S> },
      { path: '/pets/:petId/qr', element: <S><PetQRPage /></S> },
      { path: '/pets/:petId/health', element: <S><PetHealthPage /></S> },
      { path: '/pets/:petId/vaccinations', element: <S><PetVaccinationsPage /></S> },
      { path: '/pets/:petId/medications', element: <S><PetMedicationsPage /></S> },
      { path: '/pets/:petId/growth', element: <S><PetGrowthPage /></S> },

      // Safety & Lost/Found
      { path: '/lost-found', element: <S><LostFoundPage /></S> },
      { path: '/emergency', element: <S><EmergencyPage /></S> },

      // AI Suite
      { path: '/ai', element: <S><AIHubPage /></S> },
      { path: '/ai/assistant', element: <S><AIAssistantPage /></S> },
      { path: '/ai/symptoms', element: <S><AIAssistantPage /></S> },
      { path: '/ai/breed-scan', element: <S><BreedScanPage /></S> },
      { path: '/ai/diet', element: <S><DietRecommendPage /></S> },

      // Reminders & Appointments
      { path: '/reminders', element: <S><RemindersPage /></S> },
      { path: '/appointments', element: <S><AppointmentsPage /></S> },
      { path: '/appointments/book', element: <S><BookAppointmentPage /></S> },

      // Nearby Services
      { path: '/nearby', element: <S><NearbyPage /></S> },
      { path: '/nearby/:providerId', element: <S><ProviderDetailPage /></S> },

      // Care Finance, Community, Commerce & Adoption
      { path: '/expenses', element: <S><ExpensesPage /></S> },
      { path: '/community', element: <S><CommunityPage /></S> },
      { path: '/community/:postId', element: <S><CommunityPostDetailPage /></S> },
      { path: '/marketplace', element: <S><MarketplacePage /></S> },
      { path: '/adoption', element: <S><AdoptionPage /></S> },

      // Admin routes (guarded by AdminRoute)
      {
        path: '/admin',
        element: <AdminRoute><Outlet /></AdminRoute>,
        children: [
          { index: true, element: <S><AdminDashboardPage /></S> },
          { path: 'users', element: <S><AdminUsersPage /></S> },
          { path: 'pets', element: <S><AdminPetsPage /></S> },
          { path: 'lost-found', element: <S><AdminLostFoundPage /></S> },
          { path: 'audit-logs', element: <S><AdminAuditLogsPage /></S> },
          { path: 'automation', element: <S><AutomationBuilder /></S> },
          { path: 'events', element: <S><EventMonitorDashboard /></S> },
          { path: 'notifications', element: <S><NotificationAnalytics /></S> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <S><NotFoundPage /></S> },
]);
