import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import type { IUser, UserRole } from '@petverse/shared-types';
import {
  Users,
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Filter,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/shared/components/feedback/Skeleton';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        page,
        limit: 15,
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: IUser) => {
    const nextStatus = user.isActive === false ? true : false;
    const confirmMsg = nextStatus
      ? `Re-activate ${user.email}?`
      : `Deactivate ${user.email}? User will be blocked from logging in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.toggleUserStatus(user._id, { isActive: nextStatus });
      toast.success(`User ${nextStatus ? 'activated' : 'deactivated'}`);
      setUsers(
        users.map((u) => (u._id === user._id ? { ...u, isActive: nextStatus } : u))
      );
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await adminApi.toggleUserStatus(userId, { role: newRole });
      toast.success('Role updated successfully');
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="container-page max-w-6xl py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> User Directory & Access Control
          </h1>
          <p className="text-muted text-xs mt-0.5">
            Total of {total} registered accounts across all roles.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="input text-xs"
          >
            <option value="all">All Roles</option>
            <option value="pet_owner">Pet Owner</option>
            <option value="vet">Veterinarian</option>
            <option value="shelter">Shelter</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden border-border">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm text-foreground">No users found</p>
            <p className="text-xs mt-1">Try adjusting your search or role filters.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-surface-2 border-b border-border text-muted font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-2/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                          {u.profile?.firstName?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {u.profile?.firstName} {u.profile?.lastName}
                          </p>
                          <p className="text-muted text-[11px]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                        className="bg-surface-2 border border-border rounded-lg text-xs font-semibold py-1 px-2 text-foreground"
                      >
                        <option value="pet_owner">Pet Owner</option>
                        <option value="vet">Veterinarian</option>
                        <option value="shelter">Shelter</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5">
                      {u.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full border border-danger/20">
                          <XCircle className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-muted">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition inline-flex items-center gap-1 ${
                          u.isActive !== false
                            ? 'text-danger border-danger/20 hover:bg-danger/10'
                            : 'text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                      >
                        {u.isActive !== false ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="p-4 border-t border-border flex justify-between items-center text-xs text-muted">
            <span>
              Showing {users.length} of {total} users
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-border rounded-lg hover:bg-surface-2 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * 15 >= total}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-border rounded-lg hover:bg-surface-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}