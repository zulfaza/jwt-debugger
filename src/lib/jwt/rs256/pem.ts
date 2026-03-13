// Strip PEM headers and decode base64 to ArrayBuffer
export function pemToArrayBuffer(pem: string): ArrayBuffer {
  const lines = pem.trim().split('\n');
  const base64 = lines
    .filter((line) => !line.startsWith('-----'))
    .join('');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Check if string looks like a PEM key
export function isPem(str: string): boolean {
  return str.includes('-----BEGIN') && str.includes('-----END');
}
