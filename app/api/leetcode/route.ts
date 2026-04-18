import { NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV !== 'production';

const reportServerError = (...args: unknown[]) => {
  if (isDev) {
    console.error(...args);
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return NextResponse.json({ error: 'Valid username required' }, { status: 400 });
  }

  if (username.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch LeetCode data' }, { status: response.status || 502 });
    }

    const data = await response.json();

    if (data.status === 'error') {
      return NextResponse.json({ error: data.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    reportServerError('LeetCode API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
