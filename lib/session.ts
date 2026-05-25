import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

type SessionPayload = {
  cpf: string;
  slug: string;
  transportador: string;
};

function getSecret() {
  const secret = process.env.APP_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("APP_SECRET precisa ter pelo menos 32 caracteres.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    return {
      cpf: String(payload.cpf),
      slug: String(payload.slug),
      transportador: String(payload.transportador)
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_3pl")?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getXptSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_xpt")?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
