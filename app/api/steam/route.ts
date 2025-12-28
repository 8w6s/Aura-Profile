import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const steamId = searchParams.get('steamId');
  const apiKey = searchParams.get('apiKey');

  if (!steamId || !apiKey) {
    return NextResponse.json({ error: 'Steam ID and API Key required' }, { status: 400 });
  }

  try {
    const response = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch Steam data');
    }

    const data = await response.json();
    const player = data.response?.players?.[0];

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    let recentGames = [];
    try {
      const recentRes = await fetch(`http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json`);
      if (recentRes.ok) {
        const recentData = await recentRes.json();
        recentGames = recentData.response?.games || [];
      }
    } catch (e) {
    }

    return NextResponse.json({
      personaname: player.personaname,
      profileurl: player.profileurl,
      avatarfull: player.avatarfull,
      personastate: player.personastate,
      gameextrainfo: player.gameextrainfo,
      recentGames: recentGames.slice(0, 3)
    });

  } catch (error) {
    console.error('Steam API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
