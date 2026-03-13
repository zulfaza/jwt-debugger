import type { JwtHeader } from '../common/types';
import { pemToArrayBuffer } from './pem';

// Base64Url encode
function base64UrlEncode(data: Uint8Array): string {
  const str = String.fromCharCode(...data);
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert string to Uint8Array
function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Import private key for RSA signing
async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

// Generate JWT with RS256
export async function generateJwtRS256(
  payload: object,
  privateKeyPem: string,
  header: JwtHeader = { alg: 'RS256', typ: 'JWT' }
): Promise<string> {
  const headerStr = JSON.stringify(header);
  const payloadStr = JSON.stringify(payload);

  const headerEncoded = base64UrlEncode(encodeUTF8(headerStr));
  const payloadEncoded = base64UrlEncode(encodeUTF8(payloadStr));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const key = await importRsaPrivateKey(privateKeyPem);
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encodeUTF8(signingInput)
  );

  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${signingInput}.${signatureEncoded}`;
}
