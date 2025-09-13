import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Type definitions for form input matching Go backend expectations
interface QuestionInput {
  question_text: string;
}

interface MultipleChoiceQuestionInput {
  question_text: string;
  choices: string[];
}

interface FormInput {
  title: string;
  description: string;
  questions: QuestionInput[];
  choice_questions: MultipleChoiceQuestionInput[];
}

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Prepare form data for Go backend
    const formData: FormInput = {
      title: body.title,
      description: body.description || '',
      questions: body.questions || [],
      choice_questions: body.choiceQuestions || []
    };

    // Call Go backend to create form
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('Creating form with API URL:', apiUrl);
    const response = await fetch(`${apiUrl}/api/forms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // Handle response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create form' }));
      console.error('Create form failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to create form' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Create form error:', error);
    if (error.cause) {
      console.error('Error cause:', error.cause);
      console.error('Socket details:', error.cause.socket);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}