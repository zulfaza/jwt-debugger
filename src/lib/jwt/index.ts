import type { JwtHeader, Algorithm } from './common/types';
import { generateJwtHS256 } from './hs256/generate';
import { verifyJwtHS256 } from './hs256/verify';
import { generateJwtRS256 } from './rs256/generate';
import { verifyJwtRS256 } from './rs256/verify';

export type { JwtHeader, Algorithm };

export interface GenerateOptions {
  payload: object;
  header: JwtHeader;
  secret?: string;
  privateKey?: string;
}

export interface VerifyOptions {
  token: string;
  secret?: string;
  publicKey?: string;
}

// Generate JWT based on algorithm in header
export async function generateJwt(options: GenerateOptions): Promise<string> {
  const { payload, header, secret, privateKey } = options;

  if (header.alg === 'HS256') {
    if (!secret) throw new Error('Secret required for HS256');
    return generateJwtHS256(payload, secret, header);
  }

  if (header.alg === 'RS256') {
    if (!privateKey) throw new Error('Private key required for RS256');
    return generateJwtRS256(payload, privateKey, header);
  }

  throw new Error(`Unsupported algorithm: ${header.alg}`);
}

// Verify JWT based on algorithm
export async function verifyJwt<T = unknown>(
  options: VerifyOptions
): Promise<{ valid: boolean; payload?: T }> {
  const { token, secret, publicKey } = options;

  // Parse header to determine algorithm
  const [headerB64] = token.split('.');
  if (!headerB64) return { valid: false };

  try {
    const headerJson = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'));
    const header = JSON.parse(headerJson) as JwtHeader;

    if (header.alg === 'HS256') {
      if (!secret) return { valid: false };
      return verifyJwtHS256(token, secret);
    }

    if (header.alg === 'RS256') {
      if (!publicKey) return { valid: false };
      return verifyJwtRS256(token, publicKey);
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}
