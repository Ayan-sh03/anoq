import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    // Call Go backend to get form by slug
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching for form data
    });

    // Handle response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Form not found' }));
      console.error('Get form failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Form not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}