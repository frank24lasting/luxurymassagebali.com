import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local', quiet: true });

const TARGET_REF = 'sxpplbcswwnkepnapqrj';
const connectionString = process.env.NEW_SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) throw new Error('Missing NEW_SUPABASE_DATABASE_URL or DATABASE_URL.');
if (!connectionString.includes(TARGET_REF)) {
    throw new Error(`Safety check failed: database URL does not contain target project ref ${TARGET_REF}.`);
}
if (/\[YOUR-PASSWORD\]|YOUR-PASSWORD|<password>|\{password\}/i.test(connectionString)) {
    throw new Error('Database URL still contains a password placeholder.');
}

const sql = await readFile(new URL('./supabase-migration-schema.sql', import.meta.url), 'utf8');

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
    if (colonIndex < 1) throw new Error('Database URL is missing its password.');

    const slashIndex = serverAndPath.indexOf('/');
    if (slashIndex < 1) throw new Error('Database URL is missing its database name.');
    const server = serverAndPath.slice(0, slashIndex);
    const databaseAndQuery = serverAndPath.slice(slashIndex + 1);
    const portSeparator = server.lastIndexOf(':');

    return {
        user: decodeValue(userInfo.slice(0, colonIndex)),
        password: decodeValue(userInfo.slice(colonIndex + 1)),
        host: portSeparator > -1 ? server.slice(0, portSeparator) : server,
        port: portSeparator > -1 ? Number(server.slice(portSeparator + 1)) : 5432,
        database: decodeValue(databaseAndQuery.split('?', 1)[0]),
    };
}

const connection = parsePostgresConnection(connectionString);
const client = new pg.Client({
    ...connection,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
    query_timeout: 60_000,
    statement_timeout: 60_000,
});

try {
    await client.connect();
    const identity = await client.query('select current_database() as database, current_user as role');
    console.log(`Connected to target database=${identity.rows[0].database} role=${identity.rows[0].role}`);

    await client.query('BEGIN');
    const result = await client.query(sql);
    await client.query('COMMIT');

    const finalResult = Array.isArray(result) ? result.at(-1) : result;
    console.log(finalResult?.rows?.[0]?.status || 'Target schema applied successfully.');
} catch (error) {
    try {
        await client.query('ROLLBACK');
    } catch {
        // Connection may have failed before a transaction began.
    }
    throw error;
} finally {
    await client.end().catch(() => undefined);
}
