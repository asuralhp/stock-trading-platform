'use server';
import { connect_collection } from '@/app/lib/dbconnect';
import { Order } from "@/app/models/Order";
import { auth } from "@/auth";
import { MONGODB_DATABASE_ACCOUNT_DATA, MONGODB_COLLECTION_ORDER, MONGODB_COLLECTION_STOCK_PRICES, TIME_UNIT, MONGODB_DATABASE_MARKET_DATA} from "@/GLOVAR";
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
    const tickers = await collection.find({ symbol: String(symbol) }).toArray();
    if (!tickers || tickers.length === 0) {
        throw new Error(`Ticker not found for symbol: ${symbol}`);
    }
    // Convert MongoDB objects to TickerData[]
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