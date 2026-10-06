import React, { useState } from 'react';
import { useAuthStore } from '@/app/store/auth.store';
import { userApi } from '@/services/api/userApi';
import { User, Mail, Phone, Camera, ShieldCheck, Calendar, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.profile.firstName || '',
    lastName: user?.profile.lastName || '',
    phone: user?.phone || '',
    bio: user?.profile.bio || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser = await userApi.updateProfile(form);
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const updatedUser = await userApi.uploadAvatar(file);
      updateUser(updatedUser);
      toast.success('Avatar uploaded successfully!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
        <p className="text-muted text-sm mt-1">Manage your account information and preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card / Avatar */}
        <div className="card p-6 flex flex-col items-center text-center space-y-4 md:col-span-1">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-primary/10 border-4 border-surface shadow-md flex items-center justify-center">
              {user?.profile.avatar ? (
                <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:opacity-90 transition">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">
              {user?.profile.firstName} {user?.profile.lastName}
            </h2>
            <p className="text-xs text-muted mt-0.5">{user?.email}</p>
            {user?.profile.bio && (
              <p className="text-xs text-muted/90 italic mt-2 px-2 bg-surface-2 py-1.5 rounded-lg border border-border/50 text-left">
                "{user.profile.bio}"
              </p>
            )}
          </div>

          <div className="w-full pt-4 border-t border-border space-y-2 text-xs text-left">
            <div className="flex items-center justify-between text-muted">
              <span>Account Status</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-500">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Role</span>
              <span className="font-semibold text-foreground capitalize">{user?.role || 'Pet Owner'}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Member Since</span>
              <span className="font-semibold text-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card p-4 sm:p-6 md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Personal Details</h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="input w-full pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input w-full pl-9 opacity-60 bg-surface-2 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-muted mt-1">Email cannot be changed directly.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input w-full pl-9"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-muted uppercase">About Me / Bio</label>
                <span className="text-[10px] text-muted">{form.bio.length}/500</span>
              </div>
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Share a short bio about yourself and your pets..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="input w-full p-3 text-sm resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/30 disabled:opacity-60 transition"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}