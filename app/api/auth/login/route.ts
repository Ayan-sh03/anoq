import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the Go backend with credentials
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include', // Include cookies from Go backend
    });

    // Get the response data
    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      console.error('Login failed:', data);
      return NextResponse.json(
        { error: data.error || 'Login failed' },
        { status: response.status }
      );
    }

    // Create response with cookies from Go backend
    const nextResponse = NextResponse.json(data, { status: 200 });

    // Forward cookies from Go backend to the client
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      // Parse and set cookies in the response
      const cookies = setCookieHeaders.split(',');
      cookies.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie.trim());
      });
    }

    console.log('Login successful:', { userId: data.user?.id, email: data.user?.email });
    return nextResponse;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}