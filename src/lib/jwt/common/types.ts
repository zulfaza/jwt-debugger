export type Algorithm = 'HS256' | 'RS256';

export interface JwtHeader {
  alg: Algorithm;
  typ: 'JWT';
  kid?: string;
}
