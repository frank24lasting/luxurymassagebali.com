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

const projects = {
    source: {
        url: process.env.OLD_SUPABASE_URL,
        key: process.env.OLD_SUPABASE_SERVICE_ROLE_KEY,
    },
    target: {
        url: process.env.NEW_SUPABASE_URL,
        key: process.env.NEW_SUPABASE_SERVICE_ROLE_KEY,
    },
};

async function getOpenApi(project) {
    const response = await fetch(`${project.url}/rest/v1/`, {
        headers: {
            apikey: project.key,
            Authorization: `Bearer ${project.key}`,
            Accept: 'application/openapi+json',
        },
    });
    if (!response.ok) throw new Error(`OpenAPI request failed with HTTP ${response.status}`);
    return response.json();
}

function columnsFor(document, table) {
    const schema = document.definitions?.[table] || document.components?.schemas?.[table];
    return Object.keys(schema?.properties || {}).sort();
}

async function main() {
    for (const [label, project] of Object.entries(projects)) {
        if (!project.url || !project.key) throw new Error(`Missing ${label} credentials`);
    }

    const sourceDocument = await getOpenApi(projects.source);
    const targetClient = createClient(projects.target.url, projects.target.key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('SUPABASE SCHEMA COMPARISON (READ-ONLY)');
    let mismatchCount = 0;

    for (const table of TABLES) {
        const sourceColumns = columnsFor(sourceDocument, table);
        if (!sourceColumns.length) {
            console.log(`\n${table}: source definition unavailable; skipped`);
            continue;
        }

        const { error } = await targetClient
            .from(table)
            .select(sourceColumns.join(','))
            .limit(0);

        if (error) {
            mismatchCount += 1;
            console.log(`\n${table}: INCOMPATIBLE`);
            console.log(`  required columns: ${sourceColumns.join(', ')}`);
            console.log(`  target error: ${error.message}`);
        } else {
            console.log(`\n${table}: compatible`);
            console.log(`  validated columns: ${sourceColumns.join(', ')}`);
        }
    }

    console.log(`\nSchema mismatches: ${mismatchCount}`);
    console.log('Mutations performed: 0');
    if (mismatchCount) process.exitCode = 2;
}

main().catch((error) => {
    console.error(`Schema comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
