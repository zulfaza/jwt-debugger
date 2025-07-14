import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Copy, AlertCircleIcon } from 'lucide-react';
import { verifyJwtHS256 } from './lib/jwt/hs256/verify';
import { generateJwtHS256 } from './lib/jwt/hs256/generate';
import Github from './components/icons/github';

// Base64 URL decode function
function base64UrlDecode(str: string): string {
  try {
    // Add padding if needed
    const padding = '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
    return atob(base64);
  } catch {
    return '';
  }
}

function App() {
  const [encodedJWT, setEncodedJWT] = useState<string>(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  );
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem('jwt-debugger-dark-mode');
      if (stored !== null) return stored === 'true';
      return (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } catch {
      return false;
    }
  });

  // Effect to update localStorage and class
  useEffect(() => {
    window.localStorage.setItem(
      'jwt-debugger-dark-mode',
      isDarkMode.toString()
    );
  }, [isDarkMode]);

  // Listen for system changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      if (window.localStorage.getItem('jwt-debugger-dark-mode') === null) {
        setIsDarkMode(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Toggle function
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [isValidJwt, setIsValidJwt] = useState(true);
  const [isSignatureValid, setIsSignatureValid] = useState(true);
  const [copiedJWT, setCopiedJWT] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [editableHeader, setEditableHeader] = useState({
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

  const copyToClipboard = (text: string, type: 'jwt' | 'payload') => {
    navigator.clipboard.writeText(text);
    if (type === 'jwt') {
      setCopiedJWT(true);
      setTimeout(() => setCopiedJWT(false), 1000);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 1000);
    }
  };

  const decodeJWT = async (token: string, secretKey: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError({
          title: 'Invalid JWT',
          message: 'The JWT is not valid format',
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
          title: 'Invalid JWT',
          message: 'The JWT is not valid, failed to parse header or payload.',
        });
        setIsValidJwt(false);
        setIsSignatureValid(false);
        return;
      }

      const header = JSON.parse(headerJson);
      const payload = JSON.parse(payloadJson);
      // Verify signature for HS256
      const isSignatureValid = await verifyJwtHS256(token, secretKey)
        .then((result) => result.valid)
        .catch((err) => {
          console.error('Error verifying JWT signature:', err);
          return false;
        });

      setEditablePayload(JSON.stringify(payload, null, 2));
      setEditableHeader(header);
      setIsValidJwt(true);
      setIsSignatureValid(isSignatureValid);
    } catch (error) {
      console.log(error);
      setIsValidJwt(false);
      setIsSignatureValid(false);
    }
  };

  const handleEncodedJWTChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setError(null);
    const target = event.target;
    const value = target.value;
    setEncodedJWT(value);
    decodeJWT(value, secret);
  };

  const handlePayloadChange = async (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const target = event.target;
    const value = target.value;
    setEditablePayload(value);
    setError(null);
    try {
      const payloadJson = JSON.parse(value);
      const encodedPayload = await generateJwtHS256(payloadJson, secret);
      setEncodedJWT(encodedPayload);
      setIsSignatureValid(true);
      setIsValidJwt(true);
    } catch (error) {
      console.log(error);
      setError({
        title: 'Invalid Payload',
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error, Please check your payload and try again.',
      });
    }
  };

  const handleSignatureChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const target = event.target;
    const value = target.value;
    setSecret(value);
    setError(null);
    try {
      if (!value) {
        setError({
          title: 'Invalid Secret',
          message: 'Please enter a valid secret',
        });
        return;
      }
      const payload = JSON.parse(editablePayload);
      const encodedSignature = await generateJwtHS256(payload, value);
      setEncodedJWT(encodedSignature);
      setIsSignatureValid(true);
      setIsValidJwt(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-background text-foreground p-4 font-mono${
        isDarkMode ? ' dark' : ''
      }`}
    >
      <header className='border-b border-border mb-6'>
        <div className='container mx-auto px-4 py-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-primary'>▲</span>
            <span className='font-bold text-primary'>JWT-DEBUGGER</span>
            <span className='text-muted-foreground'>v1.0.0</span>
          </div>
          <Button
            onClick={toggleDarkMode}
            variant='ghost'
            size='sm'
            className='ml-4 flex items-center gap-1'
            aria-label='Toggle dark mode'
          >
            {isDarkMode ? (
              <span className='text-yellow-400'>🌙</span>
            ) : (
              <span className='text-blue-500'>☀️</span>
            )}
            <span className='text-muted-foreground text-xs'>
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className='container mx-auto px-4 flex-1'>
        <div className='grid lg:grid-cols-2 gap-8'>
          {/* Left Column - Encoded JWT */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-primary'>~</span>
              <span className='text-foreground'>ENCODED_JWT</span>
              <Button
                onClick={() => copyToClipboard(encodedJWT, 'jwt')}
                variant='ghost'
                size='sm'
                className={`transition-colors duration-200 ${
                  copiedJWT
                    ? 'text-green-500 hover:text-green-500 hover:bg-green-500/20'
                    : 'text-foreground hover:text-primary hover:bg-border'
                }`}
              >
                <Copy className='h-4 w-4 mr-1' />
                {copiedJWT ? 'copied!' : 'copy'}
              </Button>
            </div>

            <div className='relative'>
              <Textarea
                value={encodedJWT}
                onChange={handleEncodedJWTChange}
                placeholder='Enter your JWT here...'
                className='min-h-[120px] bg-card border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-0 focus:ring-offset-0'
              />
            </div>

            <div className='flex gap-4 text-sm mt-4'>
              <div className='flex items-center gap-2'>
                <span className='text-primary'>⚡</span>
                <span className='text-muted-foreground'>STATUS:</span>
                {isValidJwt ? (
                  <span className='text-green-500'>VALID_JWT</span>
                ) : (
                  <span className='text-red-400'>INVALID_JWT</span>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-primary'>⚡</span>
                <span className='text-muted-foreground'>SIGNATURE:</span>
                {isSignatureValid ? (
                  <span className='text-green-500'>VERIFIED</span>
                ) : (
                  <span className='text-red-400'>UNVERIFIED</span>
                )}
              </div>
            </div>

            {error && (
              <div className='mt-4 border border-red-400/30 bg-red-400/5 p-4 rounded'>
                <div className='flex items-center gap-2 text-red-400'>
                  <AlertCircleIcon className='h-4 w-4' />
                  <span className='font-bold'>{error.title}</span>
                </div>
                <p className='mt-2 text-red-400/80'>{error.message}</p>
              </div>
            )}
          </div>

          {/* Right Column - Editable JWT Components */}
          <div className='space-y-8'>
            {/* Header */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-primary'>~</span>
                <span className='text-accent'>header.json</span>
                <span className='text-muted-foreground text-sm'>
                  [readonly]
                </span>
              </div>
              <div className='border border-border bg-card rounded-lg p-4'>
                <Textarea
                  value={JSON.stringify(editableHeader, null, 2)}
                  className='min-h-[100px] bg-transparent border-0 text-foreground focus:ring-0 resize-none'
                  placeholder='JWT header data'
                  disabled
                />
              </div>
            </div>

            {/* Payload */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-primary'>{'>'}</span>
                  <span className='text-accent'>payload.json</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(editablePayload, 'payload')}
                  variant='ghost'
                  size='sm'
                  className={`transition-colors duration-200 ${
                    copiedPayload
                      ? 'text-green-500 hover:text-green-500 hover:bg-green-500/20'
                      : 'text-foreground hover:text-primary hover:bg-border'
                  }`}
                >
                  <Copy className='h-4 w-4 mr-1' />
                  {copiedPayload ? 'copied!' : 'copy'}
                </Button>
              </div>
              <Textarea
                value={editablePayload}
                onChange={handlePayloadChange}
                className='min-h-[120px] bg-card border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-0 focus:ring-offset-0'
                placeholder='Enter JWT payload data'
              />
            </div>

            {/* Signature Verification */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-primary'>~</span>
                <span className='text-accent'>verify_signature</span>
                <span className='text-primary'>--alg</span>
                <span className='text-green-500'>HS256</span>
              </div>
              <div className='border border-border bg-card rounded-lg p-4 space-y-4'>
                <Input
                  value={secret}
                  onChange={handleSignatureChange}
                  placeholder='Enter your secret key...'
                  className='bg-transparent border-border text-foreground focus:border-primary focus:ring-0'
                  disabled={
                    !editableHeader ||
                    editableHeader.alg.toUpperCase() !== 'HS256'
                  }
                />
                {secret && (
                  <div className='flex items-center gap-2'>
                    <span className='text-primary'>⚡</span>
                    <span className='text-muted-foreground'>SIGNATURE:</span>
                    {isSignatureValid ? (
                      <span className='text-green-500'>VERIFIED ✓</span>
                    ) : (
                      <span className='text-red-400'>INVALID ✗</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className='border-t border-border pt-6 text-center text-xs text-muted-foreground'>
        <span className='flex items-center justify-center gap-2'>
          &copy; {new Date().getFullYear()} Zulfaza.
          <a
            href='https://github.com/zulfaza/jwt-debugger'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1 text-[#89b4fa] hover:underline'
          >
            <Github className='w-4 h-4 text-[#89b4fa]' />
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
