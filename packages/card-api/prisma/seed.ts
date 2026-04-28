import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'Passw0rd!';
const COUNTRIES = ['US', 'DE', 'GB', 'FR', 'JP'];
const CATEGORIES = ['Grocery', 'Transport', 'Online', 'Dining', 'Travel', 'Subscription'];
const MERCHANTS: Record<string, string[]> = {
  Grocery: ['Whole Foods', 'Tesco', 'REWE'],
  Transport: ['Uber', 'Lyft', 'Deutsche Bahn'],
  Online: ['Amazon', 'Etsy'],
  Dining: ['Five Guys', 'Sushi Zen', 'Bistro 21'],
  Travel: ['Delta', 'Lufthansa', 'Booking.com'],
  Subscription: ['Spotify', 'Netflix', 'iCloud'],
};

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}
function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('Seed skipped — users already exist.');
    return;
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  const users = await Promise.all([
    prisma.user.create({
      data: { email: 'alice@example.com', passwordHash: hash, fullName: 'Alice Anderson' },
    }),
    prisma.user.create({
      data: { email: 'bob@example.com', passwordHash: hash, fullName: 'Bob Brown' },
    }),
    prisma.user.create({
      data: { email: 'charlie@example.com', passwordHash: hash, fullName: 'Charlie Chen' },
    }),
  ]);
  const [alice, bob] = users;

  const cardSpecs = [
    { user: alice!, currency: 'USD' as const, status: 'ACTIVE' as const, type: 'VIRTUAL' as const },
    {
      user: alice!,
      currency: 'EUR' as const,
      status: 'ACTIVE' as const,
      type: 'PHYSICAL' as const,
    },
    { user: alice!, currency: 'GBP' as const, status: 'ACTIVE' as const, type: 'VIRTUAL' as const },
    { user: bob!, currency: 'USD' as const, status: 'ACTIVE' as const, type: 'VIRTUAL' as const },
    { user: bob!, currency: 'EUR' as const, status: 'FROZEN' as const, type: 'PHYSICAL' as const },
  ];

  for (let idx = 0; idx < cardSpecs.length; idx++) {
    const spec = cardSpecs[idx]!;
    const last4 = String(1000 + idx).padStart(4, '0');
    const card = await prisma.card.create({
      data: {
        userId: spec.user.id,
        maskedPan: `**** **** **** ${last4}`,
        last4,
        cardholderName: spec.user.fullName,
        expiryMonth: 12,
        expiryYear: 2029,
        currency: spec.currency,
        ledgerBalanceMinor: 100_000,
        availableBalanceMinor: 100_000,
        status: spec.status,
        type: spec.type,
      },
    });
    if (spec.status === 'FROZEN') continue;

    const rng = rand(idx + 1);
    const now = Date.now();
    const txCount = 10 + Math.floor(rng() * 6); // 10..15

    let ledger = 100_000;
    for (let i = 0; i < txCount; i++) {
      const direction = rng() < 0.1 ? 'CREDIT' : 'DEBIT';
      const amount = Math.floor(500 + rng() * 12_000);
      const cat = pick(CATEGORIES, Math.floor(rng() * CATEGORIES.length));
      const merch = pick(MERCHANTS[cat]!, Math.floor(rng() * 99));
      const country = pick(COUNTRIES, Math.floor(rng() * COUNTRIES.length));
      const postedAt = new Date(now - i * 24 * 60 * 60 * 1000);

      const auth = await prisma.authorization.create({
        data: {
          cardId: card.id,
          amountMinor: amount,
          direction,
          currency: spec.currency,
          merchantName: merch,
          merchantCategory: cat,
          merchantCountry: country,
          merchantCity: 'CityX',
          status: 'CAPTURED',
          authorizedAt: postedAt,
          expiresAt: new Date(postedAt.getTime() + 7 * 864e5),
        },
      });
      await prisma.transaction.create({
        data: {
          cardId: card.id,
          authorizationId: auth.id,
          amountMinor: amount,
          direction,
          currency: spec.currency,
          merchantName: merch,
          merchantCategory: cat,
          merchantCountry: country,
          merchantCity: 'CityX',
          kind: direction === 'CREDIT' ? 'REFUND' : 'PURCHASE',
          description: `${cat} — ${merch}`,
          postedAt,
        },
      });
      ledger += direction === 'CREDIT' ? amount : -amount;
    }

    for (let i = 0; i < 3; i++) {
      await prisma.authorization.create({
        data: {
          cardId: card.id,
          amountMinor: Math.floor(1000 + rng() * 5_000),
          direction: 'DEBIT',
          currency: spec.currency,
          merchantName: pick(MERCHANTS.Online!, i),
          merchantCategory: 'Online',
          merchantCountry: pick(COUNTRIES, i),
          merchantCity: 'CityX',
          status: 'PENDING',
          authorizedAt: new Date(now - i * 3600_000),
          expiresAt: new Date(now + 7 * 864e5),
        },
      });
    }
    await prisma.authorization.create({
      data: {
        cardId: card.id,
        amountMinor: 5_000,
        direction: 'DEBIT',
        currency: spec.currency,
        merchantName: 'SketchySite',
        merchantCategory: 'Online',
        merchantCountry: 'US',
        merchantCity: 'Unknown',
        status: 'DECLINED',
        declineReason: 'Insufficient funds',
        authorizedAt: new Date(now - 2 * 864e5),
        expiresAt: new Date(now + 864e5),
      },
    });

    const pendingHolds = await prisma.authorization.aggregate({
      where: { cardId: card.id, status: 'PENDING' },
      _sum: { amountMinor: true },
    });
    const holds = pendingHolds._sum.amountMinor ?? 0;
    await prisma.card.update({
      where: { id: card.id },
      data: { ledgerBalanceMinor: ledger, availableBalanceMinor: ledger - holds },
    });
  }

  console.log('Seeded 3 users, 5 cards (1 frozen, 0 for charlie), 10–15 tx per active card.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
