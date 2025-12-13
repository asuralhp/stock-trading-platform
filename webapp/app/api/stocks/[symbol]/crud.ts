'use server';
import { connect_collection } from '@/app/lib/dbconnect';
import { Order } from "@/app/models/Order";
import { auth } from "@/auth";
import { MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_ORDER, MONGODB_COLLECTION_STOCK_PRICES, TIME_UNIT, MONGODB_DATABASE_MARKET_DATA, ALPACA_API_KEY, ALPACA_API_SECRET } from "@/GLOVAR";
import { Double } from 'mongodb';
import { TickerData } from "@/app/models/Ticker";

export async function postOrder(formData: FormData) {
    console.log(formData);
    const session = await auth();
    const userUid = session?.user?.userUid;
    if (!userUid) {
        throw new Error("User not authenticated");
    }
    const symbol = formData.get('symbol');
    const order_type = formData.get('order_type');
    const action = formData.get('action');
    const amount = formData.get('amount');
    const price = formData.get('price');
    const sessionValue = formData.get('session');
    const time_in_force = formData.get('time_in_force');

    const order = {
        order_id: crypto.randomUUID(),
        userUid: String(userUid),
        symbol: String(symbol),
        order_type: order_type as "limit" | "market",
        action: action as "buy" | "sell",
        amount: Number(amount), // will be cast to int by Mongo
        price: new Double(Number(price)), // ensure float (double)
        order_date: new Date(),
        trade_date: null,
        status: "pending",
        session: sessionValue as "regular" | "after-hours",
        time_in_force: time_in_force as "DAY" | "GTC" | "FOK" | "IOC"
    };

    const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_ORDER);
    try {
        const result = await collection.insertOne(order);
        if (!result.acknowledged) {
            console.error("Failed to create order:", result);
            throw new Error("Failed to create order");
        }
        return { message: `${JSON.stringify(order)}` };
    } catch (err: any) {
        // Print detailed MongoDB error info for debugging
        console.error("MongoDB Insert Error:", err);
        if (err?.errInfo) {
            console.error("Validation Error Details:", JSON.stringify(err.errInfo, null, 2));
        }
        throw err;
    }
}


export async function getOrders(symbol: string) {
    const session = await auth();
    const userUid = session?.user?.userUid;
    if (!userUid) {
        throw new Error("User not authenticated");
    }
    const collection = await connect_collection(MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_ORDER);
    const orders = await collection.find({ userUid: String(userUid), symbol: String(symbol) }).toArray();

    // Convert MongoDB objects to plain JS objects
    return orders.map(order => ({
        id: order.order_id,
        action: order.action,
        amount: order.amount,
        price: typeof order.price === 'object' && order.price !== null && 'value' in order.price
            ? order.price.value
            : order.price,
        status: order.status,
        order_type: order.order_type,
        order_date: order.order_date instanceof Date ? order.order_date.toISOString() : order.order_date,
        // add other fields as needed
    }));
}


export async function getStockTicker(symbol: string, timeUnit: TIME_UNIT): Promise<TickerData[]> {
    const collection = await connect_collection(MONGODB_DATABASE_MARKET_DATA, MONGODB_COLLECTION_STOCK_PRICES);

    // Try to get minute OHLC from DB first
    const tickers = await collection.find({ symbol: String(symbol) }).toArray();
    if (tickers && tickers.length > 0) {
        return tickers.map(ticker => ({
            symbol: ticker.symbol,
            name: ticker.name,
            price: typeof ticker.price === 'object' && ticker.price !== null && 'value' in ticker.price
                ? ticker.price.value
                : ticker.price,
            Date: ticker.Date ?? ticker.date ?? null,
            Open: ticker.Open ?? ticker.open ?? null,
            Close: ticker.Close ?? ticker.close ?? null,
            Low: ticker.Low ?? ticker.low ?? null,
            High: ticker.High ?? ticker.high ?? null,
        }));
    }

    // If DB has no data, fetch previous day's 1-minute bars from Alpaca and insert into DB
    if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
        throw new Error('Alpaca API keys are not configured');
    }

    try {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setUTCDate(now.getUTCDate() - 1);
        const start = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 0, 0, 0));
        const end = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59));

        const startISO = start.toISOString();
        const endISO = end.toISOString();

        const url = `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/bars?timeframe=1Min&start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&limit=1000`;

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'APCA-API-KEY-ID': ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Alpaca API error ${res.status}: ${body}`);
        }

        const data = await res.json();

        // Alpaca may return { bars: [...] } or other shapes; normalize to array
        let bars: any[] = [];
        if (Array.isArray(data?.bars)) {
            bars = data.bars;
        } else if (Array.isArray(data)) {
            bars = data;
        } else if (data?.bars && typeof data.bars === 'object') {
            // try values
            bars = Object.values(data.bars).filter((v: any) => Array.isArray(v)).flat();
        }

        if (!bars || bars.length === 0) {
            throw new Error(`No minute bars returned from Alpaca for ${symbol} on ${startISO}`);
        }

        // Map to DB documents and insert
        const docs = bars.map(bar => ({
            symbol: String(symbol),
            Date: bar.t ?? bar.time ?? bar.timestamp ?? null,
            Open: bar.o ?? bar.open ?? null,
            Close: bar.c ?? bar.close ?? null,
            Low: bar.l ?? bar.low ?? null,
            High: bar.h ?? bar.high ?? null,
            Volume: bar.v ?? bar.volume ?? null,
            fetched_at: new Date(),
        }));

        if (docs.length > 0) {
            try {
                await collection.insertMany(docs, { ordered: false });
            } catch (insertErr: any) {
                // ignore duplicate key errors or partial failures (silent)
            }
        }

        return docs.map(d => new TickerData(String(d.Date), Number(d.Open ?? 0), Number(d.Close ?? 0), Number(d.Low ?? 0), Number(d.High ?? 0)));

    } catch (err: any) {
        throw err;
    }
}

export async function getTickerInfo(symbol: string) {
    const collection = await connect_collection(MONGODB_DATABASE_MARKET_DATA, 'ticker_info');
    const info = await collection.findOne({ symbol: String(symbol) });
    if (!info) {
        return null;
    }
    // Convert ObjectId and other BSON types to plain JSON-safe objects if needed
    // We'll keep the shape as-is and let the client component handle field access safely.
    return info;
}