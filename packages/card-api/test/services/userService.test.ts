import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashPassword } from '../../src/auth/password.js';
import { NotFoundError, UnauthorizedError } from '../../src/errors.js';
import { getUserProfile, verifyUserCredentials } from '../../src/services/userService.js';
import { type TestDb, makeTestDb } from '../helpers/prisma.js';

let db: TestDb;
let aliceId: string;

beforeAll(async () => {
  db = await makeTestDb();
  const hash = await hashPassword('Passw0rd!');
  const alice = await db.prisma.user.create({
    data: { email: 'a@x.com', passwordHash: hash, fullName: 'Alice' },
  });
  aliceId = alice.id;
});
afterAll(async () => {
  await db.cleanup();
});

describe('verifyUserCredentials', () => {
  it('returns user on correct email+password', async () => {
    const u = await verifyUserCredentials(db.prisma, { email: 'a@x.com', password: 'Passw0rd!' });
    expect(u.id).toBe(aliceId);
  });
  it('throws UnauthorizedError INVALID_CREDENTIALS on wrong password', async () => {
    await expect(
      verifyUserCredentials(db.prisma, { email: 'a@x.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
  it('throws UnauthorizedError INVALID_CREDENTIALS on unknown email (no enumeration)', async () => {
    await expect(
      verifyUserCredentials(db.prisma, { email: 'nope@x.com', password: 'x' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
});
describe('getUserProfile', () => {
  it('returns profile for known user', async () => {
    const p = await getUserProfile(db.prisma, aliceId);
    expect(p.email).toBe('a@x.com');
  });
  it('throws NotFoundError for unknown user', async () => {
    await expect(
      getUserProfile(db.prisma, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
