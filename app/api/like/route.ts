import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';

const dataFilePath = path.join(process.cwd(), 'data', 'profile.json');

export async function POST(request: Request) {
  try {
    const { postId } = await request.json();
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);

    if (!data.posts) {
      return NextResponse.json({ error: 'No posts found' }, { status: 404 });
    }

    const postIndex = data.posts.findIndex((p: any) => p.id === postId);
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
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
      return NextResponse.json({ success: true, likes: post.likes, liked: false });
    }

    post.likedIps.push(ip);
    post.likes = (post.likes || 0) + 1;

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, likes: post.likes, liked: true });

  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
