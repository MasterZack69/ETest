import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// Secret stored in environment variable
const secret = new TextEncoder().encode(
  process.env.API_SECRET_KEY || 'fallback-secret-key'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only protect the /etest.json endpoint
  if (pathname === '/etest.json') {
    // Check for API key in header
    const apiKey = request.headers.get('x-api-key');
    
    // Check for valid authentication
    if (!apiKey || apiKey !== process.env.API_KEY) {
      // Check if it's a browser request
      const userAgent = request.headers.get('user-agent') || '';
      const acceptHeader = request.headers.get('accept') || '';
      
      if (
        userAgent.includes('Mozilla') || 
        userAgent.includes('Chrome') ||
        userAgent.includes('Safari') ||
        acceptHeader.includes('text/html')
      ) {
        // Redirect browser users
        return NextResponse.redirect(new URL('/fuckyou.json', request.url));
      }
      
      // Return 401 for unauthorized API requests
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/etest.json'
};

