import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'profile.json');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);

    const file = data.files?.find((f: any) => f.id === fileId);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    file.downloadCount = (file.downloadCount || 0) + 1;

    const fileIndex = data.files.findIndex((f: any) => f.id === fileId);
    data.files[fileIndex] = file;
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    try {
      const fileResponse = await fetch(file.url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }

      const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = `attachment; filename="${encodeURIComponent(file.name)}"`;

      return new NextResponse(fileResponse.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition,
        },
      });
    } catch (proxyError) {
      console.error('Proxy error:', proxyError);
      return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 502 });
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
