import { mkdir, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

config({ path: '.env.local', quiet: true });

const TARGET_REF = 'sxpplbcswwnkepnapqrj';
const COPY_TABLES = [
    'site_settings',
    'services',
    'service_prices',
    'pages',
    'articles',
    'media',
    'hero_slides',
    'appointments',
];
const BACKUP_TABLES = [...COPY_TABLES];
const JSON_COLUMNS = {
    site_settings: new Set(['value']),
    pages: new Set(['content']),
    articles: new Set(['content', 'schema_markup']),
    media: new Set(['metadata']),
    admin_push_subscriptions: new Set(['subscription']),
};

const sourceUrl = process.env.OLD_SUPABASE_URL;
const sourceKey = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
const targetUrl = process.env.NEW_SUPABASE_URL;
const connectionString = process.env.NEW_SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceUrl || !sourceKey || !targetUrl || !connectionString) {
    throw new Error('Missing source credentials, target URL, or target database URL.');
}
if (sourceUrl === targetUrl) throw new Error('Safety check failed: source and target URLs are identical.');
if (!connectionString.includes(TARGET_REF) || !targetUrl.includes(TARGET_REF)) {
    throw new Error(`Safety check failed: target configuration does not match ${TARGET_REF}.`);
}

function decodeValue(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function parsePostgresConnection(value) {
    const withoutScheme = value.replace(/^postgres(?:ql)?:\/\//i, '');
    const atIndex = withoutScheme.lastIndexOf('@');
    if (atIndex < 1) throw new Error('Database URL is missing user information or host.');
    const userInfo = withoutScheme.slice(0, atIndex);
    const serverAndPath = withoutScheme.slice(atIndex + 1);
    const colonIndex = userInfo.indexOf(':');
    const slashIndex = serverAndPath.indexOf('/');
    if (colonIndex < 1 || slashIndex < 1) throw new Error('Database URL is incomplete.');
    const server = serverAndPath.slice(0, slashIndex);
    const portSeparator = server.lastIndexOf(':');
    return {
        user: decodeValue(userInfo.slice(0, colonIndex)),
        password: decodeValue(userInfo.slice(colonIndex + 1)),
        host: portSeparator > -1 ? server.slice(0, portSeparator) : server,
        port: portSeparator > -1 ? Number(server.slice(portSeparator + 1)) : 5432,
        database: decodeValue(serverAndPath.slice(slashIndex + 1).split('?', 1)[0]),
    };
}

async function fetchAll(client, table) {
    const pageSize = 500;
    const rows = [];
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await client.from(table).select('*').range(from, from + pageSize - 1);
        if (error) throw new Error(`Source read failed for ${table}: ${error.message}`);
        rows.push(...(data || []));
        if (!data || data.length < pageSize) return rows;
    }
}

function quoteIdentifier(identifier) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) throw new Error(`Unsafe SQL identifier: ${identifier}`);
    return `"${identifier}"`;
}

async function insertRows(client, table, rows) {
    const jsonColumns = JSON_COLUMNS[table] || new Set();
    for (const row of rows) {
        const columns = Object.keys(row);
        const values = [];
        const placeholders = columns.map((column, index) => {
            const value = row[column] ?? null;
            if (jsonColumns.has(column) && value !== null) {
                values.push(JSON.stringify(value));
                return `$${index + 1}::jsonb`;
            }
            values.push(value);
            return `$${index + 1}`;
        });
        const sql = `INSERT INTO public.${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${placeholders.join(', ')})`;
        await client.query(sql, values);
    }
}

async function main() {
    const source = createClient(sourceUrl, sourceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const target = new pg.Client({
        ...parsePostgresConnection(connectionString),
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15_000,
        query_timeout: 120_000,
        statement_timeout: 120_000,
    });

    console.log('Reading source data (source remains read-only)...');
    const backup = {
        createdAt: new Date().toISOString(),
        sourceProject: new URL(sourceUrl).hostname.split('.')[0],
        targetProject: TARGET_REF,
        tables: {},
    };
    for (const table of BACKUP_TABLES) {
        backup.tables[table] = await fetchAll(source, table);
        console.log(`  ${table}: ${backup.tables[table].length}`);
    }

    const timestamp = backup.createdAt.replace(/[:.]/g, '-');
    const backupDirectory = new URL(`./.supabase-migration-backups/${timestamp}/`, import.meta.url);
    await mkdir(backupDirectory, { recursive: true });
    await writeFile(new URL('source-data.json', backupDirectory), JSON.stringify(backup, null, 2), { mode: 0o600 });
    await writeFile(
        new URL('manifest.json', backupDirectory),
        JSON.stringify({
            createdAt: backup.createdAt,
            sourceProject: backup.sourceProject,
            targetProject: backup.targetProject,
            counts: Object.fromEntries(BACKUP_TABLES.map((table) => [table, backup.tables[table].length])),
            copiedTables: COPY_TABLES,
            skippedTables: ['admin_push_subscriptions'],
        }, null, 2),
        { mode: 0o600 },
    );
    console.log(`Backup saved under .supabase-migration-backups/${timestamp}/ (Git ignored).`);

    await target.connect();
    try {
        const identity = await target.query('SELECT current_database() AS database, current_user AS role');
        console.log(`Connected to target database=${identity.rows[0].database} role=${identity.rows[0].role}`);

        for (const table of COPY_TABLES) {
            const result = await target.query(`SELECT COUNT(*)::integer AS count FROM public.${quoteIdentifier(table)}`);
            if (result.rows[0].count !== 0) {
                throw new Error(`Safety check failed: target table ${table} is not empty (${result.rows[0].count} rows).`);
            }
        }

        await target.query('BEGIN');
        for (const table of COPY_TABLES) {
            await insertRows(target, table, backup.tables[table]);
            console.log(`  copied ${table}: ${backup.tables[table].length}`);
        }
        await target.query('COMMIT');
        console.log('Migration committed successfully.');
    } catch (error) {
        await target.query('ROLLBACK').catch(() => undefined);
        throw error;
    } finally {
        await target.end().catch(() => undefined);
    }
}

main().catch((error) => {
    console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
