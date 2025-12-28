import { useState, useEffect } from 'react';

export interface LanyardData {
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  active_on_discord_mobile?: boolean;
  active_on_discord_web?: boolean;
  active_on_discord_desktop?: boolean;
  activities: Array<{
    name: string;
    state?: string;
    details?: string;
    assets?: {
      large_image?: string;
      small_image?: string;
    };
    emoji?: {
      name: string;
      id?: string;
      animated?: boolean;
    };
    timestamps?: {
      start?: number;
      end?: number;
    };
    application_id?: string;
    type: number;
    created_at: number;
  }>;
  discord_user: {
    username: string;
    discriminator: string;
    id: string;
    avatar: string;
    public_flags: number;
  };
  kv?: Record<string, string>;
  listening_to_spotify: boolean;
  spotify?: {
    track_id: string;
    timestamps: {
      start: number;
      end: number;
    };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
  };
  primary_guild?: {
    badge: string;
    identity_enabled: boolean;
    identity_guild_id: string;
    tag: string;
  };
}

interface LanyardMessage {
  op: number;
  d: any;
  t?: string;
}

export function useLanyard(discordId?: string) {
  const [data, setData] = useState<LanyardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!discordId) {
      setLoading(false);
      return;
    }

    let socket: WebSocket | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const connect = () => {
      socket = new WebSocket('wss://api.lanyard.rest/socket');

      socket.onopen = () => {
        console.log('Lanyard WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const message: LanyardMessage = JSON.parse(event.data);

          switch (message.op) {
            case 1:
              socket?.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: discordId }
              }));

              if (heartbeatInterval) clearInterval(heartbeatInterval);
              heartbeatInterval = setInterval(() => {
                socket?.send(JSON.stringify({ op: 3 }));
              }, message.d.heartbeat_interval);
              break;

            case 0:
              if (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE') {
                setData(message.d);
                setLoading(false);
                setError(null);
              }
              break;
          }
        } catch (err) {
          console.error('Error parsing Lanyard message:', err);
        }
      };

      socket.onclose = () => {
        console.log('Lanyard WebSocket closed');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error('Lanyard WebSocket error:', err);
        setError('Connection failed');
        setLoading(false);
      };
    };

    const fetchInitial = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setError(null);
        }
      } catch (err) {
        console.error('Initial Lanyard fetch failed:', err);
      }
    };

    fetchInitial();
    connect();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (socket) socket.close();
    };
  }, [discordId]);

  return { data, loading, error };
}
