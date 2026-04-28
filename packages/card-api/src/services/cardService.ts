import type { Card } from '@homework/shared';
import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../errors.js';

function toCardDto(row: {
  id: string;
  maskedPan: string;
  last4: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  currency: string;
  ledgerBalanceMinor: number;
  availableBalanceMinor: number;
  status: string;
  type: string;
  createdAt: Date;
}): Card {
  return {
    id: row.id,
    maskedPan: row.maskedPan,
    last4: row.last4,
    cardholderName: row.cardholderName,
    expiryMonth: row.expiryMonth,
    expiryYear: row.expiryYear,
    currency: row.currency as Card['currency'],
    ledgerBalanceMinor: row.ledgerBalanceMinor,
    availableBalanceMinor: row.availableBalanceMinor,
    status: row.status as Card['status'],
    type: row.type as Card['type'],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function loadOwnedCard(
  prisma: PrismaClient,
  userId: string,
  cardId: string,
): Promise<Card> {
  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) throw new NotFoundError('CARD_NOT_FOUND', 'Card not found');
  return toCardDto(card);
}

export async function listUserCards(prisma: PrismaClient, userId: string): Promise<Card[]> {
  const rows = await prisma.card.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  return rows.map(toCardDto);
}
