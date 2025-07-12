'use server';
import { NextResponse } from 'next/server';
import { connect_collection } from '@/app/lib/dbconnect';
import { auth } from "@/auth";
import {USER_STATUS, MODEL_User, MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_USER} from '@/GLOVAR';


export async function GET(req: Request) {
  const session = await auth();
  const collection_user = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_USER);
  const { user } = session || {};
  
  const userUid = user?.userUid;
  const userName = user?.name;
  const useravatar = user?.image;
  const userEmail = user?.email;
  const userFound = await collection_user.findOne({ userUid: userUid });
  console.log(session);
  console.log(" userUid is ",userUid);
  
  if(userFound === null) {
    console.log(`Creating new user ${userUid}`);

    await collection_user.insertOne(
      new MODEL_User(
        userUid,        
        userName,       
        userEmail,
        "test123456",   
        useravatar,
        null,           
        null,           
        null,           
        null,
        null,                      
        new Date(),     
        new Date(),
        USER_STATUS.ACTIVE,   
      )
    );
  }
  else {
    console.log(`User ${userUid} already exists`);
  }
      
  // Redirect to baseURL
  return NextResponse.redirect(new URL('/', req.url));
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

