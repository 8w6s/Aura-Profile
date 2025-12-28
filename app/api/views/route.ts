import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';

const dataFilePath = path.join(process.cwd(), 'data', 'profile.json');

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    let postId: string | undefined;
    try {
      const body = await request.json();
      postId = body.postId;
    } catch (e) {
    }

    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: 'Profile data not found' }, { status: 404 });
    }

    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);

    if (postId) {
      const postIndex = data.posts?.findIndex((p: any) => p.id === postId);
      if (postIndex !== -1) {
        const post = data.posts[postIndex];
        if (!post.viewedIps) post.viewedIps = [];

        if (!post.viewedIps.includes(ip)) {
          post.views = (post.views || 0) + 1;
          post.viewedIps.push(ip);
          data.posts[postIndex] = post;
          fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
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

        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        return NextResponse.json({ success: true, views: data.stats.views });
      } else {
        return NextResponse.json({ success: false, error: 'Already viewed' });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to increment views:', error);
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
  }
}
