import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseClient } from '@/utils/supabase';

const isDev = process.env.NODE_ENV !== 'production';

type ProfilePost = {
  id: string;
  likes?: number;
  likedIps?: string[];
};

type ProfileData = {
  posts?: ProfilePost[];
};

const reportServerError = (...args: unknown[]) => {
  if (isDev) {
    console.error(...args);
  }
};

export async function POST(request: Request) {
  try {
    const { postId } = await request.json();
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    const supabase = getSupabaseClient();
    const { data: dbData, error } = await supabase
      .from('profile_data')
      .select('content')
      .eq('id', 'main')
      .maybeSingle();

    if (error || !dbData || !dbData.content) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    const data = dbData.content as ProfileData;

    if (!data.posts) {
      return NextResponse.json({ error: 'No posts found' }, { status: 404 });
    }

    const postIndex = data.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = data.posts[postIndex];

    if (!post.likedIps) {
      post.likedIps = [];
    }

    if (post.likedIps.includes(ip)) {
      post.likedIps = post.likedIps.filter((i: string) => i !== ip);
      post.likes = Math.max(0, (post.likes || 0) - 1);

      data.posts[postIndex] = post;
      const { error: upsertError } = await supabase.from('profile_data').upsert({ id: 'main', content: data }, { onConflict: 'id' });
      if (upsertError) return NextResponse.json({ error: 'Database error: ' + upsertError.message }, { status: 500 });
      return NextResponse.json({ success: true, likes: post.likes, liked: false });
    }

    post.likedIps.push(ip);
    post.likes = (post.likes || 0) + 1;
    data.posts[postIndex] = post;

    const { error: upsertError } = await supabase.from('profile_data').upsert({ id: 'main', content: data }, { onConflict: 'id' });
    if (upsertError) return NextResponse.json({ error: 'Database error: ' + upsertError.message }, { status: 500 });

    return NextResponse.json({ success: true, likes: post.likes, liked: true });

  } catch (error) {
    reportServerError('Like error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
