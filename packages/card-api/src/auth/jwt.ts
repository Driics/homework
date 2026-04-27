import { SignJWT, jwtVerify } from 'jose';

export type TokenClaims = { sub: string; email: string };

export async function signToken(
  claims: TokenClaims,
  secret: string,
  expiresInSeconds: number,
): Promise<{ token: string; expiresAt: Date }> {
  const key = new TextEncoder().encode(secret);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const token = await new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(key);
  return { token, expiresAt };
}

export async function verifyToken(token: string, secret: string): Promise<TokenClaims> {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  const p = payload as { sub?: unknown; email?: unknown };
  if (typeof p.sub !== 'string' || typeof p.email !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: p.sub, email: p.email };
}
