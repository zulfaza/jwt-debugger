import './App.css';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, XCircle } from 'lucide-react';
import { verifyJwtHS256 } from './lib/jwt/hs256/verify';
import { generateJwtHS256 } from './lib/jwt/hs256/generate';
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
  const [encodedJWT, setEncodedJWT] = useState(
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
  );
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [isValidJwt, setIsValidJwt] = useState(true);
  const [isSignatureValid, setIsSignatureValid] = useState(true);
  const [editableHeader, setEditableHeader] = useState({
    alg: 'HS256',
    typ: 'JWT',
  });
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
        setIsValidJwt(false);
        setIsSignatureValid(false);
        return;
      }

      const [headerB64, payloadB64] = parts;

      const headerJson = base64UrlDecode(headerB64);
      const payloadJson = base64UrlDecode(payloadB64);

      if (!headerJson || !payloadJson) {
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

    try {
      const payloadJson = JSON.parse(value);
      const encodedPayload = await generateJwtHS256(payloadJson, secret);
      setEncodedJWT(encodedPayload);
      setIsSignatureValid(true);
      setIsValidJwt(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSignatureChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const target = event.target;
    const value = target.value;
    setSecret(value);
    try {
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold mb-4'>
            JSON Web Token (JWT) Debugger
          </h1>
        </div>

        <div className='grid lg:grid-cols-2 gap-8'>
          {/* Left Column - Encoded JWT */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>ENCODED VALUE</h2>
              <div className='flex gap-2'>
                <Button
                  onClick={() => copyToClipboard(encodedJWT)}
                  variant='ghost'
                  size='sm'
                >
                  <Copy className='h-4 w-4' />
                  COPY
                </Button>
              </div>
            </div>

            <div className='relative'>
              <Textarea
                value={encodedJWT}
                onChange={handleEncodedJWTChange}
                placeholder='JSON WEB TOKEN (JWT)'
                className='min-h-[200px] font-mono text-sm'
              />
            </div>

            <div className='flex gap-2'>
              <Badge
                variant={isValidJwt ? 'default' : 'destructive'}
                className='bg-green-100 text-green-800'
              >
                {isValidJwt ? (
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
                variant={isSignatureValid ? 'default' : 'secondary'}
                className='bg-blue-100 text-blue-800'
              >
                {isSignatureValid
                  ? 'Signature Verified'
                  : 'Signature Not Verified'}
              </Badge>
            </div>
          </div>

          {/* Right Column - Editable JWT Components */}
          <div className='space-y-6'>
            {/* Header */}
            <Card className='gap-2'>
              <CardHeader className=''>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-medium'>HEADER</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(editableHeader, null, 2)}
                  className='min-h-[100px] font-mono text-sm bg-red-50'
                  placeholder='Enter JWT header JSON'
                  disabled
                />
              </CardContent>
            </Card>

            {/* Payload */}
            <Card className='gap-2'>
              <CardHeader className=''>
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
                  onChange={handlePayloadChange}
                  className='min-h-[150px] font-mono text-sm bg-purple-50'
                  placeholder='Enter JWT payload JSON'
                />
              </CardContent>
            </Card>

            {/* Signature Verification */}
            <Card className='gap-2'>
              <CardHeader className=''>
                <CardTitle className='text-sm text-left font-medium'>
                  VERIFY SIGNATURE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='relative'>
                    <Input
                      value={secret}
                      onChange={handleSignatureChange}
                      placeholder='your-256-bit-secret'
                      className='font-mono'
                      disabled={
                        !editableHeader ||
                        editableHeader.alg.toUpperCase() !== 'HS256'
                      } // right now we just support HS256
                    />
                  </div>
                  {secret && (
                    <div className='bg-green-50 p-3 rounded border'>
                      <p className='text-sm text-green-800 font-mono'>
                        {isSignatureValid
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
