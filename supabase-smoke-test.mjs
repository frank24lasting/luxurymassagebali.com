import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const TARGET_REF = 'sxpplbcswwnkepnapqrj';
const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !anonKey || !serviceKey || !email || !password) {
    throw new Error('Missing active Supabase or admin smoke-test credentials.');
}
if (!url.includes(TARGET_REF)) throw new Error(`Active Supabase URL is not target ${TARGET_REF}.`);

function client(key) {
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const publicClient = client(anonKey);
const adminClient = client(anonKey);
const serverClient = client(serviceKey);
let testAppointmentId;

try {
    const { data: publicServices, error: publicReadError } = await publicClient
        .from('services')
        .select('id,name')
        .eq('is_active', true)
        .limit(1);
    if (publicReadError || !publicServices?.length) {
        throw new Error(`Public service read failed: ${publicReadError?.message || 'no active services'}`);
    }
    console.log('Public content read: PASS');

    const { data: authData, error: loginError } = await adminClient.auth.signInWithPassword({ email, password });
    if (loginError || !authData.user) throw new Error(`Admin login failed: ${loginError?.message || 'no user'}`);
    if (authData.user.app_metadata?.claims_admin !== true) throw new Error('Admin claim is missing.');
    console.log('Admin login and claims_admin: PASS');

    const marker = `migration-smoke-${Date.now()}`;
    testAppointmentId = crypto.randomUUID();
    const { error: insertError } = await publicClient
        .from('appointments')
        .insert({
            id: testAppointmentId,
            customer_name: 'Migration Smoke Test',
            customer_email: `${marker}@example.invalid`,
            customer_phone: '+620000000000',
            service_id: publicServices[0].id,
            appointment_date: '2099-12-31',
            appointment_time: '23:59',
            therapist_preference: 'no_preference',
            special_request: marker,
        });
    if (insertError) throw new Error(`Public booking insert failed: ${insertError.message}`);
    console.log('Public booking insert: PASS');

    const { data: publicAppointment, error: publicAppointmentError } = await publicClient
        .from('appointments')
        .select('id')
        .eq('id', testAppointmentId);
    if (publicAppointmentError) throw new Error(`Public appointment isolation check failed: ${publicAppointmentError.message}`);
    if (publicAppointment?.length) throw new Error('RLS leak: public client can read appointment data.');
    console.log('Public appointment isolation: PASS');

    const { data: adminAppointment, error: adminReadError } = await adminClient
        .from('appointments')
        .select('id,status')
        .eq('id', testAppointmentId)
        .single();
    if (adminReadError || adminAppointment?.status !== 'pending') {
        throw new Error(`Admin appointment read failed: ${adminReadError?.message || 'unexpected status'}`);
    }
    console.log('Admin appointment RLS read: PASS');

    const { error: adminUpdateError } = await adminClient
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', testAppointmentId);
    if (adminUpdateError) throw new Error(`Admin appointment update failed: ${adminUpdateError.message}`);
    console.log('Admin appointment RLS update: PASS');
} finally {
    if (testAppointmentId) {
        const { error } = await serverClient.from('appointments').delete().eq('id', testAppointmentId);
        if (error) console.error(`Smoke-test cleanup failed: ${error.message}`);
        else console.log('Smoke-test booking cleanup: PASS');
    }
    await adminClient.auth.signOut().catch(() => undefined);
}

console.log('SUPABASE CUTOVER SMOKE TEST: PASS');
