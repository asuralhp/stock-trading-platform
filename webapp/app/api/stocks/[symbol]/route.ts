"use server";
import { NextResponse } from "next/server";
import stocks from "../../../data/stocks.json";

export async function GET() {
    return NextResponse.json({
        message:"Hello GET Here is stock"
    })
}


export async function POST(req: Request, context: any) {
    const { params } = await context;
    const data = await req.json()
    
    const symbol = params.symbol;
    const stock = stocks.filter(stock => stock.symbol.toString() === symbol.toString());
    return NextResponse.json({stock});
}

