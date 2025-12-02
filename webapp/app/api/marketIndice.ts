'use server';

import { connect_collection } from '@/app/lib/dbconnect';
import { toMarketIndexRecord, MarketIndexRecord, RawMarketIndexRecord } from '@/app/models/MarketIndex';
import { MONGODB_COLLECTION_MARKET_INDICE, MONGODB_DATABASE_MARKET_DATA } from '@/GLOVAR';

export async function fetchMarketIndices(): Promise<MarketIndexRecord[]> {
    const collection = await connect_collection(
        MONGODB_DATABASE_MARKET_DATA,
        MONGODB_COLLECTION_MARKET_INDICE
    );

    const documents = await collection.find({}).toArray() as RawMarketIndexRecord[];

    return documents.map((doc) => toMarketIndexRecord(doc));
}
