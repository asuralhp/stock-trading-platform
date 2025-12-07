"use server";
import { NextResponse } from "next/server";
import stocks from "../../../data/stocks.json";
import { getWatchLatestPrice, getWatchPrevDayClose } from "../alpaca";

export async function GET(request: Request, context: any) {
    const { params } = context;
    const symbol = params?.symbol;

    if (!symbol) {
        return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    try {
        // Fetch latest quote and previous day bars
        const latest = await getWatchLatestPrice(symbol);
        const prev = await getWatchPrevDayClose(symbol);

        // Build response
        return NextResponse.json({
            symbol,
            latest,
            prev,
            // include any local static data if present
            static: stocks.find((s) => s.symbol === symbol) ?? null,
        });
    } catch (err) {
        console.error('[stocks/[symbol] GET] error', err);
        return NextResponse.json({ error: 'Failed to fetch symbol data' }, { status: 500 });
    }
}

export async function POST(req: Request, context: any) {
    const { params } = await context;
    const data = await req.json();

    const symbol = params.symbol;
    const stock = stocks.filter((stock) => stock.symbol.toString() === symbol.toString());
    return NextResponse.json({ stock });
}

