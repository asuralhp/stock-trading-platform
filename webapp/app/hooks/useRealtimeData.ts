'use client';

import { useEffect, useRef, useState } from 'react';
import { dataEventBus, type DataUpdateEvent } from '../lib/dataEventBus';

type UseRealtimeDataOptions = {
  /** Types to subscribe to (e.g., ['user', 'account']). Empty = all types */
  subscribeTypes?: string[];
  /** Callback when an update is received */
  onUpdate?: (event: DataUpdateEvent) => void;
};

/**
 * Hook to subscribe to real-time data updates via the event bus.
 * Updates are triggered by AgentChat or other components.
 */
export const useRealtimeData = (options: UseRealtimeDataOptions = {}) => {
  const { subscribeTypes = [], onUpdate } = options;
  const [lastEvent, setLastEvent] = useState<DataUpdateEvent | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const handleEvent = (event: DataUpdateEvent) => {
      // Filter by subscribeTypes if specified
      if (subscribeTypes.length > 0 && !subscribeTypes.includes(event.type)) {
        return;
      }
      setLastEvent(event);
      onUpdateRef.current?.(event);
    };

    const unsubscribes: (() => void)[] = [];
    if (subscribeTypes.length > 0) {
      subscribeTypes.forEach((type) => {
        unsubscribes.push(dataEventBus.subscribe(type, handleEvent));
      });
    } else {
      unsubscribes.push(dataEventBus.subscribeAll(handleEvent));
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [subscribeTypes]);

  return {
    lastEvent,
  };
};
