import Earth, { IndexData } from './components/Earth';
import { fetchMarketIndices } from './api/marketIndice';
import type { MarketIndexRecord } from './models/MarketIndex';

const MARKET_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'S&P 500': { lat: 40.7128, lon: -74.006 },
  'Dow Jones Industrial': { lat: 40.7128, lon: -74.006 },
  'NASDAQ Composite': { lat: 40.7549, lon: -73.984 },
  'S&P/TSX Composite': { lat: 43.6532, lon: -79.3832 },
  'FTSE 100': { lat: 54.5, lon: -2.2 },
  'FTSE 250': { lat: 54.5, lon: -2.2 },
  'DAX': { lat: 51.1657, lon: 10.4515 },
  'MDAX': { lat: 51.1657, lon: 10.4515 },
  'CAC 40': { lat: 47.2, lon: 2.2 },
  'CAC Next 20': { lat: 47.2, lon: 2.2 },
  'Nikkei 225': { lat: 35.6762, lon: 139.6503 },
  'TOPIX': { lat: 35.6762, lon: 139.6503 },
  'Shanghai Composite': { lat: 31.2304, lon: 121.4737 },
  'Shenzhen Composite': { lat: 22.5431, lon: 114.0579 },
  'Nifty 50': { lat: 19.076, lon: 72.8777 },
  'Sensex': { lat: 19.076, lon: 72.8777 },
  'ASX 200': { lat: -33.8688, lon: 151.2093 },
  'Bovespa': { lat: -23.5505, lon: -46.6333 },
  'IBrX': { lat: -23.5505, lon: -46.6333 },
  'JSE All Share': { lat: -26.2041, lon: 28.0473 },
  'FTSE/JSE Africa Top 40': { lat: -26.2041, lon: 28.0473 },
  'RTS Index': { lat: 55.7558, lon: 37.6173 },
  'IPC (Índice de Precios y Cotizaciones)': { lat: 19.4326, lon: -99.1332 },
  'Straits Times Index': { lat: 1.3521, lon: 103.8198 },
  'Hang Seng Index': { lat: 22.3193, lon: 114.1694 },
  'IDX Composite': { lat: -6.2088, lon: 106.8456 },
  'Taiwan Weighted Index': { lat: 25.033, lon: 121.5654 },
  'BIST 100': { lat: 41.0082, lon: 28.9784 },
  'Tadawul All Share Index': { lat: 24.7136, lon: 46.6753 },
  'ADX General Index': { lat: 24.4539, lon: 54.3773 },
  'NSE All Share Index': { lat: 6.5244, lon: 3.3792 },
  'IPSA': { lat: -33.4489, lon: -70.6693 },
  'S&P/BVL Peru General Index': { lat: -12.0464, lon: -77.0428 }
};

const MARKET_ALIASES: Record<string, keyof typeof MARKET_COORDINATES> = {
  'Dow Jones': 'Dow Jones Industrial',
  'Dow Jones Industrial Average': 'Dow Jones Industrial',
  'Nasdaq 100': 'NASDAQ Composite',
  'Nasdaq Composite': 'NASDAQ Composite',
  'Hang Seng': 'Hang Seng Index'
};

function attachCoordinates(records: MarketIndexRecord[]): IndexData[] {
  return records
    .map((record) => {
      const trimmedName = record.marketIndex.trim();
      const aliasKey = MARKET_ALIASES[trimmedName];
      const coords =
        MARKET_COORDINATES[trimmedName] ??
        (aliasKey ? MARKET_COORDINATES[aliasKey] : undefined);
      if (!coords) return null;
      return { ...record, ...coords } as IndexData;
    })
    .filter((entry): entry is IndexData => entry !== null);
}

export default async function Home() {
  const rawIndices = await fetchMarketIndices();
  const indices = attachCoordinates(rawIndices);

  return (
    <div>
      <div style={{ height: '600px', width: '100%' }}>
        <Earth data={indices} />
      </div>
    </div>
  );
}

