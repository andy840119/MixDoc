import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function getWorkingDirectory(): string {
  // use the root folder of the project.
  // todo: should be able to let user select customized folder.
  return process.cwd();
}

export async function GET(req: NextRequest) {
  const baseDir = getWorkingDirectory();

  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    const fileName = searchParams.get('name');

    if (!fileName) {
      return NextResponse.json({ error: 'Missing file name' }, { status: 400 });
    }

    const fullPath = filePath
      ? path.join(baseDir, filePath, fileName)
      : path.join(baseDir, fileName);
    const fileData = await fs.readFile(fullPath);

    return new NextResponse(fileData, {
      status: 200,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  } catch (error) {
    return errorResponse(error, 'Failed to read file');
  }
}

export async function POST(req: NextRequest) {
  const baseDir = getWorkingDirectory();

  try {
    const { path: filePath, name: fileName, data } = await req.json();

    if (!fileName || !data) {
      return NextResponse.json({ error: 'Missing path, name, or data' }, { status: 400 });
    }

    const fullPath = filePath
      ? path.join(baseDir, filePath, fileName)
      : path.join(baseDir, fileName);
    await fs.writeFile(fullPath, Buffer.from(data, 'base64'));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to write file');
  }
}
