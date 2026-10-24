import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'data';

  const filename =
    type === 'tools' ? 'starfront-r3-ci-tools.zip' : 'starfront-r3-asset-data.zip';

  const candidates = [
    path.join(process.cwd(), 'public', filename),
    path.join(process.cwd(), filename),
    path.join('/app/applet/public', filename),
  ];

  const filePath = candidates.find((p) => fs.existsSync(p));

  if (!filePath) {
    return NextResponse.json(
      { error: `File not found: ${filename}` },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
