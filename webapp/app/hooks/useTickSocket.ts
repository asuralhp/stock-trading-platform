"use client";

import { useEffect, useRef, useState } from "react";

export type Tick = {
  symbol: string;
  price: number;
  size: number;
  timestamp: number;
  utc_timestamp: string;
  trade_id: number;
  [k: string]: any;
};

type Options = {
  url?: string;
  onTick?: (tick: Tick) => void;
  maxTicks?: number;
  autoReconnect?: boolean;
};

export function useTickSocket(symbol: string | null, options: Options = {}) {
  const { url = "ws://localhost:3009", onTick, maxTicks = 1000, autoReconnect = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(500);
  const mountedRef = useRef(true);

  const [connected, setConnected] = useState(false);
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // If no symbol provided, close any existing connection
    if (!symbol) {
      closeWs();
      return;
    }

    openWs();

    return () => {
      closeWs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, url]);

  function openWs() {
    try {
      // don't run on server / when WebSocket is unavailable
      if (typeof window === "undefined" || typeof WebSocket === "undefined") {
        console.warn('[useTickSocket] WebSocket not available in this environment');
        return;
      }
      closeWs();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 500; // reset backoff
        setConnected(true);
        console.info('[useTickSocket] connected', { symbol, url });
        // send subscription message with symbol
        if (symbol) ws.send(JSON.stringify({ symbol }));
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as Tick;
          console.debug('[useTickSocket] received tick', data);
          if (!data) return;
          // append newest tick to start
          setTicks((prev) => {
            const next = [data, ...prev];
            if (next.length > maxTicks) next.length = maxTicks;
            return next;
          });
          onTick?.(data);
        } catch (err) {
          // ignore bad payloads
          console.warn('[useTickSocket] invalid payload', err);
        }
      };

      ws.onerror = (ev) => {
        console.error('[useTickSocket] websocket error', ev);
      };

      ws.onclose = () => {
        setConnected(false);
        console.info('[useTickSocket] websocket closed', { symbol, url });
        // attempt reconnect with backoff
        if (autoReconnect && mountedRef.current) {
          const ms = backoffRef.current;
          reconnectTimeout.current = setTimeout(() => {
            backoffRef.current = Math.min(backoffRef.current * 1.8, 30_000);
            openWs();
          }, ms);
        }
      };
    } catch (err) {
      // swallow
    }
  }

  function closeWs() {
    // clear reconnect timer
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current as ReturnType<typeof setTimeout>);
      reconnectTimeout.current = null;
    }
    const ws = wsRef.current;
    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      } catch (e) {
        // ignore
      }
    }
    wsRef.current = null;
    setConnected(false);
  }

  function sendRaw(obj: any) {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  const latest = ticks[0] ?? null;

  return {
    connected,
    ticks,
    latest,
    sendRaw,
    close: closeWs,
  } as const;
}
