import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

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

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@luxurymassagebali.com';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export default async function handler(req, res) {
  try {
    const supabaseAdmin = getAdminClient();
    const allowed = await verifyAdmin(req, supabaseAdmin);
    if (!allowed) return json(res, 403, { error: 'Forbidden' });
    configureWebPush();

    if (req.method === 'GET') {
      return json(res, 200, { publicKey: process.env.VAPID_PUBLIC_KEY || '' });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const subscription = body.subscription;
      if (!subscription?.endpoint) return json(res, 400, { error: 'Missing push subscription' });

      const { data: userData } = await supabaseAdmin.auth.getUser((req.headers.authorization || '').slice(7));
      const adminUserId = userData?.user?.id || null;
      const { error } = await supabaseAdmin.from('admin_push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        subscription,
        admin_user_id: adminUserId,
        user_agent: req.headers['user-agent'] || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    if (req.method === 'DELETE') {
      const endpoint = req.body?.endpoint;
      if (!endpoint) return json(res, 400, { error: 'Missing endpoint' });
      const { error } = await supabaseAdmin.from('admin_push_subscriptions').delete().eq('endpoint', endpoint);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}
