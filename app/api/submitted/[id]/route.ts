import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id;

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Extract user IP from headers
    const userIp =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    // Call Go backend to check if user has submitted the form
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}/submitted?userIp=${userIp}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Disable caching for submission check
      }
    );

    // Handle response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to check submission status' }));
      console.error('Check submission failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to check submission status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Check submission error:', error);
    return NextResponse.json(
      { error: 'Failed to check submission status' },
      { status: 500 }
    );
  }
}