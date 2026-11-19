import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const ADMIN_COOKIE = "ms_admin_session";
const SESSION_DAYS = 7;

/** Identifiants administrateur (surchargeables par ADMIN_EMAIL / ADMIN_PASSWORD). */
const DEFAULT_ADMIN_EMAIL = "keitabenzoumana@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "messilaconfirmation5115";
const PASSWORD_HASH_KEY = "adminPasswordHash";
const EMAIL_KEY = "adminEmail";

function envEmail(): string {
  return (process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL).toLowerCase();
}
function envPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
}

function getSecret(): string {
  return process.env.ADMIN_SECRET?.trim() || `ms-secret::${envEmail()}::${process.env.DATABASE_URL ?? "local"}`;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const ref = Buffer.from(hash, "hex");
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

async function readSetting(key: string): Promise<string | null> {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function getAdminEmail(): Promise<string> {
  return ((await readSetting(EMAIL_KEY)) || envEmail()).toLowerCase();
}

/** Vérifie e-mail + mot de passe (mot de passe modifié depuis l'admin prioritaire). */
export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const expectedEmail = await getAdminEmail();
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail);
  const storedHash = await readSetting(PASSWORD_HASH_KEY);
  const passOk = storedHash ? verifyHash(password, storedHash) : safeEqual(password, envPassword());
  return emailOk && passOk;
}

export async function updateAdminCredentials(newEmail: string | null, newPassword: string | null): Promise<void> {
  if (newPassword) {
    const value = hashPassword(newPassword);
    await db.insert(settings).values({ key: PASSWORD_HASH_KEY, value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
  if (newEmail) {
    const value = newEmail.trim().toLowerCase();
    await db.insert(settings).values({ key: EMAIL_KEY, value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin.${expires}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = crypto.createHmac("sha256", getSecret()).update(`${parts[0]}.${parts[1]}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[2]);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function isAdminServer(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export function unauthorized() {
  return NextResponse.json({ error: "Accès refusé. Veuillez vous reconnecter." }, { status: 401 });
}

export function setAdminCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}
