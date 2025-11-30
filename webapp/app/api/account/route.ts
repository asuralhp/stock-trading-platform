'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connect_collection } from '@/app/lib/dbconnect';
import omit from 'lodash/omit';
import {
  MONGODB_DATABASE_ACCOUNT_DATA,
  MONGODB_COLLECTION_ACCOUNT,
} from '@/GLOVAR';

export async function GET() {
  const session = await auth();

  if (!session?.user?.userUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  
  const collection = await connect_collection(
    MONGODB_DATABASE_ACCOUNT_DATA,
    MONGODB_COLLECTION_ACCOUNT
);

const userUid = session.user.userUid;
console.log(userUid);
  const accountDoc = await collection.findOne({ userUid });

  if (!accountDoc) {
    return NextResponse.json({ account: null }, { status: 200 });
  }

  const sanitized = omit(accountDoc, ['_id']);

  return NextResponse.json({ account: sanitized });
}
