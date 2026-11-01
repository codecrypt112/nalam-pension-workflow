import { jwtVerify, SignJWT } from "jose";
import { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "nalam_session";
const SESSION_DURATION = "7d";

export type SessionPayload = {
  sub: string;
  name: string;
  role: Role;
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || typeof payload.name !== "string") return null;
    if (payload.role !== Role.field_verifier && payload.role !== Role.approving_officer) return null;
    return { sub: payload.sub, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}
