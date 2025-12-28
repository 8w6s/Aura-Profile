import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'profile.json');

export async function GET() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return NextResponse.json(data);
    }
    return NextResponse.json({}, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newData = await request.json();

    let existingData: any = {};
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    }

    if (existingData.stats) {
      newData.stats = existingData.stats;
    }

    if (newData.posts && existingData.posts) {
      newData.posts = newData.posts.map((newPost: any) => {
        const existingPost = existingData.posts.find((p: any) => p.id === newPost.id);
        if (existingPost) {
          return {
            ...newPost,
            views: existingPost.views,
            viewedIps: existingPost.viewedIps
          };
        }
        return {
          ...newPost,
          views: 0,
          viewedIps: []
        };
      });
    }

    if (newData.files && existingData.files) {
      newData.files = newData.files.map((newFile: any) => {
        const existingFile = existingData.files.find((f: any) => f.id === newFile.id);
        if (existingFile) {
          return {
            ...newFile,
            downloadCount: existingFile.downloadCount
          };
        }
        return {
          ...newFile,
          downloadCount: 0
        };
      });
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
    return NextResponse.json({ success: true, data: newData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save profile data' }, { status: 500 });
  }
}
