"use server";

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connect_collection } from '@/app/lib/dbconnect';
import omit from 'lodash/omit';
import { MONGODB_DATABASE_ACCOUNT_DATA } from '@/GLOVAR';

export async function GET() {
  const session = await auth();

  if (!session?.user?.userUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, 'watchlist');
  const userUid = session.user.userUid;
  const doc = await collection.findOne({ userUid });

  if (!doc) {
    return NextResponse.json({ watchlist: [] });
  }

  const sanitized = omit(doc, ['_id']);
  return NextResponse.json({ watchlist: sanitized.watchlist ?? [] });
}
