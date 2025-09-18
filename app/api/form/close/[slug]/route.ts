import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('Closing form with API URL:', apiUrl);
    const response = await fetch(`${apiUrl}/api/forms/${slug}/close`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to close form' }));
      console.error('Close form failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to close form' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error('Close form error:', error);
    if (error.cause) {
      console.error('Error cause:', error.cause);
      console.error('Socket details:', error.cause.socket);
    }
    return NextResponse.json(
      { error: 'Failed to close form' },
      { status: 500 }
    );
  }
}