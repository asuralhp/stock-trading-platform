'use client';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './Sortable.scss';
export function SortableItem(props: { id: string; active?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  var cls = "general-container " + `${props.active ? "active-watchlist" :"" }`

  return (
    <div className={cls} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SymbolTab>{props.id} </SymbolTab>
    </div>
  );
}




// Module-level cache shared across component instances
const priceCache: Map<string, { price: number | null; prevClose: number | null }> = new Map();

export function SortableItemForSymbol(props: { id: string }) {
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const [price, setPrice] = useState<number | null>(null);
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract numeric price from various possible Alpaca response shapes
  const extractPrice = (latest: any): number | null => {
    if (!latest) return null;
    const d = latest.data ?? latest;
    if (!d) return null;
    if (typeof d === 'number') return d;
    if (d.quote && (d.quote.ap || d.quote.bp)) return d.quote.ap ?? d.quote.bp ?? null;
    if (d.last && d.last.price) return d.last.price;
    if (d.ask_price) return d.ask_price;
    if (d.price) return d.price;
    if (d.results && Array.isArray(d.results) && d.results[0] && d.results[0].c) return d.results[0].c;
    if (Array.isArray(d) && d[0] && d[0].c) return d[0].c;
    return null;
  };

  const extractPrevClose = (prev: any): number | null => {
    if (!prev) return null;
    const d = prev.data ?? prev;
    if (!d) return null;
    if (d.bars && Array.isArray(d.bars) && d.bars.length > 0) return d.bars[0].c ?? null;
    if (d.results && Array.isArray(d.results) && d.results.length > 0) return d.results[0].c ?? null;
    if (Array.isArray(d) && d.length > 0 && d[0].c) return d[0].c;
    return null;
  };

  // Fetch quote from server API for the given symbol
  useEffect(() => {
    let active = true;
    const symbol = props.id;
    setLoading(true);

    // If cached, use cached values and skip network
    const cached = priceCache.get(symbol);
    if (cached) {
      if (active) {
        setPrice(cached.price);
        setPrevClose(cached.prevClose);
        setLoading(false);
      }
      return () => {
        active = false;
      };
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}`);
        if (!res.ok) throw new Error(`Failed to fetch symbol ${symbol}`);
        const json = await res.json();
        if (!active) return;
        const latestPrice = extractPrice(json.latest);
        const prev = extractPrevClose(json.prev);
        if (latestPrice != null) setPrice(latestPrice);
        if (prev != null) setPrevClose(prev);

        // Cache the fetched values so future mounts reuse them
        priceCache.set(symbol, { price: latestPrice ?? null, prevClose: prev ?? null });
      } catch (err) {
        console.error('[SortableItemForSymbol] fetch error', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [props.id]);

  const displayPrice = price != null ? price : '—';
  const change = price != null && prevClose != null ? price - prevClose : null;
  const change_dir = (change ?? 0) >= 0 ? '+' : '-';
  const change_rate = price && change != null && price !== 0 ? ((change / price) * 100).toFixed(2) : '—';

  return (
    <div className="general-container" ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SymbolTab>
        <Link href={`/stock/${props.id}`}>
          {props.id}
        </Link>

      </SymbolTab>
      <SymbolTab>
        {loading ? '…' : displayPrice}
      </SymbolTab>
      <SymbolTab>
        {loading ? '…' : (change != null ? `${change_dir}${Math.abs(change).toFixed(2)} (${change_dir}${change_rate}%)` : '—')}
      </SymbolTab>
    </div>
  );
}

export function SymbolTab(props: { children: React.ReactNode }) {
  return (
    <div className='symboltab'>
      {props.children}

    </div>
  );
}