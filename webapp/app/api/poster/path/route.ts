import { NextRequest, NextResponse } from 'next/server';
import { connect_collection } from '@/app/lib/dbconnect';
import { MONGODB_DATABASE_GLOBAL_DATA, MONGODB_COLLECTION_GLOVAR } from '@/GLOVAR';

export async function GET() {
  try {
    const collection = await connect_collection(MONGODB_DATABASE_GLOBAL_DATA, MONGODB_COLLECTION_GLOVAR);
    const doc = await collection.findOne({});
    
    return NextResponse.json({ path: doc?.poster_path || '' });
  } catch (error) {
    console.error('Error fetching poster path:', error);
    return NextResponse.json({ error: 'Failed to fetch poster path' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    const collection = await connect_collection(MONGODB_DATABASE_GLOBAL_DATA, MONGODB_COLLECTION_GLOVAR);
    
    // Update first document or insert if none exists
    await collection.updateOne(
      {},
      { $set: { poster_path: path } },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error('Error setting poster path:', error);
    return NextResponse.json(
      { error: 'Failed to set poster path' },
      { status: 500 }
    );
  }
}
