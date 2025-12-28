import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);

    if (!response.ok) {
      throw new Error('Failed to fetch LeetCode data');
    }

    const data = await response.json();

    if (data.status === 'error') {
      return NextResponse.json({ error: data.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('LeetCode API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
