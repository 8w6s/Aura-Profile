import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://wakatime.com/api/v1/users/${username}/stats/last_7_days`);

    if (!response.ok) {
      throw new Error('Failed to fetch WakaTime data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('WakaTime API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
