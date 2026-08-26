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
];
const LEGACY_MEDIA_MARKERS = ['res.cloudinary.com/le3kbzb8', 'spa-jimbaran/'];

function makeClient(url, key) {
    if (!url || !key) throw new Error('Missing Supabase verification credentials.');
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

async function fetchAll(client, table) {
    const rows = [];
    const pageSize = 500;
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await client.from(table).select('*').range(from, from + pageSize - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        rows.push(...(data || []));
        if (!data || data.length < pageSize) return rows;
    }
}

function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
    }
    return value;
}

function fingerprint(row) {
    return JSON.stringify(canonical(row));
}

async function main() {
    const source = makeClient(process.env.OLD_SUPABASE_URL, process.env.OLD_SUPABASE_SERVICE_ROLE_KEY);
    const target = makeClient(process.env.NEW_SUPABASE_URL, process.env.NEW_SUPABASE_SERVICE_ROLE_KEY);

    console.log('SUPABASE DATA VERIFICATION (READ-ONLY)');
    let failures = 0;
    const targetData = {};

    for (const table of TABLES) {
        const [sourceRows, targetRows] = await Promise.all([fetchAll(source, table), fetchAll(target, table)]);
        targetData[table] = targetRows;

        const targetById = new Map(targetRows.map((row) => [row.id, fingerprint(row)]));
        const missingIds = sourceRows.filter((row) => !targetById.has(row.id)).length;
        const changedRows = sourceRows.filter((row) => targetById.has(row.id) && targetById.get(row.id) !== fingerprint(row)).length;
        const extraIds = targetRows.filter((row) => !sourceRows.some((sourceRow) => sourceRow.id === row.id)).length;
        const exact = sourceRows.length === targetRows.length && missingIds === 0 && changedRows === 0 && extraIds === 0;
        if (!exact) failures += 1;

        const legacyRows = targetRows.filter((row) => {
            const text = JSON.stringify(row);
            return LEGACY_MEDIA_MARKERS.some((marker) => text.includes(marker));
        }).length;

        console.log(
            `${table.padEnd(18)} ${exact ? 'EXACT' : 'MISMATCH'} source=${sourceRows.length} target=${targetRows.length}`
            + ` missing=${missingIds} changed=${changedRows} extra=${extraIds} legacyMediaRows=${legacyRows}`,
        );
    }

    const serviceIds = new Set(targetData.services.map((row) => row.id));
    const invalidPrices = targetData.service_prices.filter((row) => !serviceIds.has(row.service_id)).length;
    const invalidAppointments = targetData.appointments.filter((row) => row.service_id && !serviceIds.has(row.service_id)).length;
    if (invalidPrices || invalidAppointments) failures += 1;

    console.log(`\nForeign keys: service_prices invalid=${invalidPrices}, appointments invalid=${invalidAppointments}`);
    console.log(`Verification failures: ${failures}`);
    console.log('Mutations performed: 0');
    if (failures) process.exitCode = 2;
}

main().catch((error) => {
    console.error(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
