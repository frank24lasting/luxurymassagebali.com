import { createClient } from '@supabase/supabase-js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function verifyAdmin(req, supabaseAdmin) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return false;
  return data.user.user_metadata?.role === 'admin' || data.user.app_metadata?.claims_admin === true;
}

export default async function handler(req, res) {
  try {
    const supabaseAdmin = getAdminClient();
    const allowed = await verifyAdmin(req, supabaseAdmin);
    if (!allowed) return json(res, 403, { error: 'Forbidden' });

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      return json(res, 200, { users: data.users });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { email, password, role = 'admin' } = body;
      if (!email || !password || password.length < 12) return json(res, 400, { error: 'Email and password >= 12 chars required' });
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role },
        app_metadata: { claims_admin: role === 'admin' },
      });
      if (error) throw error;
      return json(res, 201, { user: data.user });
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const { id, email, password, role } = body;
      if (!id) return json(res, 400, { error: 'Missing user id' });
      const updates = {};
      if (email) updates.email = email;
      if (password) updates.password = password;
      if (role) {
        updates.user_metadata = { role };
        updates.app_metadata = { claims_admin: role === 'admin' };
      }
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates);
      if (error) throw error;
      return json(res, 200, { user: data.user });
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!id) return json(res, 400, { error: 'Missing user id' });
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}
