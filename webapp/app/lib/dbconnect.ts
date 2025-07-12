
import { MongoClient } from 'mongodb';


const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export async function connect_collection(dbName: string, collectionName: string) {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    return collection;
}
