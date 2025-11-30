'use server';
import { NextResponse } from 'next/server';
import { connect_collection } from '@/app/lib/dbconnect';
import { auth } from '@/auth';
import omit from 'lodash/omit';
import {
  USER_STATUS,
  MODEL_User,
  MONGODB_DATABASE_ACCOUNT_DATA,
  MONGODB_COLLECTION_USER,
} from '@/GLOVAR';

export async function GET() {
  const session = await auth();

  if (!session?.user?.userUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collection_user = await connect_collection(
    MONGODB_DATABASE_ACCOUNT_DATA,
    MONGODB_COLLECTION_USER
  );

  const { user } = session;
  const userUid = user.userUid;
  const userName = user.name ?? 'New User';
  const useravatar = user.image ?? null;
  const userEmail = user.email ?? '';

  let userFound = await collection_user.findOne({ userUid });

  if (!userFound) {
    console.log(`Creating new user ${userUid}`);
    const now = new Date().toISOString();
    const newUser = new MODEL_User(
      userUid,
      userName,
      userEmail,
      'test123456',
      useravatar,
      null,
      null,
      null,
      null,
      null,
      now,
      now,
      USER_STATUS.ACTIVE
    );
    await collection_user.insertOne(newUser);
    userFound = { ...newUser } as Record<string, any>;
  }

  const sanitized = omit(userFound, ['_id']);

  return NextResponse.json({ user: sanitized });
}



// export async function GET(req: Request) {
//   const session = await auth();
//   const client = await clientPromise;
//   console.log(JSON.stringify(session));
  
//   const db = client.db('hello'); // Replace with your database name

//   try {
//     const users = await db.collection('world').find({}).toArray(); // Replace 'world' with your collection name
//     return NextResponse.json(users); // Return the users as a JSON response
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     return NextResponse.json({ message: 'Error fetching users', error }, { status: 500 });
//   }
// }

