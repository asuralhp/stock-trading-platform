import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient } from 'mongodb';

const MONGODB_DATABASE_ACCOUNT_DATA = 'account_data';
const MONGODB_COLLECTION_ORDER = 'orders';

async function testGetOrders() {
    console.log('=== Testing MongoDB Orders Query ===\n');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set!');
        process.exit(1);
    }
    console.log('MongoDB URI found:', uri.substring(0, 30) + '...');
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DATABASE_ACCOUNT_DATA);
    const collection = db.collection(MONGODB_COLLECTION_ORDER);
    
    const symbol = 'NVDA';
    const userUid = 'github_33573968';
    
    console.log('Test parameters:');
    console.log('  symbol:', symbol);
    console.log('  userUid:', userUid);
    console.log('  Database:', MONGODB_DATABASE_ACCOUNT_DATA);
    console.log('  Collection:', MONGODB_COLLECTION_ORDER);
    console.log('');
    
    try {
        // Test 1: Get all orders in collection
        console.log('--- Test 1: All orders in collection ---');
        const allOrders = await collection.find({}).toArray();
        console.log('Total orders in collection:', allOrders.length);
        allOrders.forEach((order, i) => {
            console.log(`  Order ${i + 1}:`, {
                userUid: order.userUid,
                symbol: order.symbol,
                action: order.action,
                amount: order.amount
            });
        });
        console.log('');
        
        // Test 2: Get orders by symbol only
        console.log('--- Test 2: Orders by symbol only ---');
        const ordersBySymbol = await collection.find({ symbol: symbol }).toArray();
        console.log(`Orders for symbol "${symbol}":`, ordersBySymbol.length);
        console.log('');
        
        // Test 3: Get orders by userUid only
        console.log('--- Test 3: Orders by userUid only ---');
        const ordersByUser = await collection.find({ userUid: userUid }).toArray();
        console.log(`Orders for userUid "${userUid}":`, ordersByUser.length);
        console.log('');
        
        // Test 4: Get orders by both
        console.log('--- Test 4: Orders by both userUid AND symbol ---');
        const ordersBoth = await collection.find({ userUid: userUid, symbol: symbol }).toArray();
        console.log(`Orders matching both:`, ordersBoth.length);
        console.log('');
        
        // Test 5: Check field types
        if (allOrders.length > 0) {
            console.log('--- Test 5: Field types in first order ---');
            const first = allOrders[0];
            console.log('  userUid type:', typeof first.userUid);
            console.log('  userUid value:', JSON.stringify(first.userUid));
            console.log('  symbol type:', typeof first.symbol);
            console.log('  symbol value:', JSON.stringify(first.symbol));
        }
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('Error:', error);
    }
    
    await client.close();
    process.exit(0);
}

testGetOrders();
