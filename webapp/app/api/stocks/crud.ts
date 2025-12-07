'use server';
import { connect_collection } from '@/app/lib/dbconnect';
import { WatchList } from '@/app/models/WatchList';
import { MONGODB_DATABASE_ACCOUNT_DATA } from '@/GLOVAR';

// Add symbol to a user's watchlist by watch name
export async function addToWatchList(userUid: string, watchName: string, symbol: string) {
    const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, "watchlist");
    await collection.updateOne(
        { userUid, "watchlist.name": watchName },
        { $addToSet: { "watchlist.$.stocks": { symbol } } },
        { upsert: true }
    );
    return { success: true };
}

// Remove symbol from a user's watchlist by watch name
export async function removeFromWatchList(userUid: string, watchName: string, symbol: string) {
    const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, "watchlist");
    await collection.updateOne(
        { userUid, "watchlist.name": watchName },
        { $pull: { "watchlist.$.stocks": { symbol } } }
    );
    return { success: true };
}

// Get a user's watchlist
export async function getWatchList(userUid: string): Promise<WatchList | null> {
    const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, "watchlist");
    const doc = await collection.findOne({ userUid });
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { ...rest } as WatchList;
}

// Update the name of a watch in the user's watchlist by old watch name
export async function updateWatchName(userUid: string, oldWatchName: string, newName: string) {
    const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, "watchlist");
    await collection.updateOne(
        { userUid, "watchlist.name": oldWatchName },
        { $set: { "watchlist.$.name": newName } }
    );
    return { success: true };
}

// Add a new watch (with a name) to the user's watchlist array
export async function addWatch(userUid: string, watchName: string) {
    const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, "watchlist");
    await collection.updateOne(
        { userUid },
        { $push: { watchlist: { name: watchName, stocks: [] } } },
        { upsert: true }
    );
    return { success: true };
}


