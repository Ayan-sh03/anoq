import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the Go backend with credentials
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_API_URL is not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    const cookie = request.headers.get('cookie') ?? '';
    const authorization = request.headers.get('authorization') ?? '';
    const url = new URL('/api/auth/me', baseUrl).toString();

    // Forward auth context explicitly; disable caching for auth
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(authorization ? { authorization } : {}),
        accept: 'application/json',
      },
      cache: 'no-store',
    });
    // Get the response data
    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      console.error('Get current user failed:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to get current user' },
        { status: response.status }
      );
    }

    // Return the successful response
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}