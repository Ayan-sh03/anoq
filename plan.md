# Next.js API Routes Migration Plan - Go Backend

## Current Situation
- Frontend pages are calling EdgeDB-based API routes
- Go backend is ready but frontend needs to connect properly
- Need to convert existing API routes to TypeScript and make them proxy to Go backend

## API Routes to Convert

### 1. Dashboard Route
**File**: `app/api/dashboard/route.js` → `app/api/dashboard/route.ts`
**Frontend**: `app/dashboard/page.tsx` line 30
**Go Backend**: Need to create `GET /api/forms` or not if already implemented to get user forms (current )

**Changes needed**:
```typescript
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get auth from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call Go backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/forms`, {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}
```

### 2. Form Creation Route
**File**: `app/api/form/route.js` → `app/api/form/route.ts`
**Frontend**: `app/create/page.tsx` line 128
**Go Backend**: `POST /api/forms`

**Changes needed**:
```typescript
// app/api/form/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    // Call Go backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken?.value}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
```

### 3. Form Display Route
**File**: `app/api/form/[id]/route.js` → `app/api/form/[id]/route.ts`
**Frontend**: `app/[slug]/page.tsx` line 8
**Go Backend**: `GET /api/forms/:slug`

**Changes needed**:
```typescript
// app/api/form/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slug = params.id;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${slug}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }
}
```

### 4. Form Submission Route
**File**: `app/api/response/route.js` → `app/api/forms/[slug]/submit/route.ts`
**Frontend**: FormComponent (need to find exact location)
**Go Backend**: `POST /api/forms/:slug/submit`

**Changes needed**:
```typescript
// app/api/forms/[slug]/submit/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const slug = params.slug;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${slug}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
```

### 5. Form Submissions Route
**File**: `app/api/form/submissions/[slug]/route.js` → `app/api/form/submissions/[slug]/route.ts`
**Frontend**: `app/form/[slug]/page.tsx` line 18
**Go Backend**: `GET /api/forms/:slug/submissions`

**Changes needed**:
```typescript
// app/api/form/submissions/[slug]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${slug}/submissions`, {
      headers: {
        'Authorization': `Bearer ${accessToken?.value}`
      }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
```

### 6. AI Form Generation Route
**File**: `app/api/form/ai/route.js` → `app/api/form/ai/route.ts`
**Frontend**: `app/create/ai/page.tsx` line 53
**Go Backend**: Need to create `POST /api/forms/ai`

**Changes needed**:
```typescript
// app/api/form/ai/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    // Call Go backend AI endpoint (when available)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken?.value}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate AI form' }, { status: 500 });
  }
}
```

### 7. Form Status Routes
**Files**:
- `app/api/form/open/[slug]/route.js` → `app/api/form/open/[slug]/route.ts`
- `app/api/form/close/[slug]/route.js` → `app/api/form/close/[slug]/route.ts`

**Go Backend**: `PATCH /api/forms/:slug/open` and `PATCH /api/forms/:slug/close`

**Changes needed**:
```typescript
// app/api/form/open/[slug]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${slug}/open`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken?.value}`
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to open form' }, { status: 500 });
  }
}
```

### 8. Submission Check Route
**File**: `app/api/submitted/[id]/route.js` → `app/api/submitted/[id]/route.ts`
**Frontend**: `app/[slug]/page.tsx` line 19
**Go Backend**: Need to create `GET /api/forms/:slug/submitted`

**Changes needed**:
```typescript
// app/api/submitted/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id;
    const userIp = request.headers.get("x-real-ip") ||
                   request.headers.get("x-forwarded-for") ||
                   "unknown";

    // Call Go backend (when available)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}/submitted?userIp=${userIp}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: "Not Submitted" }, { status: 200 });
  }
}
```

## Implementation Steps

1. **Start with dashboard** - Most critical for user experience
2. **Convert routes one by one** - Test each before moving to next
3. **Update frontend calls** - Point to new TypeScript routes
4. **Add missing Go backend endpoints** - Dashboard, AI generation, submission check
5. **Test authentication** - Make sure cookies/JWT flow works
6. **Clean up old files** - Remove .js routes after conversion

## Notes
- Keep the same route structure, just convert to TypeScript
- Add proper error handling and TypeScript types
- Make sure to handle authentication cookies properly
- Test each route individually before moving to the next
- Some Go backend endpoints might need to be created first