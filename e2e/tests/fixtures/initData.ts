import { createHmac } from 'node:crypto';

export type SignedInitData = { initData: string; user: { id: number; first_name: string } };

export function signInitData(opts: {
  botToken: string;
  userId: number;
  firstName: string;
  authDate?: number;
}): SignedInitData {
  const authDate = opts.authDate ?? Math.floor(Date.now() / 1000);
  const user = { id: opts.userId, first_name: opts.firstName };
  const params = new URLSearchParams({
    auth_date: String(authDate),
    query_id: 'AAH_e2e_test',
    user: JSON.stringify(user),
  });

  const sortedEntries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = sortedEntries.map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(opts.botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);

  return { initData: params.toString(), user };
}
