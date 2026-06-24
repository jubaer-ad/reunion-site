import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export const SESSION_COOKIE = 'reunion_admin_session';
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';

export type AdminSession = {
  username: string;
  issuedAt: number;
};

export type AdminUserRole = 'admin' | 'super_admin';

export type AdminUser = {
  username: string;
  role: AdminUserRole;
};

function createSignature(payload: string) {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function signSession(session: AdminSession) {
  const payload = `${session.username}:${session.issuedAt}`;
  return `${payload}.${createSignature(payload)}`;
}

export function verifySession(value: string | undefined): AdminSession | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = createSignature(payload);
  if (expected !== signature) return null;

  const [username, issuedAt] = payload.split(':');
  const timestamp = Number(issuedAt);
  if (!username || Number.isNaN(timestamp)) return null;

  return { username, issuedAt: timestamp };
}

export async function getCurrentAdmin(request?: NextRequest) {
  const cookieStore = await cookies();
  const token = request ? request.cookies.get(SESSION_COOKIE)?.value : cookieStore.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!session) return null;

  const result = await getDb().query('SELECT username, role, password_reset_required FROM admin_users WHERE username = $1 AND is_active = TRUE', [session.username]);
  const row = result.rows[0];
  return row ? { username: session.username, role: row.role, passwordResetRequired: Boolean(row.password_reset_required) } : null;
}

export function generateTempPassword(length = 16) {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += TEMP_PASSWORD_CHARS.charAt(bytes[i] % TEMP_PASSWORD_CHARS.length);
  }
  return result;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedValue: string) {
  const [salt, hash] = storedValue.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

export async function setSessionCookie(username: string) {
  const cookieStore = await cookies();
  const token = signSession({ username, issuedAt: Date.now() });
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}
