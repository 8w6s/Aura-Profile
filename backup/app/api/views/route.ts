import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseClient } from '@/utils/supabase';

const isDev = process.env.NODE_ENV !== 'production';

type ProfilePost = {
  id: string;
  views?: number;
  viewedIps?: string[];
};

type ProfileData = {
  posts?: ProfilePost[];
  stats?: {
    views?: number;
    viewedIps?: string[];
  };
};

const reportServerError = (...args: unknown[]) => {
  if (isDev) {
    console.error(...args);
  }
};

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    let postId: string | undefined;
    try {
      const body = await request.json();
      postId = body.postId;
    } catch {
    }

    const supabase = getSupabaseClient();
    const { data: dbData, error } = await supabase
      .from('profile_data')
      .select('content')
      .eq('id', 'main')
      .maybeSingle();

    if (error || !dbData || !dbData.content) {
      return NextResponse.json({ error: 'Profile data not found' }, { status: 404 });
    }

    const data = dbData.content as ProfileData;

    if (postId) {
      const postIndex = data.posts?.findIndex((p) => p.id === postId);
      if (typeof postIndex === 'number' && postIndex !== -1 && data.posts) {
        const post = data.posts[postIndex];
        if (!post.viewedIps) post.viewedIps = [];

        if (!post.viewedIps.includes(ip)) {
          post.views = (post.views || 0) + 1;
          post.viewedIps.push(ip);
          data.posts[postIndex] = post;
          const { error: upsertError } = await supabase.from('profile_data').upsert({ id: 'main', content: data }, { onConflict: 'id' });
          if (upsertError) console.error('Views Module - Database error:', upsertError.message);
          return NextResponse.json({ success: true, views: post.views });
        } else {
          return NextResponse.json({ success: false, error: 'Already viewed' });
        }
      }
    } else {
      if (!data.stats) {
        data.stats = { views: 0, viewedIps: [] };
      }
      if (!data.stats.viewedIps) {
        data.stats.viewedIps = [];
      }

      if (!data.stats.viewedIps.includes(ip)) {
        data.stats.views = (data.stats.views || 0) + 1;
        data.stats.viewedIps.push(ip);

        const { error: upsertError } = await supabase.from('profile_data').upsert({ id: 'main', content: data }, { onConflict: 'id' });
        if (upsertError) console.error('Views Module - Database error:', upsertError.message);
        return NextResponse.json({ success: true, views: data.stats.views });
      } else {
        return NextResponse.json({ success: false, error: 'Already viewed' });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportServerError('Failed to increment views:', error);
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
  }
}
