import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${slug}/open`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to open form' }));
      console.error('Open form failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to open form' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Open form error:', error);
    return NextResponse.json(
      { error: 'Failed to open form' },
      { status: 500 }
    );
  }
}