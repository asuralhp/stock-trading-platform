import { NextRequest, NextResponse } from 'next/server';

const POSTER_API_URL = process.env.NEXT_PUBLIC_POSTER_API_URL || 'http://localhost:3010';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${POSTER_API_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to poster API:', error);
    return NextResponse.json(
      { error: 'Failed to generate poster', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
