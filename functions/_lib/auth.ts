import { Auth, type AuthConfig } from '@auth/core';
import Google from '@auth/core/providers/google';
import NeonAdapter from '@auth/neon-adapter';
import { Pool, neon } from '@neondatabase/serverless';

export type AuthEnv = {
  DATABASE_URL: string;
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
};

export type AuthenticatedUser = {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
};

function getMissingEnv(env: Partial<AuthEnv>) {
  return [
    ['DATABASE_URL', env.DATABASE_URL],
    ['AUTH_SECRET', env.AUTH_SECRET],
    ['AUTH_GOOGLE_ID', env.AUTH_GOOGLE_ID],
    ['AUTH_GOOGLE_SECRET', env.AUTH_GOOGLE_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function getAuthConfig(env: AuthEnv): AuthConfig {
  const missing = getMissingEnv(env);

  if (missing.length > 0) {
    throw new Error(`Missing auth environment variables: ${missing.join(', ')}`);
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL });

  return {
    adapter: NeonAdapter(pool),
    basePath: '/api/auth',
    trustHost: true,
    secret: env.AUTH_SECRET,
    session: {
      strategy: 'database',
    },
    providers: [
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
    ],
    callbacks: {
      session({ session, user }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: String(user.id),
          },
        };
      },
    },
  };
}

export async function handleAuthRequest(request: Request, env: AuthEnv) {
  return Auth(request, getAuthConfig(env));
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const entry of cookieHeader.split(';')) {
    const [rawName, ...rest] = entry.trim().split('=');

    if (!rawName || rest.length === 0) {
      continue;
    }

    cookies.set(rawName, decodeURIComponent(rest.join('=')));
  }

  return cookies;
}

function getSessionToken(request: Request) {
  const cookies = parseCookieHeader(request.headers.get('cookie'));

  return (
    cookies.get('__Secure-authjs.session-token') ||
    cookies.get('authjs.session-token') ||
    null
  );
}

export async function getAuthenticatedUser(
  request: Request,
  env: AuthEnv
): Promise<AuthenticatedUser | null> {
  const sessionToken = getSessionToken(request);

  if (!sessionToken || !env.DATABASE_URL) {
    return null;
  }

  const sql = neon(env.DATABASE_URL);
  const rows = (await sql`
    SELECT u.id, u.name, u.email, u.image
    FROM sessions s
    INNER JOIN users u ON u.id = s."userId"
    WHERE s."sessionToken" = ${sessionToken}
      AND s.expires > NOW()
    LIMIT 1
  `) as AuthenticatedUser[];

  return rows[0] ?? null;
}
