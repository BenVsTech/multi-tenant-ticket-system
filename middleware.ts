// Imports

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generalLimiter, strictLimiter } from '@/lib/core/rateLimit';

// Constants

const maxBodySize = 1024 * 1024;
const rateLimitMaxRequests = 100;
const rateLimitStrictMax = 20;

const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
};

// Functions

function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+)([a-z]+)$/);
  if (!match) return maxBodySize;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return value * (units[unit] || 1);
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

async function checkRateLimit(
  ip: string, 
  path: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const isStrictEndpoint = path.startsWith('/api/') || 
                           path.startsWith('/login') || 
                           path.startsWith('/auth');
  
  const maxRequests = isStrictEndpoint ? rateLimitStrictMax : rateLimitMaxRequests;
  const limiter = isStrictEndpoint ? strictLimiter : generalLimiter;

  const token = `${ip}:${path}`;
  
  const result = await limiter.check(maxRequests, token);
  
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  const url = request.nextUrl;
  const method = request.method;
  
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zmap/i,
    /^$/,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return { valid: false, error: 'Invalid request' };
  }
  
  const path = url.pathname;
  if (path.includes('..') || path.includes('//') || path.includes('\\')) {
    return { valid: false, error: 'Invalid path' };
  }
  
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > maxBodySize) {
        return { 
          valid: false, 
          error: `Request body too large. Maximum size is ${maxBodySize / 1024}KB` 
        };
      }
    }
  }
  
  return { valid: true };
}

// Exports

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;
  
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/static/') ||
    path.match(/\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  const validation = validateRequest(request);
  if (!validation.valid) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Bad Request',
        message: validation.error || 'Invalid request'
      }),
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders,
        },
      }
    );
  }
  
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(clientIP, path);
  
  if (!rateLimit.allowed) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000)
      }),
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': path.startsWith('/api/') ? String(rateLimitStrictMax) : String(rateLimitMaxRequests),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.reset / 1000)),
          'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          ...securityHeaders,
        },
      }
    );
  }
  
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  response.headers.set('X-RateLimit-Limit', path.startsWith('/api/') ? String(rateLimitStrictMax) : String(rateLimitMaxRequests));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.reset / 1000)));
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};

