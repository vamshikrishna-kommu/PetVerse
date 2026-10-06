import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/app/store/ui.store';
import { useAuthStore } from '@/app/store/auth.store';
import { userApi } from '@/services/api/userApi';
import { pushNotifications } from '@/shared/lib/pushNotifications';
import {
  Settings,
  User as UserIcon,
  Moon,
  Sun,
  Laptop,
  BellRing,
  Shield,
  Lock,
  LogOut,
  AlertTriangle,
  Scale,
  Save,
  Download,
  Trash2,
  Camera,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const { user, updateUser, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'appearance' | 'security' | 'data'>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.phone || '',
    bio: user?.profile?.bio || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Notifications preferences
  const [pushStatus, setPushStatus] = useState<string>('default');
  const [subscribing, setSubscribing] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: user?.preferences?.notifications?.email ?? true,
    push: user?.preferences?.notifications?.push ?? true,
    appointmentReminders: user?.preferences?.notifications?.appointmentReminders ?? true,
    vaccinationReminders: user?.preferences?.notifications?.vaccinationReminders ?? true,
    medicationReminders: user?.preferences?.notifications?.medicationReminders ?? true,
    healthAlerts: user?.preferences?.notifications?.healthAlerts ?? true,
    marketing: user?.preferences?.notifications?.marketing ?? false,
  });

  // Privacy preferences
  const [privacyPrefs, setPrivacyPrefs] = useState({
    publicPetProfile: user?.preferences?.privacy?.publicPetProfile ?? true,
    qrVisibility: user?.preferences?.privacy?.qrVisibility ?? true,
    locationSharing: user?.preferences?.privacy?.locationSharing ?? false,
    contactPreference: user?.preferences?.privacy?.contactPreference ?? 'in_app',
  });

  // Units
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Security password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (pushNotifications.isSupported()) {
      setPushStatus(pushNotifications.getPermissionState());
    } else {
      setPushStatus('unsupported');
    }
  }, []);

  // Update state if user changes in auth store
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.phone || '',
        bio: user.profile?.bio || '',
      });
      if (user.preferences) {
        if (user.preferences.notifications) {
          setNotificationPrefs((prev) => ({ ...prev, ...user.preferences?.notifications }));
        }
        if (user.preferences.privacy) {
          setPrivacyPrefs((prev) => ({ ...prev, ...user.preferences?.privacy }));
        }
        if (user.preferences.appearance?.units) {
          setUnits(user.preferences.appearance.units);
        }
      }
    }
  }, [user]);

  const handleTogglePush = async () => {
    if (pushStatus === 'granted') {
      const ok = await pushNotifications.unsubscribe();
      if (ok) {
        setPushStatus('default');
        toast.info('Browser push notifications disabled');
      }
    } else {
      setSubscribing(true);
      const res = await pushNotifications.requestPermissionAndSubscribe();
      setSubscribing(false);
      if (res.success) {
        setPushStatus('granted');
        toast.success('Browser push notifications enabled');
      } else {
        setPushStatus(pushNotifications.getPermissionState());
        toast.error(res.error || 'Failed to enable notifications');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await userApi.updateProfile(profileForm);
      updateUser(updated);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 5MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const updated = await userApi.uploadAvatar(file);
      updateUser(updated);
      toast.success('Avatar uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const updated = await userApi.updatePreferences({
        notifications: notificationPrefs,
        privacy: privacyPrefs,
        appearance: { theme, units },
      });
      updateUser(updated);
      toast.success('Preferences saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    setChangingPassword(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await userApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `petverse_account_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Account data exported successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to export account data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      toast.error('Please type DELETE to confirm permanent account deletion');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await userApi.deleteAccount();
      toast.success('Your account and all associated records have been permanently removed.');
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="container-page max-w-5xl py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" /> Account & App Settings
        </h1>
        <p className="text-muted text-sm mt-1">
          Manage your personal profile, notification preferences, privacy visibility, and security credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 text-sm">
        {[
          { id: 'profile', label: 'Profile', icon: UserIcon },
          { id: 'notifications', label: 'Notifications', icon: BellRing },
          { id: 'privacy', label: 'Privacy', icon: Eye },
          { id: 'appearance', label: 'Appearance', icon: Sun },
          { id: 'security', label: 'Security', icon: Lock },
          { id: 'data', label: 'Data & Privacy', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-t-xl transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary bg-primary/5'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div className="card p-6 border-border space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Personal Information</h2>
            <p className="text-xs text-muted">Update your public name, contact telephone, and caretaker bio.</p>
          </div>

          {/* Avatar Upload */}
          <div className="flex items-center gap-6 pb-6 border-b border-border">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-surface-3 border-2 border-border overflow-hidden flex items-center justify-center text-xl font-bold text-primary">
                {user?.profile?.avatar ? (
                  <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.profile?.firstName?.[0] || 'U'}</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-white text-[10px] font-semibold">
                <Camera className="w-5 h-5 mb-1" />
                {uploadingAvatar ? 'Saving...' : 'Change'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Profile Picture</h3>
              <p className="text-xs text-muted mt-0.5">JPG, PNG, or WebP up to 5MB. Cloud-optimized automatically.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input w-full bg-surface-2 text-muted cursor-not-allowed"
                  />
                  {user?.isVerified && (
                    <span className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Caretaker Bio / Notes</label>
              <textarea
                rows={3}
                placeholder="Tell veterinarians or shelter staff a little about your experience with pets..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                maxLength={500}
                className="input w-full resize-none"
              />
              <span className="text-[11px] text-muted">{profileForm.bio.length}/500 characters</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Push Notifications Activation */}
          <div className="card p-6 border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-primary" /> Browser Push Notifications (FCM)
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Receive instant desktop & mobile alerts even when PetVerse is closed in the background.
                </p>
              </div>
              {pushStatus === 'granted' ? (
                <span className="badge bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold">
                  Enabled
                </span>
              ) : (
                <span className="badge bg-surface-3 text-muted border border-border text-xs font-bold">
                  Disabled
                </span>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleTogglePush}
                disabled={subscribing || pushStatus === 'unsupported'}
                className="btn btn-secondary text-xs"
              >
                {subscribing
                  ? 'Configuring Subscription...'
                  : pushStatus === 'granted'
                  ? 'Disable Browser Push Notifications'
                  : 'Enable Browser Push Notifications'}
              </button>
            </div>
          </div>

          {/* Granular Preferences */}
          <div className="card p-6 border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground">Alert Subscriptions</h2>
            <p className="text-xs text-muted">Control which notification channels deliver pet health updates.</p>

            <div className="divide-y divide-border">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Critical digests and confirmation emails' },
                { key: 'push', label: 'Push & SSE Stream', desc: 'Real-time alert dispatch to active devices' },
                { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Upcoming clinic bookings and reschedule notifications' },
                { key: 'vaccinationReminders', label: 'Vaccination Schedules', desc: 'Core and non-core booster schedule alarms' },
                { key: 'medicationReminders', label: 'Medication Dosing', desc: 'Daily prescription dosage schedules' },
                { key: 'healthAlerts', label: 'Emergency & Health Alerts', desc: 'Critical biometric changes and nearby lost pet bulletins' },
                { key: 'marketing', label: 'Community & Wellness Digest', desc: 'Weekly pet wellness tips and community spotlight' },
              ].map((item) => (
                <div key={item.key} className="py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                    <p className="text-xs text-muted">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(notificationPrefs as any)[item.key]}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingPrefs ? 'Saving Preferences...' : 'Save Notification Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PRIVACY */}
      {activeTab === 'privacy' && (
        <div className="card p-6 border-border space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Privacy & Visibility
            </h2>
            <p className="text-xs text-muted">
              Configure how public pet records and lost pet discovery features handle your personal identity.
            </p>
          </div>

          <div className="divide-y divide-border">
            <div className="py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Public Pet Profile</h3>
                <p className="text-xs text-muted">Allow non-owners to view public pet vitals and photo gallery.</p>
              </div>
              <input
                type="checkbox"
                checked={privacyPrefs.publicPetProfile}
                onChange={(e) => setPrivacyPrefs({ ...privacyPrefs, publicPetProfile: e.target.checked })}
                className="checkbox checkbox-primary"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">QR Identity Visibility</h3>
                <p className="text-xs text-muted">Enable public scanning of pet collar tags for emergency lookup.</p>
              </div>
              <input
                type="checkbox"
                checked={privacyPrefs.qrVisibility}
                onChange={(e) => setPrivacyPrefs({ ...privacyPrefs, qrVisibility: e.target.checked })}
                className="checkbox checkbox-primary"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Location Services Sharing</h3>
                <p className="text-xs text-muted">
                  Share approximate radius coordinates with nearby clinics during search queries.
                </p>
              </div>
              <input
                type="checkbox"
                checked={privacyPrefs.locationSharing}
                onChange={(e) => setPrivacyPrefs({ ...privacyPrefs, locationSharing: e.target.checked })}
                className="checkbox checkbox-primary"
              />
            </div>

            <div className="py-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Finder Contact Method</h3>
              <p className="text-xs text-muted">
                How should pet finders and community rescuers get in touch with you?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {[
                  { id: 'in_app', label: 'In-App Secure Inquiry', desc: 'Recommended: Masked email/phone' },
                  { id: 'email', label: 'Direct Email', desc: 'Finder sends email directly' },
                  { id: 'none', label: 'Private (No Contact)', desc: 'Only authorized vet staff' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPrivacyPrefs({ ...privacyPrefs, contactPreference: mode.id as any })}
                    className={`p-3 text-left rounded-xl border text-xs transition ${
                      privacyPrefs.contactPreference === mode.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-border bg-surface-2 text-foreground hover:bg-surface-3'
                    }`}
                  >
                    <div className="font-semibold">{mode.label}</div>
                    <div className="text-[11px] opacity-75 font-normal mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingPrefs ? 'Saving Settings...' : 'Save Privacy Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="card p-6 border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" /> Interface Theme
            </h2>
            <p className="text-xs text-muted">
              Choose your preferred color theme for high visibility during nighttime care.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  theme === 'light'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-surface-2 text-foreground hover:bg-surface-3'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-surface-2 text-foreground hover:bg-surface-3'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">Dark</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  theme === 'system'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-surface-2 text-foreground hover:bg-surface-3'
                }`}
              >
                <Laptop className="w-5 h-5" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>

          <div className="card p-6 border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> Units & Measurements
            </h2>
            <p className="text-xs text-muted">
              Units used for pet weight records, veterinary growth charts, and food portions.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setUnits('metric')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  units === 'metric'
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-surface-2 text-foreground hover:bg-surface-3'
                }`}
              >
                Metric (kg, cm, ml)
              </button>

              <button
                onClick={() => setUnits('imperial')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  units === 'imperial'
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-surface-2 text-foreground hover:bg-surface-3'
                }`}
              >
                Imperial (lbs, in, oz)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Form */}
          <div className="card p-6 border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Update Password
            </h2>
            <p className="text-xs text-muted">
              Ensure your account is protected with a secure password containing at least 8 characters.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="btn btn-primary text-xs"
              >
                {changingPassword ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>

          {/* Active Sessions & Security Details */}
          <div className="card p-6 border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> Active Session Details
            </h2>
            <div className="text-xs text-muted space-y-2">
              <div className="flex justify-between py-2 border-b border-border">
                <span>Account Email</span>
                <span className="font-semibold text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Security Token Strategy</span>
                <span className="text-emerald-500 font-semibold">HttpOnly Cookie + Refresh Token Rotation</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Assigned Role</span>
                <span className="font-semibold uppercase tracking-wider text-primary">{user?.role}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-muted">Ready to terminate all active sessions?</span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-4 py-2 bg-danger/10 text-danger border border-danger/20 rounded-xl text-xs font-semibold hover:bg-danger/20 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out Everywhere
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DATA & DANGER ZONE */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Data Export */}
          <div className="card p-6 border-border space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" /> GDPR Data Export
            </h2>
            <p className="text-xs text-muted">
              Download a complete JSON package of your profile, registered pets, medical charts, vaccinations, appointments, and reminder logs.
            </p>
            <div>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="btn btn-secondary flex items-center gap-2 text-xs"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Packaging Archive...' : 'Download My Data Archive'}
              </button>
            </div>
          </div>

          {/* Delete Account (Danger Zone) */}
          <div className="card p-6 border-danger/30 bg-danger/5 space-y-4">
            <h2 className="text-lg font-bold text-danger flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger" /> Danger Zone: Delete Account
            </h2>
            <p className="text-xs text-muted">
              Permanently delete your PetVerse account and all linked pet profiles, medical histories, vaccination trackers, and appointments. This action cannot be undone.
            </p>

            <div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger flex items-center gap-2 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card max-w-md w-full p-6 border-danger/50 space-y-4 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs text-muted">
              This action is <span className="text-danger font-bold">irreversible</span>. All your pets, vaccination booster schedules, prescription reminders, and clinic appointments will be permanently purged from the database.
            </p>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Type <span className="text-danger font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationInput !== 'DELETE' || isDeletingAccount}
                className="btn btn-danger text-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}