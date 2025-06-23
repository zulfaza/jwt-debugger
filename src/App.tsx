import './App.css';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { verifyJwtHS256 } from './lib/jwt/verify';
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

interface DecodedJWT {
  header: unknown;
  payload: unknown;
  signature: string;
  isValid: boolean;
  isSignatureValid: boolean;
}

function App() {
  const [encodedJWT, setEncodedJWT] = useState(
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
  );
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [decodedJWT, setDecodedJWT] = useState<DecodedJWT | null>(null);
  const [editableHeader, setEditableHeader] = useState(
    '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'
  );
  const [editablePayload, setEditablePayload] = useState(
    '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const decodeJWT = async (token: string, secretKey: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        setDecodedJWT(null);
        return;
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      const headerJson = base64UrlDecode(headerB64);
      const payloadJson = base64UrlDecode(payloadB64);

      if (!headerJson || !payloadJson) {
        setDecodedJWT(null);
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

      setDecodedJWT({
        header,
        payload,
        signature: signatureB64,
        isValid: true,
        isSignatureValid,
      });
    } catch (error) {
      console.log(error);
      setDecodedJWT(null);
    }
  };

  const generateExampleJWT = async () => {};

  const handleEncodedJWTChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const target = event.target;
    const value = target.value;
    setEncodedJWT(value);
    try {
      decodeJWT(value, secret);
    } catch (error) {
      console.log(error);
      setDecodedJWT(null);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b bg-white'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>JWT</span>
              </div>
              <span className='font-semibold text-lg'>JWT</span>
              <span className='text-muted-foreground'>Debugger</span>
            </div>
            <nav className='flex gap-6'>
              <button className='text-sm font-medium text-primary'>
                Debugger
              </button>
              <button className='text-sm font-medium text-muted-foreground hover:text-foreground'>
                Introduction
              </button>
              <button className='text-sm font-medium text-muted-foreground hover:text-foreground'>
                Libraries
              </button>
              <button className='text-sm font-medium text-muted-foreground hover:text-foreground'>
                Ask
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold mb-4'>
            JSON Web Token (JWT) Debugger
          </h1>
          <div className='flex gap-4 justify-center mb-4'>
            <Alert className='max-w-md'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription className='text-sm'>
                Decode, verify, and generate JSON Web Tokens, which are an open,
                industry standard RFC 7519 method for representing claims
                securely between two parties.
              </AlertDescription>
            </Alert>
            <Alert className='max-w-md bg-yellow-50 border-yellow-200'>
              <AlertTriangle className='h-4 w-4 text-yellow-600' />
              <AlertDescription className='text-sm text-yellow-800'>
                For your protection, all JWT debugging and validation happens in
                the browser. Be careful where you paste or share JWTs as they
                can represent credentials that grant access to resources.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className='grid lg:grid-cols-2 gap-8'>
          {/* Left Column - Encoded JWT */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>ENCODED VALUE</h2>
              <Button onClick={generateExampleJWT} variant='outline' size='sm'>
                Generate example
              </Button>
            </div>

            <div className='relative'>
              <Textarea
                value={encodedJWT}
                onChange={handleEncodedJWTChange}
                placeholder='JSON WEB TOKEN (JWT)'
                className='min-h-[200px] font-mono text-sm'
              />
              <div className='absolute top-2 right-2 flex gap-2'>
                <Button
                  onClick={() => copyToClipboard(encodedJWT)}
                  variant='ghost'
                  size='sm'
                >
                  <Copy className='h-4 w-4' />
                  COPY
                </Button>
                <Button
                  onClick={() => setEncodedJWT('')}
                  variant='ghost'
                  size='sm'
                >
                  CLEAR
                </Button>
              </div>
            </div>

            {decodedJWT && (
              <div className='flex gap-2'>
                <Badge
                  variant={decodedJWT.isValid ? 'default' : 'destructive'}
                  className='bg-green-100 text-green-800'
                >
                  {decodedJWT.isValid ? (
                    <>
                      <CheckCircle className='h-3 w-3 mr-1' />
                      Valid JWT
                    </>
                  ) : (
                    <>
                      <XCircle className='h-3 w-3 mr-1' />
                      Invalid JWT
                    </>
                  )}
                </Badge>
                <Badge
                  variant={
                    decodedJWT.isSignatureValid ? 'default' : 'secondary'
                  }
                  className='bg-blue-100 text-blue-800'
                >
                  {decodedJWT.isSignatureValid
                    ? 'Signature Verified'
                    : 'Signature Not Verified'}
                </Badge>
              </div>
            )}
          </div>

          {/* Right Column - Editable JWT Components */}
          <div className='space-y-6'>
            {/* Header */}
            <Card>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-medium'>HEADER</CardTitle>
                  <div className='flex gap-2'>
                    <Button
                      onClick={() => copyToClipboard(editableHeader)}
                      variant='ghost'
                      size='sm'
                    >
                      <Copy className='h-4 w-4' />
                      COPY
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editableHeader}
                  onChange={(e) => setEditableHeader(e.target.value)}
                  className='min-h-[120px] font-mono text-sm bg-red-50'
                  placeholder='Enter JWT header JSON'
                />
              </CardContent>
            </Card>

            {/* Payload */}
            <Card>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-medium'>PAYLOAD</CardTitle>
                  <div className='flex gap-2'>
                    <Button
                      onClick={() => copyToClipboard(editablePayload)}
                      variant='ghost'
                      size='sm'
                    >
                      <Copy className='h-4 w-4' />
                      COPY
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editablePayload}
                  onChange={(e) => setEditablePayload(e.target.value)}
                  className='min-h-[150px] font-mono text-sm bg-purple-50'
                  placeholder='Enter JWT payload JSON'
                />
              </CardContent>
            </Card>

            {/* Signature Verification */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium'>
                  VERIFY SIGNATURE
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Enter the secret used to sign the JWT:
                </p>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='relative'>
                    <Input
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder='your-256-bit-secret'
                      className='font-mono'
                    />
                    <div className='absolute top-2 right-2 flex gap-2'>
                      <Button
                        onClick={() => copyToClipboard(secret)}
                        variant='ghost'
                        size='sm'
                      >
                        <Copy className='h-4 w-4' />
                        COPY
                      </Button>
                      <Button
                        onClick={() => setSecret('')}
                        variant='ghost'
                        size='sm'
                      >
                        CLEAR
                      </Button>
                    </div>
                  </div>
                  {secret && (
                    <div className='bg-green-50 p-3 rounded border'>
                      <p className='text-sm text-green-800 font-mono'>
                        {decodedJWT?.isSignatureValid
                          ? 'Valid secret'
                          : 'Invalid secret or signature'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
