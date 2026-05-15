'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformUsers, savePlatformUsers, PlatformUser } from '@/lib/userStore';
import { UserRole, ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS, Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Plus, X, Pencil, Check, ShieldAlert, Users } from 'lucide-react';

const ALL_ROLES: UserRole[] = ['admin', 'production_manager', 'technician', 'engineer', 'procurement', 'read_only'];

const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: 'Drones', permissions: ['edit_drone_status', 'edit_drone_technical', 'edit_drone_compliance', 'edit_drone_notes', 'add_drones'] },
  { label: 'Work Orders', permissions: ['edit_wo_status', 'edit_wo_priority', 'edit_wo_assigned_tech', 'edit_wo_hours', 'edit_wo_notes', 'edit_wo_parts', 'add_work_orders'] },
  { label: 'Inventory', permissions: ['edit_inventory_counts', 'edit_inventory_status', 'edit_inventory_min', 'edit_purchase_links', 'edit_inventory_notes', 'add_inventory'] },
  { label: 'Admin', permissions: ['manage_users'] },
];

const PERM_LABELS: Record<Permission, string> = {
  edit_drone_status: 'Status',
  edit_drone_technical: 'Technical fields',
  edit_drone_compliance: 'Compliance',
  edit_drone_notes: 'Notes',
  add_drones: 'Add drones',
  edit_wo_status: 'Status',
  edit_wo_priority: 'Priority',
  edit_wo_assigned_tech: 'Assigned tech',
  edit_wo_hours: 'Hours',
  edit_wo_notes: 'Notes',
  edit_wo_parts: 'Parts status',
  add_work_orders: 'Add WOs',
  edit_inventory_counts: 'Stock counts',
  edit_inventory_status: 'PIPO status',
  edit_inventory_min: 'Min qty',
  edit_purchase_links: 'Purchase links',
  edit_inventory_notes: 'Notes',
  add_inventory: 'Add items',
  manage_users: 'Manage users',
};

const EMPTY_FORM = { name: '', email: '', role: 'read_only' as UserRole };

export default function AdminPage() {
  const { can, user: currentUser } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  useEffect(() => { setUsers(getPlatformUsers()); }, []);

  if (!can('manage_users')) {
    return (
      <div>
        <Header title="Admin Panel" subtitle="Access restricted" />
        <div className="p-6 flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mb-4 opacity-50" />
          <p className="text-white font-medium mb-1">Access Denied</p>
          <p className="text-gray-500 text-sm">You need Admin role to access this panel.</p>
        </div>
      </div>
    );
  }

  const save = (updated: PlatformUser[]) => {
    setUsers(updated);
    savePlatformUsers(updated);
  };

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const newUser: PlatformUser = {
      id: `u-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      createdAt: new Date().toISOString().split('T')[0],
    };
    save([...users, newUser]);
    setForm(EMPTY_FORM);
    setShowAdd(false);
  };

  const changeRole = (id: string, role: UserRole) => {
    save(users.map(u => u.id === id ? { ...u, role } : u));
    setEditingRole(null);
  };

  const removeUser = (id: string) => {
    if (id === currentUser?.id) return; // can't remove yourself
    save(users.filter(u => u.id !== id));
  };

  return (
    <div>
      <Header title="Admin Panel" subtitle="User management and permissions" />
      <div className="p-6 space-y-6">

        {/* Permissions Matrix */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Role Permissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium w-36">Permission</th>
                  {ALL_ROLES.map(role => (
                    <th key={role} className="text-center py-2 px-3">
                      <span className={cn('px-2 py-0.5 rounded border text-xs font-medium', ROLE_COLORS[role])}>
                        {ROLE_LABELS[role]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map(group => (
                  <React.Fragment key={group.label}>
                    <tr className="border-b border-gray-800/50">
                      <td colSpan={7} className="py-2 text-gray-400 font-semibold text-xs uppercase tracking-wide">
                        {group.label}
                      </td>
                    </tr>
                    {group.permissions.map(perm => (
                      <tr key={perm} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                        <td className="py-1.5 pr-4 text-gray-400">{PERM_LABELS[perm]}</td>
                        {ALL_ROLES.map(role => {
                          const allowed = ROLE_PERMISSIONS[role].includes(perm);
                          return (
                            <td key={role} className="text-center py-1.5 px-3">
                              {allowed
                                ? <span className="text-green-400">✓</span>
                                : <span className="text-gray-700">—</span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Users</h2>
              <span className="text-xs text-gray-500">{users.length} accounts</span>
            </div>
            <button
              onClick={() => setShowAdd(s => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add User
            </button>
          </div>

          {/* Add user form */}
          {showAdd && (
            <form onSubmit={addUser} className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-xl space-y-3">
              <p className="text-xs font-medium text-white">New User</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="name@skyspecs.com"
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white font-medium transition-colors">
                  Add User
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="px-4 py-1.5 border border-gray-600 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Users table */}
          <div className="space-y-1">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                {editingRole === u.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={u.role}
                      onChange={e => changeRole(u.id, e.target.value as UserRole)}
                      className="px-2 py-1 bg-gray-700 border border-blue-500 rounded-lg text-xs text-white focus:outline-none"
                      autoFocus
                    >
                      {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <button onClick={() => setEditingRole(null)} className="text-gray-500 hover:text-gray-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingRole(u.id)}
                    className={cn('flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border font-medium transition-colors hover:opacity-80', ROLE_COLORS[u.role])}
                    title="Click to change role"
                  >
                    {ROLE_LABELS[u.role]}
                    <Pencil className="w-2.5 h-2.5 opacity-60" />
                  </button>
                )}
                <button
                  onClick={() => removeUser(u.id)}
                  disabled={u.id === currentUser?.id}
                  title={u.id === currentUser?.id ? "Can't remove yourself" : "Remove user"}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">Role changes take effect on next login · Click a role badge to change it</p>
      </div>
    </div>
  );
}
