import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Type definitions for AI form generation input
interface AIFormInput {
  productHuntLink?: string;
  description?: string;
  author?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: AIFormInput = await request.json();

    // Validate required fields - either productHuntLink or description must be provided
    if (!body.productHuntLink && !body.description) {
      return NextResponse.json(
        { error: 'Either Product Hunt link or Description is required' },
        { status: 400 }
      );
    }

    // Call Go backend AI endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/ai`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate AI form' }));
      console.error('AI form generation failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate AI form' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('AI form generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}