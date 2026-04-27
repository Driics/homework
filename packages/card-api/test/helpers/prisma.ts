import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export type TestDb = { prisma: PrismaClient; dbUrl: string; cleanup(): Promise<void> };

export async function makeTestDb(): Promise<TestDb> {
  const id = randomUUID();
  const dir = path.join(ROOT, '.tmp');
  mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, `test-${id}.db`);
  const dbUrl = `file:${dbPath}`;
  execSync('pnpm prisma migrate deploy', {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'pipe',
  });
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  return {
    prisma,
    dbUrl,
    async cleanup() {
      await prisma.$disconnect();
    },
  };
}
