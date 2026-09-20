const { execSync } = require('child_process');

const databaseUrl = process.env.DATABASE_URL || '';
const directUrl = process.env.DIRECT_URL || '';
const isPostgres = databaseUrl.startsWith('postgres') || directUrl.startsWith('postgres');

const schema = isPostgres ? 'prisma/schema.neon.prisma' : 'prisma/schema.prisma';
console.log(`[Prisma] Generating Prisma Client using schema: ${schema}`);

try {
  const out = execSync(`npx prisma generate --schema=${schema}`, { encoding: 'utf8' });
  console.log(out);
} catch (err) {
  const output = (err.stdout || '') + (err.stderr || '') + (err.message || '');
  if (process.platform === 'win32' && output.includes('EPERM')) {
    console.warn('[Prisma] Notice: Query engine binary is currently in use by an active dev process on Windows. Existing generated client will be used.');
  } else {
    console.error('[Prisma] Generation error:', output);
    process.exit(1);
  }
}
