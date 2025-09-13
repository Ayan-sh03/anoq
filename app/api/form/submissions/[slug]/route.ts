import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slug = params.slug;

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    // Call Go backend to get form submissions
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${slug}/submissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching for user-specific data
    });

    // Handle response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch submissions' }));
      console.error('Get form submissions failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch submissions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Get form submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}