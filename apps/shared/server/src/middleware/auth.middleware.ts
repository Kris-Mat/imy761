import type { Request } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

// Reads env vars lazily inside a function, never at module load time: each
// app's server.ts imports the generated tsoa routes (which transitively
// import this middleware) before it calls dotenv.config(). Mirrors the
// lazy-singleton precedent in config/prisma.ts.
function getVerifier() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const hsSecret = process.env.SUPABASE_JWT_SECRET;
  if (!supabaseUrl) throw new Error('SUPABASE_URL is not set');

  if (hsSecret) {
    return { key: new TextEncoder().encode(hsSecret) };
  }

  jwks ??= createRemoteJWKSet(new URL(supabaseUrl + '/auth/v1/.well-known/jwks.json'));
  return { key: jwks };
}

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function expressAuthentication(
  request: Request,
  securityName: string
): Promise<AuthenticatedUser> {
  if (securityName !== 'jwt') {
    throw new Error(`Unsupported security scheme: ${securityName}`);
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing bearer token');
  }
  const token = authHeader.slice('Bearer '.length);

  const supabaseUrl = process.env.SUPABASE_URL;
  const { key } = getVerifier();
  const { payload } = await jwtVerify(token, key as never, {
    issuer: supabaseUrl + '/auth/v1',
    audience: 'authenticated'
  });

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    user_metadata: payload.user_metadata as Record<string, unknown> | undefined
  };
}
