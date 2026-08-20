/**
 * auth.ts — Lightweight JWT-style session management using Node.js crypto only.
 * No external JWT libraries — keeps bundle lean and free-tier friendly.
 */
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "docsense_dev_secret_change_in_prod";
const TOKEN_EXPIRY_HOURS = 24;

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  plan: "Starter" | "Pro";
  iat: number;
  exp: number;
}

// ─── Token Creation ────────────────────────────────────────────────────────────

function base64urlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function base64urlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

function sign(header: string, payload: string): string {
  return crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
}

export function signToken(payload: Omit<SessionPayload, "iat" | "exp">): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY_HOURS * 3600,
  };

  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signature = sign(header, encodedPayload);

  return `${header}.${encodedPayload}.${signature}`;
}

// ─── Token Verification ────────────────────────────────────────────────────────

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = sign(header, payload);

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSig.length) return null;
    const sigBuf = Buffer.from(signature, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const decoded: SessionPayload = JSON.parse(base64urlDecode(payload));
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp < now) return null; // Expired

    return decoded;
  } catch {
    return null;
  }
}

// ─── Request Helper ────────────────────────────────────────────────────────────

/**
 * Extract session from a Next.js Request.
 * Priority: Authorization Bearer token → x-user-id header (legacy fallback)
 */
export function getSessionFromRequest(req: Request): Partial<SessionPayload> | null {
  // 1. JWT Bearer token (preferred)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const session = verifyToken(token);
    if (session) return session;
  }

  // 2. Cookie-based token (future support)
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const tokenMatch = cookie.match(/docsense_session=([^;]+)/);
    if (tokenMatch) {
      const session = verifyToken(tokenMatch[1]);
      if (session) return session;
    }
  }

  // 3. Legacy x-user-id header fallback (development / testing only)
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const userId = req.headers.get("x-user-id");
    const plan = req.headers.get("x-user-plan") as "Starter" | "Pro" | null;
    if (userId) {
      return {
        userId,
        plan: plan === "Pro" ? "Pro" : "Starter",
      };
    }
  }

  return null;
}

/**
 * Get userId from request — convenience wrapper.
 * Returns "default_user" if unauthenticated.
 */
export function getUserIdFromRequest(req: Request): string {
  const session = getSessionFromRequest(req);
  if (session?.userId) return session.userId;
  if (process.env.NODE_ENV !== "production") {
    return req.headers.get("x-user-id") || "default_user";
  }
  return "unauthenticated_user";
}

/**
 * Get plan from request — convenience wrapper.
 */
export function getPlanFromRequest(req: Request): "Starter" | "Pro" {
  const session = getSessionFromRequest(req);
  if (session?.plan === "Pro") return "Pro";
  if (process.env.NODE_ENV !== "production") {
    const headerPlan = req.headers.get("x-user-plan");
    return headerPlan === "Pro" ? "Pro" : "Starter";
  }
  return "Starter";
}

