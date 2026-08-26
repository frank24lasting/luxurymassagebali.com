import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, KeyRound, UserPlus, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminUser { readonly id: string; readonly email?: string; readonly created_at: string; readonly user_metadata?: { readonly role?: string }; readonly app_metadata?: { readonly claims_admin?: boolean }; }
interface UserPayload { readonly email: string; readonly password: string; readonly role: string; }

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error(error?.message || 'Missing session');
  return data.session.access_token;
}

async function requestUsers(method: string, body?: unknown, id?: string): Promise<{ readonly users?: readonly AdminUser[]; readonly user?: AdminUser }> {
  const token = await getAccessToken();
  const response = await fetch(`/api/admin-users${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserPayload>({ email: '', password: '', role: 'admin' });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: async () => (await requestUsers('GET')).users ?? [] });
  const createUser = useMutation({ mutationFn: () => requestUsers('POST', form), onSuccess: () => { setForm({ email: '', password: '', role: 'admin' }); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const deleteUser = useMutation({ mutationFn: (id: string) => requestUsers('DELETE', undefined, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }) });
  const resetPassword = useMutation({ mutationFn: ({ id, password }: { readonly id: string; readonly password: string }) => requestUsers('PATCH', { id, password }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }) });

  const admins = useMemo(() => users.filter((user) => user.user_metadata?.role === 'admin' || user.app_metadata?.claims_admin), [users]);

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-white">Users & Access</h1><p className="mt-2 text-sm text-gray-400">Secure CRUD user via Vercel serverless API. Service role tetap server-only.</p></div><section className="grid gap-6 xl:grid-cols-[1fr_420px]"><div className="rounded-2xl border border-white/10 bg-dark-card p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Users className="h-6 w-6 text-primary" /><h2 className="text-xl font-bold text-white">All Users</h2></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{admins.length} admin</span></div><div className="mt-6 space-y-3">{users.map((user) => <div key={user.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-white">{user.email}</p><p className="text-xs text-gray-500">{user.id}</p><p className="mt-1 text-xs text-primary">{user.user_metadata?.role ?? 'user'}</p></div><button onClick={() => deleteUser.mutate(user.id)} className="rounded-xl bg-red-500/10 p-3 text-red-400"><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 flex gap-2"><button onClick={() => { const password = window.prompt('Password baru minimal 12 karakter'); if (password) resetPassword.mutate({ id: user.id, password }); }} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-white"><KeyRound className="h-3 w-3" /> Reset Password</button></div></div>)}</div></div><aside className="space-y-6"><div className="rounded-2xl border border-white/10 bg-dark-card p-6"><UserPlus className="h-6 w-6 text-primary" /><h2 className="mt-3 text-xl font-bold text-white">Create User</h2><input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="email@domain.com" className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" /><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password minimal 12 karakter" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" /><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"><option value="admin">Admin</option><option value="editor">Editor</option></select><button onClick={() => createUser.mutate()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-dark"><RefreshCw className="h-4 w-4" /> Create</button></div><div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5"><Shield className="h-5 w-5 text-green-300" /><p className="mt-3 text-sm leading-relaxed text-green-100">CRUD ini lewat `/api/admin-users`, bukan langsung browser ke service role.</p></div></aside></section></div>;
}
