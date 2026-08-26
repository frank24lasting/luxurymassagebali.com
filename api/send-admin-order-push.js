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

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@luxurymassagebali.com';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

    configureWebPush();
    const supabaseAdmin = getAdminClient();
    const body = req.body || {};
    let appointment = body.appointment || null;

    if (!appointment && body.appointmentId) {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('id, customer_name, appointment_date, appointment_time')
        .eq('id', body.appointmentId)
        .single();
      if (error) throw error;
      appointment = data;
    }

    if (!appointment?.id) return json(res, 400, { error: 'Missing appointmentId' });

    const webhookSecret = req.headers['x-webhook-secret'] || req.query.secret;
    const hasWebhookSecret = process.env.ADMIN_PUSH_WEBHOOK_SECRET && webhookSecret === process.env.ADMIN_PUSH_WEBHOOK_SECRET;
    if (body.appointment && !hasWebhookSecret) return json(res, 403, { error: 'Forbidden' });

    const { data: subscriptions, error } = await supabaseAdmin
      .from('admin_push_subscriptions')
      .select('id, endpoint, subscription')
      .eq('is_active', true);
    if (error) throw error;

    const payload = JSON.stringify({
      title: 'Ada order masuk!!',
      body: `${appointment.customer_name || 'Customer baru'} membuat appointment ${appointment.appointment_date || ''} ${appointment.appointment_time || ''}`.trim(),
      url: '/langitdewata/appointments',
      tag: `appointment-${appointment.id || Date.now()}`,
    });

    const results = await Promise.allSettled((subscriptions || []).map(async (item) => {
      try {
        await webpush.sendNotification(item.subscription, payload);
        return { id: item.id, ok: true };
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await supabaseAdmin.from('admin_push_subscriptions').update({ is_active: false }).eq('id', item.id);
        }
        return { id: item.id, ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    }));

    return json(res, 200, { sent: results.filter(result => result.status === 'fulfilled').length });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}
