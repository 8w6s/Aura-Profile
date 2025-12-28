import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  const game = searchParams.get('game');

  if (!uid || !game) {
    return NextResponse.json({ error: 'UID and Game are required' }, { status: 400 });
  }

  if (game !== 'genshin' && game !== 'hsr') {
      return NextResponse.json({ error: 'Game not supported for auto-fetch' }, { status: 400 });
  }

  if (game === 'hsr') {
      try {
          const mihomoResponse = await fetch(`https://api.mihomo.me/sr_info/${uid}`, {
              headers: { 'User-Agent': '8w6s-Profile/1.0' },
              next: { revalidate: 3600 }
          });

          if (mihomoResponse.ok) {
              const data = await mihomoResponse.json();
              if (data.detail) throw new Error(data.detail);

              const player = data.player;
              
              return NextResponse.json({
                  uid,
                  game,
                  nickname: player.nickname,
                  level: player.level,
                  signature: player.signature,
                  worldLevel: player.world_level,
                  achievements: player.achievement_count,
                  avatarUrl: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${player.avatar.id}.png`,
                  playerInfo: player,
                  characters: data.characters
              });
          }
      } catch (e) {
          console.log('Mihomo API failed, falling back to Enka:', e);
      }
  }

  const baseUrl = game === 'genshin' ? 'https://enka.network/api/uid' : 'https://enka.network/api/hsr/uid';

  try {
    const response = await fetch(`${baseUrl}/${uid}`, {
        headers: {
            'User-Agent': '8w6s-Profile/1.0'
        },
        next: { revalidate: 3600 }
    });

    if (!response.ok) {
        if (response.status === 404) return NextResponse.json({ error: 'Player not found or hidden' }, { status: 404 });
        if (response.status === 429) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
        throw new Error('Failed to fetch data from Enka.Network');
    }

    const data = await response.json();
    
    let player: any = null;
    let achievements = 0;
    let avatarUrl = '';
    let nickname = '';
    let signature = '';
    let level = 0;
    let worldLevel = 0;
    let characters: any[] = [];

    if (game === 'genshin') {
        player = data.playerInfo;
        if (!player) throw new Error('Invalid Genshin data');
        
        nickname = player.nickname;
        signature = player.signature;
        level = player.level;
        worldLevel = player.worldLevel;
        achievements = player.finishAchievementNum || 0;
        characters = data.avatarInfoList || [];
        
        if (player.profilePicture?.assets?.icon) {
            avatarUrl = `https://enka.network/ui/${player.profilePicture.assets.icon}.png`;
        } else if (player.profilePicture?.avatarId) {
            avatarUrl = `https://enka.network/ui/UI_AvatarIcon_Side_${player.profilePicture.avatarId}.png`;
        }
    } else if (game === 'hsr') {
        player = data.detailInfo;
        if (!player) throw new Error('Invalid HSR data');

        nickname = player.nickname;
        signature = player.signature || '';
        level = player.level;
        worldLevel = player.worldLevel;
        achievements = player.recordInfo?.achievementCount || 0;
        characters = player.avatarDetailList || [];

        if (player.headIcon) {
            const headIconStr = String(player.headIcon);
            let charId = headIconStr;
            
            if (headIconStr.startsWith('20') && headIconStr.length === 6) {
                 charId = headIconStr.substring(2);
            }
            
            avatarUrl = `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${charId}.png`;
        }
    }

    const result = {
        uid,
        game,
        nickname,
        level,
        signature,
        worldLevel,
        achievements,
        avatarUrl,
        playerInfo: player,
        characters
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Hoyoverse API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
