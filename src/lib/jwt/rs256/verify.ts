import { pemToArrayBuffer } from './pem';

// Base64Url decode
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad =
    base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const decoded = atob(base64 + pad);
  return new Uint8Array([...decoded].map((c) => c.charCodeAt(0)));
}

// Decode JWT parts
function parseJwt(token: string) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64)
    throw new Error('Invalid JWT format');

  return {
    header: JSON.parse(atob(headerB64)),
    payload: JSON.parse(atob(payloadB64)),
    signature: base64UrlDecode(signatureB64),
    signingInput: `${headerB64}.${payloadB64}`,
  };
}

// Import public key for RSA verification
async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

// Verify JWT (RS256)
export async function verifyJwtRS256<T = unknown>(
  token: string,
  publicKeyPem: string
): Promise<{ valid: boolean; payload?: T }> {
  try {
    const { header, payload, signature, signingInput } = parseJwt(token);

    if (header.alg !== 'RS256')
      throw new Error(`Unsupported algorithm: ${header.alg}`);

    const key = await importRsaPublicKey(publicKeyPem);
    const enc = new TextEncoder();

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      enc.encode(signingInput)
    );

    return valid ? { valid: true, payload } : { valid: false };
  } catch (err) {
    console.error('JWT verification error:', err);
    return { valid: false };
  }
}
