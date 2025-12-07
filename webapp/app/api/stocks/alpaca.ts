'use server';
import { ALPACA_API_KEY, ALPACA_API_SECRET } from '@/GLOVAR';



export async function getWatchLatestPrice(symbol: string, feed: string = 'delayed_sip') {
  if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
    console.error('Missing ALPACA_API_KEY or ALPACA_API_SECRET environment variables.');
    return null;
  }

  const url = `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/quotes/latest?feed=${feed}`;

  try {
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
    console.log(data);
    return data;
  } catch (err) {
    console.error('Failed to fetch Alpaca quote:', err);
    return null;
  }
}



export async function getWatchPrevDayClose(symbol: string) {
  if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
    console.error('Missing ALPACA_API_KEY or ALPACA_API_SECRET environment variables.');
    return null;
  }
  
  const url = `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/bars?timeframe=1Day&limit=2`;
  
  try {
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
    console.log(data);
    return data;
  } catch (err) {
    console.error('Failed to fetch Alpaca bars:', err);
    return null;
  }
}

// Simple runner when executed via `npx tsx`.
if (require.main === module) {
  const symbol = process.argv[2] || 'AAPL';
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getWatchLatestPrice(symbol);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getWatchPrevDayClose(symbol);
}
