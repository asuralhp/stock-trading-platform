import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imagePath = searchParams.get('path');

    console.log('Image request for path:', imagePath);

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Image path is required' },
        { status: 400 }
      );
    }

    // Security: Validate the path is within expected directories
    const allowedPaths = ['stplatform', 'sdapp', 'output'];
    const hasAllowedPath = allowedPaths.some(p => imagePath.toLowerCase().includes(p.toLowerCase()));
    
    if (!hasAllowedPath) {
      console.log('Path rejected by security check:', imagePath);
      return NextResponse.json(
        { error: 'Invalid image path' },
        { status: 403 }
      );
    }

    if (!existsSync(imagePath)) {
      console.log('File does not exist:', imagePath);
      return NextResponse.json(
        { error: 'Image not found', path: imagePath },
        { status: 404 }
      );
    }

    const imageBuffer = await readFile(imagePath);
    
    // Determine content type based on file extension
    const contentType = imagePath.endsWith('.png') ? 'image/png' : 
                       imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg') ? 'image/jpeg' : 
                       'image/png';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to load image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
