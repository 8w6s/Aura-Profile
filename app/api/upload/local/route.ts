import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('fileToUpload') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Sanitize filename to prevent directory traversal and weird characters
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
    
    // Ensure public/assets directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'assets');
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Ignore error if directory exists
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const publicUrl = `/assets/${uniqueFilename}`;

    return new NextResponse(publicUrl, { status: 200 });

  } catch (error) {
    console.error('Local upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
