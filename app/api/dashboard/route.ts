import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call Go backend to get user forms
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/forms`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching for user-specific data
    });

    console.log('Get user forms response status:', response.status);

    // Handle response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch forms' }));
      console.error('Get user forms failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch forms' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Fetched forms data:", data);
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Get user forms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}