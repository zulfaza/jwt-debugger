// Helper: Base64Url encode
function base64UrlEncode(data: Uint8Array): string {
  const str = String.fromCharCode(...data);
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert string to Uint8Array
function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Import secret key for HMAC
async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encodeUTF8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

// Main function to generate JWT
export async function generateJwtHS256(
  payload: object,
  secret: string
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const headerStr = JSON.stringify(header);
  const payloadStr = JSON.stringify(payload);

  const headerEncoded = base64UrlEncode(encodeUTF8(headerStr));
  const payloadEncoded = base64UrlEncode(encodeUTF8(payloadStr));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const key = await importHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encodeUTF8(signingInput)
  );

  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${signingInput}.${signatureEncoded}`;
}
