import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/utils/supabase';

type StoredFile = {
  id: string;
  name: string;
  url: string;
  downloadCount?: number;
};

type ProfileStore = {
  files?: StoredFile[];
};

const toAbsoluteFileUrl = (requestUrl: string, fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  const { origin } = new URL(requestUrl);
  return new URL(fileUrl, origin).toString();
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    const { data: dbData, error } = await supabase
      .from('profile_data')
      .select('content')
      .eq('id', 'main')
      .maybeSingle();

    if (error || !dbData || !dbData.content) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    const data = dbData.content as ProfileStore;

    const file = data.files?.find((f) => f.id === fileId);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    file.downloadCount = (file.downloadCount || 0) + 1;

    if (!data.files) {
      return NextResponse.json({ error: 'No files found' }, { status: 404 });
    }

    const fileIndex = data.files.findIndex((f) => f.id === fileId);
    data.files[fileIndex] = file;
    
    const { error: upsertError } = await supabase.from('profile_data').upsert({ id: 'main', content: data }, { onConflict: 'id' });
    if (upsertError) console.error('Download module upsert error:', upsertError.message);

    try {
      const targetUrl = toAbsoluteFileUrl(request.url, file.url);
      const fileResponse = await fetch(targetUrl);
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
