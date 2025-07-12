'use server';
import {connect_collection} from '@/app/lib/dbconnect';
import { auth } from '@/auth';
import omit from 'lodash/omit';
import { MODEL_User, MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_USER } from '@/GLOVAR';

import { EventEmitter } from 'events';

const userEventEmitter = new EventEmitter();



userEventEmitter.on('userFetch', (data) => {
    console.log('User created event Fetched:', data);
    // Perform any actions needed, such as sending a notification or logging
});






export async function getUser(): Promise<MODEL_User | null> {

    const collection_user = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_USER);
    const session = await auth();
    const userUid = await session?.user?.userUid;
    
    let user = await collection_user.findOne({ userUid: userUid });
    user = user ? omit(user, ['_id']) : null;
    userEventEmitter.emit('userFetch', { userUid, userName: user ? user.name : null });
    return { user, userUid };
    // return user_obj
}

// export async function createUser(userName): Promise<any> {
//     const collection_user = await connect_user_collection();
//     const { user, userUid } = await getUser();
//     let result = null;
//     if (user) {
//         console.log(`User ${user.userUid} already exists`);
//     } else {
//         const newUser = { userUid: userName , name: 'New User', email: "newUser@next.com" }
//         console.log('Creating new user', newUser);
//         result = await collection_user.insertOne(newUser);
//         // Convert insertedId to string for client compatibility
//         if (result && result.insertedId) {
//             result = { ...result, insertedId: result.insertedId.toString() };
//         }
//     }
    
//     return result;
// }

// export async function updateUser(userId: string, user: Partial<User>): Promise<void> {
//     const collection = await connect();
//     await collection.updateOne({ userId: new ObjectId(userId) }, { $set: user });
// }