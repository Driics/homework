import { describe, expect, it } from 'vitest';
import { formatDayHeading, formatTime } from './dates.js';

describe('formatDayHeading', () => {
  it('returns "Today" for the same calendar day', () => {
    const now = new Date('2026-04-25T10:00:00.000Z');
    expect(formatDayHeading('2026-04-25T08:00:00.000Z', now)).toBe('Today');
  });
  it('returns "Yesterday" for previous day', () => {
    const now = new Date('2026-04-25T10:00:00.000Z');
    expect(formatDayHeading('2026-04-24T18:00:00.000Z', now)).toBe('Yesterday');
  });
  it('returns formatted weekday + date for older items', () => {
    const now = new Date('2026-04-25T10:00:00.000Z');
    const result = formatDayHeading('2026-04-15T10:00:00.000Z', now);
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/15/);
  });
});

describe('formatTime', () => {
  it('formats hh:mm', () => {
    expect(formatTime('2026-04-25T13:45:00.000Z')).toMatch(/\d{1,2}:\d{2}/);
  });
});
