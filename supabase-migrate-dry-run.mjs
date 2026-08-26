import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const TABLES = [
    'site_settings',
    'services',
    'service_prices',
    'pages',
    'articles',
    'media',
    'hero_slides',
    'appointments',
    'admin_push_subscriptions',
];

const projects = [
    {
        label: 'SOURCE (lama)',
        url: process.env.OLD_SUPABASE_URL,
        key: process.env.OLD_SUPABASE_SERVICE_ROLE_KEY,
    },
    {
        label: 'TARGET (baru)',
        url: process.env.NEW_SUPABASE_URL,
        key: process.env.NEW_SUPABASE_SERVICE_ROLE_KEY,
    },
];

function validateConfig() {
    const missing = [];
    for (const project of projects) {
        if (!project.url) missing.push(`${project.label} URL`);
        if (!project.key) missing.push(`${project.label} service role key`);
    }
    if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`);
    if (projects[0].url === projects[1].url) throw new Error('Source and target URLs must be different.');
}

function projectRef(url) {
    try {
        return new URL(url).hostname.split('.')[0];
    } catch {
        return 'invalid-url';
    }
}

function tableMissing(error) {
    return error?.code === '42P01' || /relation .* does not exist|could not find the table/i.test(error?.message || '');
}

async function inspectProject(project) {
    const client = createClient(project.url, project.key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const result = {
        label: project.label,
        ref: projectRef(project.url),
        connection: 'ok',
        tables: {},
        authUsers: null,
        warnings: [],
    };

    for (const table of TABLES) {
        const { count, error } = await client
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (!error) {
            result.tables[table] = { status: 'present', count: count ?? 0 };
        } else if (tableMissing(error)) {
            result.tables[table] = { status: 'missing', count: null };
        } else {
            result.tables[table] = { status: 'error', count: null, code: error.code, message: error.message };
            result.warnings.push(`${table}: ${error.message}`);
        }
    }

    const { data: authData, error: authError } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (authError) {
        result.connection = 'error';
        result.warnings.push(`Auth Admin API: ${authError.message}`);
    } else {
        result.authUsers = authData.total ?? authData.users.length;
    }

    return result;
}

function printResult(result) {
    console.log(`\n${result.label} [${result.ref}]`);
    console.log(`  Connection: ${result.connection === 'ok' ? 'OK' : 'ERROR'}`);
    console.log(`  Auth users: ${result.authUsers ?? 'unknown'}`);
    for (const table of TABLES) {
        const info = result.tables[table];
        if (info.status === 'present') console.log(`  ${table.padEnd(26)} present  rows=${info.count}`);
        else if (info.status === 'missing') console.log(`  ${table.padEnd(26)} MISSING`);
        else console.log(`  ${table.padEnd(26)} ERROR ${info.code || ''}`);
    }
    for (const warning of result.warnings) console.log(`  Warning: ${warning}`);
}

async function main() {
    validateConfig();
    console.log('SUPABASE MIGRATION DRY-RUN');
    console.log('Read-only mode: no rows will be inserted, updated, or deleted.');

    const source = await inspectProject(projects[0]);
    const target = await inspectProject(projects[1]);
    printResult(source);
    printResult(target);

    const missingSource = TABLES.filter((table) => source.tables[table].status === 'missing');
    const missingTarget = TABLES.filter((table) => target.tables[table].status === 'missing');

    console.log('\nSUMMARY');
    console.log(`  Source missing tables: ${missingSource.length ? missingSource.join(', ') : 'none'}`);
    console.log(`  Target missing tables: ${missingTarget.length ? missingTarget.join(', ') : 'none'}`);
    console.log('  Mutations performed: 0');

    if (source.connection !== 'ok' || target.connection !== 'ok') process.exitCode = 1;
}

main().catch((error) => {
    console.error(`Dry-run failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
