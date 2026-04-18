import { NextRequest, NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV !== 'production';

const reportServerError = (...args: unknown[]) => {
  if (isDev) {
    console.error(...args);
  }
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('fileToUpload') as File;
    const userHash = formData.get('userhash') as string;

    if (!file || !userHash) {
      return NextResponse.json({ error: 'Missing file or userhash' }, { status: 400 });
    }

    // Re-construct FormData for the external request
    const backendFormData = new FormData();
    backendFormData.append('reqtype', 'fileupload');
    backendFormData.append('userhash', userHash);
    backendFormData.append('fileToUpload', file);

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Catbox API Error: ${errorText}` }, { status: response.status });
    }

    const url = await response.text();
    return new NextResponse(url, { status: 200 });

  } catch (error) {
    reportServerError('Upload proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
