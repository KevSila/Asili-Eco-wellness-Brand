import {
  createHmac,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import type { Request, RequestHandler, Response } from "express";

const PASSWORD_PREFIX = "scrypt";
const SESSION_VERSION = 1;

export interface AdminSession {
  email: string;
  role: "owner";
  expiresAt: number;
  csrfToken: string;
}

interface SessionPayload {
  v: number;
  sub: string;
  role: "owner";
  exp: number;
  csrf: string;
}

export interface AdminAuthService {
  configured: boolean;
  cookieName: string;
  authenticate(email: string, password: string): Promise<AdminSession | null>;
  readSession(request: Request): AdminSession | null;
  setSessionCookie(response: Response, session: AdminSession): void;
  clearSessionCookie(response: Response): void;
}

export interface AdminAuthOptions {
  email?: string;
  passwordHash?: string;
  sessionSecret?: string;
  sessionHours?: number;
  secureCookies?: boolean;
}

function scrypt(password: string, salt: Buffer, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function createAdminPasswordHash(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64);
  return `${PASSWORD_PREFIX}$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

async function verifyPassword(password: string, encodedHash: string) {
  const [prefix, saltValue, hashValue] = encodedHash.split("$");
  if (prefix !== PASSWORD_PREFIX || !saltValue || !hashValue) return false;

  try {
    const expected = Buffer.from(hashValue, "base64url");
    if (expected.length !== 64) return false;
    const actual = await scrypt(password, Buffer.from(saltValue, "base64url"), expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function parseCookieHeader(header: string | undefined) {
  const cookies = new Map<string, string>();
  for (const segment of header?.split(";") ?? []) {
    const separator = segment.indexOf("=");
    if (separator < 1) continue;
    const name = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    cookies.set(name, value);
  }
  return cookies;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminAuth(options: AdminAuthOptions = {}): AdminAuthService {
  const secureCookies = options.secureCookies ?? process.env.NODE_ENV === "production";
  const cookieName = secureCookies ? "__Host-asili_admin_session" : "asili_admin_session";
  const email = options.email?.trim().toLowerCase();
  const passwordHash = options.passwordHash?.trim();
  const sessionSecret = options.sessionSecret?.trim();
  const sessionHours = Number.isFinite(options.sessionHours) && (options.sessionHours ?? 0) > 0
    ? Math.min(options.sessionHours as number, 24)
    : 8;
  const configured = Boolean(email && passwordHash && sessionSecret && sessionSecret.length >= 32);

  const sign = (value: string) => createHmac("sha256", sessionSecret ?? "").update(value).digest("base64url");

  const encodeSession = (session: AdminSession) => {
    const payload: SessionPayload = {
      v: SESSION_VERSION,
      sub: session.email,
      role: session.role,
      exp: session.expiresAt,
      csrf: session.csrfToken,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encodedPayload}.${sign(encodedPayload)}`;
  };

  const decodeSession = (token: string | undefined): AdminSession | null => {
    if (!configured || !token) return null;
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) return null;

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
      if (
        payload.v !== SESSION_VERSION
        || payload.sub !== email
        || payload.role !== "owner"
        || !Number.isSafeInteger(payload.exp)
        || payload.exp <= Date.now()
        || typeof payload.csrf !== "string"
        || payload.csrf.length < 32
      ) return null;
      return { email: payload.sub, role: payload.role, expiresAt: payload.exp, csrfToken: payload.csrf };
    } catch {
      return null;
    }
  };

  return {
    configured,
    cookieName,
    async authenticate(candidateEmail, password) {
      if (!configured || candidateEmail.trim().toLowerCase() !== email) {
        if (passwordHash) await verifyPassword(password, passwordHash);
        return null;
      }
      if (!(await verifyPassword(password, passwordHash as string))) return null;
      return {
        email: email as string,
        role: "owner",
        expiresAt: Date.now() + sessionHours * 60 * 60 * 1000,
        csrfToken: randomBytes(32).toString("base64url"),
      };
    },
    readSession(request) {
      return decodeSession(parseCookieHeader(request.get("cookie")).get(cookieName));
    },
    setSessionCookie(response, session) {
      response.cookie(cookieName, encodeSession(session), {
        httpOnly: true,
        secure: secureCookies,
        sameSite: "strict",
        path: "/",
        maxAge: Math.max(0, session.expiresAt - Date.now()),
      });
    },
    clearSessionCookie(response) {
      response.clearCookie(cookieName, {
        httpOnly: true,
        secure: secureCookies,
        sameSite: "strict",
        path: "/",
      });
    },
  };
}

export function createAdminAuthFromEnvironment() {
  const configuredHours = Number(process.env.ADMIN_SESSION_HOURS);
  return createAdminAuth({
    email: process.env.ADMIN_EMAIL,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    sessionSecret: process.env.ADMIN_SESSION_SECRET,
    sessionHours: Number.isFinite(configuredHours) ? configuredHours : undefined,
  });
}

export function requireAdminSession(auth: AdminAuthService): RequestHandler {
  return (request, response, next) => {
    const session = auth.readSession(request);
    if (!session) return response.status(401).json({ error: "Authentication required.", code: "UNAUTHENTICATED" });
    response.locals.adminSession = session;
    next();
  };
}

export function requireAdminCsrf(): RequestHandler {
  return (_request, response, next) => {
    const session = response.locals.adminSession as AdminSession | undefined;
    const csrfHeader = _request.get("X-CSRF-Token");
    if (!session || !csrfHeader || !safeEqual(csrfHeader, session.csrfToken)) {
      return response.status(403).json({ error: "Request could not be verified.", code: "INVALID_CSRF" });
    }
    next();
  };
}
