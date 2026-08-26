import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

function describe(value) {
  if (!value) return 'MISSING';
  return `len=${value.length} first3=${value.slice(0, 3)} hasSpace=${/\s/.test(value)} hasQuote=${/["']/.test(value)}`;
}

async function ping(label, cloud, key, secret) {
  console.log(`\n--- ${label} ---`);
  console.log(`cloud_name : ${cloud || 'MISSING'}`);
  console.log(`api_key    : ${describe(key)}`);
  console.log(`api_secret : ${describe(secret)}`);
  if (!cloud || !key || !secret) {
    console.log('result     : SKIPPED (missing credential)');
    return;
  }
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const payload = await response.text();
    console.log(`result     : HTTP ${response.status} ${payload.slice(0, 200)}`);

    const usage = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/usage`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (usage.ok) {
      const data = await usage.json();
      console.log(`plan       : ${data.plan}  resources=${data.resources}  derived=${data.derived_resources}`);
    } else {
      console.log(`usage      : HTTP ${usage.status}`);
    }
  } catch (error) {
    console.log(`result     : ERROR ${error.message}`);
  }
}

console.log('=== CLOUDINARY CREDENTIAL CHECK (READ-ONLY) ===');

await ping(
  'ACTIVE (VITE_ / CLOUDINARY_)',
  process.env.VITE_CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET,
);

await ping(
  'OLD',
  process.env.OLD_CLOUDINARY_CLOUD_NAME,
  process.env.OLD_CLOUDINARY_API_KEY,
  process.env.OLD_CLOUDINARY_API_SECRET,
);

await ping(
  'NEW',
  process.env.NEW_CLOUDINARY_CLOUD_NAME,
  process.env.NEW_CLOUDINARY_API_KEY,
  process.env.NEW_CLOUDINARY_API_SECRET,
);

console.log('\nCross-check: does NEW api_key work against OLD cloud (swapped credentials)?');
await ping(
  'NEW key + OLD cloud',
  process.env.OLD_CLOUDINARY_CLOUD_NAME,
  process.env.NEW_CLOUDINARY_API_KEY,
  process.env.NEW_CLOUDINARY_API_SECRET,
);

console.log('\nNo data was modified.');
