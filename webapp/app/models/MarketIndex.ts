export interface RawMarketIndexRecord {
    _id?: { toString(): string } | string;
    country?: string;
    continent?: string;
    price?: string;
    change?: string;
    ['market index']?: string;
    marketIndex?: string;
}

export interface MarketIndexRecord {
    _id: string;
    country: string;
    marketIndex: string;
    continent: string;
    price: string;
    change: string;
}

export function toMarketIndexRecord(doc: RawMarketIndexRecord): MarketIndexRecord {
    return {
        _id: typeof doc._id === 'string' ? doc._id : doc._id?.toString() ?? '',
        country: doc.country ?? 'Unknown',
        marketIndex: doc['market index'] ?? doc.marketIndex ?? 'Unknown',
        continent: doc.continent ?? 'Unknown',
        price: doc.price ?? '0',
        change: doc.change ?? '0'
    };
}
