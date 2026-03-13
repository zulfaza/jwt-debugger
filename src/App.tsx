import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JsonEditor } from '@/components/ui/json-editor';
import { TokenEditor } from '@/components/ui/token-editor';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AlertCircleIcon, Copy, MoonStar, SunMedium } from 'lucide-react';
import Github from './components/icons/github';
import { generateJwt, verifyJwt } from './lib/jwt';
import type { Algorithm, JwtHeader } from './lib/jwt';

const panelClassName =
  'rounded-lg border border-border/80 bg-card px-5 py-5 sm:px-6';
const metadataClassName =
  'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium';

function base64UrlDecode(str: string): string {
  try {
    const padding = '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
    return atob(base64);
  } catch {
    return '';
  }
}

function isAlgorithm(value: unknown): value is Algorithm {
  return value === 'HS256' || value === 'RS256';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseAlgorithm(value: string): Algorithm | null {
  return isAlgorithm(value) ? value : null;
}

function parseJwtHeader(value: string): JwtHeader | null {
  const parsed: unknown = JSON.parse(value);

  if (!isRecord(parsed) || !isAlgorithm(parsed.alg)) {
    return null;
  }

  const header: JwtHeader = {
    alg: parsed.alg,
    typ: 'JWT',
  };

  if (typeof parsed.kid === 'string' && parsed.kid.length > 0) {
    header.kid = parsed.kid;
  }

  return header;
}

function getStatusClass(isValid: boolean): string {
  return isValid
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300';
}

function getNeutralClass(): string {
  return 'border-border bg-muted/60 text-muted-foreground';
}

function App() {
  const [encodedJWT, setEncodedJWT] = useState<string>(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem('jwt-debugger-dark-mode');
      if (stored !== null) {
        return stored === 'true';
      }

      return (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } catch {
      return false;
    }
  });
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('HS256');
  const [kid, setKid] = useState('');
  const [isValidJwt, setIsValidJwt] = useState(true);
  const [isSignatureValid, setIsSignatureValid] = useState(true);
  const [copiedJWT, setCopiedJWT] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [editableHeader, setEditableHeader] = useState<JwtHeader>({
    alg: 'HS256',
    typ: 'JWT',
  });
  const [editablePayload, setEditablePayload] = useState(
    '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'
  );
  const [error, setError] = useState<null | {
    title: string;
    message: string;
  }>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);

    try {
      window.localStorage.setItem(
        'jwt-debugger-dark-mode',
        isDarkMode.toString()
      );
    } catch {
      console.error('Failed to persist theme preference.');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem('jwt-debugger-dark-mode') === null) {
          setIsDarkMode(event.matches);
        }
      } catch {
        setIsDarkMode(event.matches);
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const copyToClipboard = (text: string, type: 'jwt' | 'payload') => {
    void navigator.clipboard.writeText(text);

    if (type === 'jwt') {
      setCopiedJWT(true);
      setTimeout(() => setCopiedJWT(false), 1000);
      return;
    }

    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 1000);
  };

  const decodeJWT = async (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError({
          title: 'Invalid token',
          message: 'JWTs must contain header, payload, and signature segments.',
        });
        setIsValidJwt(false);
        setIsSignatureValid(false);
        return;
      }

      const [headerB64, payloadB64] = parts;
      const headerJson = base64UrlDecode(headerB64);
      const payloadJson = base64UrlDecode(payloadB64);

      if (!headerJson || !payloadJson) {
        setError({
          title: 'Invalid token',
          message: 'The token could not be decoded into JSON header and payload segments.',
        });
        setIsValidJwt(false);
        setIsSignatureValid(false);
        return;
      }

      const header = parseJwtHeader(headerJson);
      if (!header) {
        setError({
          title: 'Invalid header',
          message: 'Only HS256 and RS256 headers are supported in this tool.',
        });
        setIsValidJwt(false);
        setIsSignatureValid(false);
        return;
      }

      const payload = JSON.parse(payloadJson);
      const sigValid = await verifyJwt({
        token,
        secret: header.alg === 'HS256' ? secret : undefined,
        publicKey: header.alg === 'RS256' ? publicKey : undefined,
      })
        .then((result) => result.valid)
        .catch((decodeError) => {
          console.error('Error verifying JWT signature:', decodeError);
          return false;
        });

      setAlgorithm(header.alg);
      setKid(header.kid || '');
      setEditableHeader(header);
      setEditablePayload(JSON.stringify(payload, null, 2));
      setIsValidJwt(true);
      setIsSignatureValid(sigValid);
    } catch (decodeError) {
      console.error(decodeError);
      setError({
        title: 'Invalid token',
        message: 'The token payload could not be parsed as valid JSON.',
      });
      setIsValidJwt(false);
      setIsSignatureValid(false);
    }
  };

  const handleEncodedJWTValueChange = (value: string) => {
    setError(null);
    setEncodedJWT(value);
    void decodeJWT(value);
  };

  const buildHeader = (): JwtHeader => {
    const header: JwtHeader = { alg: algorithm, typ: 'JWT' };
    if (kid) {
      header.kid = kid;
    }
    return header;
  };

  const regenerateJwt = async (payload: object, header: JwtHeader) => {
    const encoded = await generateJwt({
      payload,
      header,
      secret: algorithm === 'HS256' ? secret : undefined,
      privateKey: algorithm === 'RS256' ? privateKey : undefined,
    });

    setEncodedJWT(encoded);
    setEditableHeader(header);
    setIsSignatureValid(true);
    setIsValidJwt(true);
  };

  const handlePayloadChange = async (value: string) => {
    setEditablePayload(value);
    setError(null);

    try {
      const payloadJson = JSON.parse(value);
      await regenerateJwt(payloadJson, buildHeader());
    } catch (payloadError) {
      console.error(payloadError);
      setError({
        title: 'Invalid payload',
        message:
          payloadError instanceof Error
            ? payloadError.message
            : 'Check the JSON payload and try again.',
      });
    }
  };

  const handleSecretChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSecret(value);
    setError(null);

    try {
      if (!value) {
        setError({
          title: 'Missing secret',
          message: 'Enter a secret to sign or verify HS256 tokens.',
        });
        return;
      }

      const payload = JSON.parse(editablePayload);
      await regenerateJwt(payload, buildHeader());
    } catch (secretError) {
      console.error(secretError);
    }
  };

  const handlePrivateKeyChange = async (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setPrivateKey(value);
    setError(null);

    if (!value) {
      return;
    }

    try {
      const payload = JSON.parse(editablePayload);
      await regenerateJwt(payload, buildHeader());
    } catch (privateKeyError) {
      console.error(privateKeyError);
      setError({
        title: 'Invalid private key',
        message:
          privateKeyError instanceof Error
            ? privateKeyError.message
            : 'Failed to sign with the provided private key.',
      });
    }
  };

  const handlePublicKeyChange = async (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setPublicKey(value);
    setError(null);

    if (!value || !encodedJWT) {
      return;
    }

    try {
      const sigValid = await verifyJwt({
        token: encodedJWT,
        publicKey: value,
      }).then((result) => result.valid);

      setIsSignatureValid(sigValid);
    } catch (publicKeyError) {
      console.error(publicKeyError);
      setIsSignatureValid(false);
    }
  };

  const handleAlgorithmChange = (newAlgorithm: Algorithm) => {
    setAlgorithm(newAlgorithm);

    const nextHeader: JwtHeader = {
      alg: newAlgorithm,
      typ: 'JWT',
    };

    if (kid) {
      nextHeader.kid = kid;
    }

    setEditableHeader(nextHeader);
  };

  const handleKidChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setKid(value);

    try {
      const payload = JSON.parse(editablePayload);
      const nextHeader: JwtHeader = { alg: algorithm, typ: 'JWT' };

      if (value) {
        nextHeader.kid = value;
      }

      setEditableHeader(nextHeader);

      if (algorithm === 'HS256' && secret) {
        await regenerateJwt(payload, nextHeader);
      } else if (algorithm === 'RS256' && privateKey) {
        await regenerateJwt(payload, nextHeader);
      }
    } catch (kidError) {
      console.error(kidError);
    }
  };

  const headerPreview = JSON.stringify(editableHeader, null, 2);

  return (
    <div className='min-h-screen text-foreground'>
      <div className='mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8'>
        <section>
          <div className='space-y-3'>
            <h1 className='max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl'>
              JWT Debugger
            </h1>
            <p className='max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base'>
              Paste a token, review its header, adjust claims, and switch between
              shared-secret and RSA verification flows with immediate feedback.
            </p>
          </div>
        </section>

        <main className='mt-8 grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]'>
          <div className='space-y-6'>
            <section className={panelClassName}>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <h2 className='text-lg font-semibold tracking-tight'>
                    Encoded token
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Paste a JWT to decode its structure and evaluate the signature.
                  </p>
                </div>
                <Button
                  type='button'
                  onClick={() => copyToClipboard(encodedJWT, 'jwt')}
                  variant='ghost'
                  size='sm'
                  className={
                    copiedJWT
                      ? 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/16 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-300'
                      : undefined
                  }
                >
                  <Copy className='h-4 w-4' />
                  {copiedJWT ? 'Copied' : 'Copy token'}
                </Button>
              </div>

              <div className='mt-4 space-y-4'>
                <div className='flex flex-wrap gap-2'>
                  <span className={cn(metadataClassName, getStatusClass(isValidJwt))}>
                    {isValidJwt ? 'Readable header + payload' : 'Needs valid JWT shape'}
                  </span>
                  <span
                    className={cn(
                      metadataClassName,
                      isSignatureValid ? getNeutralClass() : getStatusClass(false)
                    )}
                  >
                    {isSignatureValid ? 'Signature matches current inputs' : 'Verification failed'}
                  </span>
                </div>

                <TokenEditor
                  value={encodedJWT}
                  onChange={handleEncodedJWTValueChange}
                  placeholder='Paste a JWT'
                />

                {error ? (
                  <Alert
                    variant='destructive'
                    className='border-destructive/30 bg-destructive/10'
                  >
                    <AlertCircleIcon className='h-4 w-4' />
                    <AlertTitle>{error.title}</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </section>

            <section className={panelClassName}>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <h2 className='text-lg font-semibold tracking-tight'>Payload</h2>
                  <p className='text-sm text-muted-foreground'>
                    Edit claims and regenerate the token from the current signing
                    settings.
                  </p>
                </div>
                <Button
                  type='button'
                  onClick={() => copyToClipboard(editablePayload, 'payload')}
                  variant='ghost'
                  size='sm'
                  className={
                    copiedPayload
                      ? 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/16 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-300'
                      : undefined
                  }
                >
                  <Copy className='h-4 w-4' />
                  {copiedPayload ? 'Copied' : 'Copy payload'}
                </Button>
              </div>

              <div className='mt-4'>
                <JsonEditor
                  value={editablePayload}
                  onChange={handlePayloadChange}
                  placeholder='Paste a JSON payload'
                />
              </div>
            </section>
          </div>

          <div className='space-y-6'>
            <section className={panelClassName}>
              <div className='space-y-1'>
                <h2 className='text-lg font-semibold tracking-tight'>Header</h2>
                <p className='text-sm text-muted-foreground'>
                  Parsed token metadata. The editor is read-only and updates from
                  the current token.
                </p>
              </div>

              <div className='mt-4'>
                <JsonEditor
                  value={headerPreview}
                  readOnly
                  placeholder='Token header'
                  editorClassName='min-h-[164px]'
                />
              </div>
            </section>

            <section className={panelClassName}>
              <div className='space-y-1'>
                <h2 className='text-lg font-semibold tracking-tight'>
                  Signing and verification
                </h2>
                <p className='text-sm text-muted-foreground'>
                  Choose the algorithm, set an optional key ID, and provide the
                  material needed for signing or verification.
                </p>
              </div>

              <div className='mt-4 space-y-4'>
                <div className='grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)]'>
                  <label className='space-y-2' htmlFor='jwt-algorithm'>
                    <span className='text-sm font-medium'>Algorithm</span>
                    <select
                      id='jwt-algorithm'
                      value={algorithm}
                      onChange={(event) => {
                        const nextAlgorithm = parseAlgorithm(event.target.value);
                        if (nextAlgorithm) {
                          handleAlgorithmChange(nextAlgorithm);
                        }
                      }}
                      className='flex h-10 w-full rounded-lg border border-input bg-input px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'
                    >
                      <option value='HS256'>HS256</option>
                      <option value='RS256'>RS256</option>
                    </select>
                  </label>

                  <label className='space-y-2' htmlFor='jwt-kid'>
                    <span className='text-sm font-medium'>Key ID</span>
                    <Input
                      id='jwt-kid'
                      value={kid}
                      onChange={handleKidChange}
                      placeholder='Optional key identifier'
                    />
                  </label>
                </div>

                {algorithm === 'HS256' ? (
                  <label className='space-y-2' htmlFor='jwt-secret'>
                    <span className='text-sm font-medium'>Shared secret</span>
                    <Input
                      id='jwt-secret'
                      value={secret}
                      onChange={handleSecretChange}
                      placeholder='Enter the secret used to sign the token'
                    />
                  </label>
                ) : null}

                {algorithm === 'RS256' ? (
                  <div className='space-y-4'>
                    <label className='space-y-2' htmlFor='jwt-private-key'>
                      <span className='text-sm font-medium'>Private key</span>
                      <Textarea
                        id='jwt-private-key'
                        value={privateKey}
                        onChange={handlePrivateKeyChange}
                        placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
                        className='min-h-[132px] font-mono text-[13px] leading-6'
                      />
                    </label>

                    <label className='space-y-2' htmlFor='jwt-public-key'>
                      <span className='text-sm font-medium'>Public key</span>
                      <Textarea
                        id='jwt-public-key'
                        value={publicKey}
                        onChange={handlePublicKeyChange}
                        placeholder={'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'}
                        className='min-h-[132px] font-mono text-[13px] leading-6'
                      />
                    </label>
                  </div>
                ) : null}

                <div className='flex flex-wrap gap-2 border-t border-border/70 pt-4'>
                  <span className={cn(metadataClassName, getNeutralClass())}>
                    Mode {algorithm}
                  </span>
                  <span
                    className={cn(metadataClassName, getStatusClass(isSignatureValid))}
                  >
                    {isSignatureValid ? 'Ready to verify' : 'Verification needs attention'}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className='mt-8 flex flex-col gap-3 border-t border-border/80 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3'>
            <span>&copy; {new Date().getFullYear()} Zulfaza</span>
            <span className='hidden text-border sm:inline'>/</span>
            <span>Built for quick token inspection and signature checks.</span>
          </div>

          <div className='flex items-center gap-2'>
            <Button asChild variant='ghost' size='sm'>
              <a
                href='https://github.com/zulfaza/jwt-debugger'
                target='_blank'
                rel='noopener noreferrer'
              >
                <Github className='h-4 w-4' />
                Source
              </a>
            </Button>
            <Button
              type='button'
              onClick={() => setIsDarkMode((current) => !current)}
              variant='outline'
              size='sm'
              aria-label='Toggle color mode'
            >
              {isDarkMode ? (
                <MoonStar className='h-4 w-4' />
              ) : (
                <SunMedium className='h-4 w-4' />
              )}
              {isDarkMode ? 'Dark' : 'Light'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
