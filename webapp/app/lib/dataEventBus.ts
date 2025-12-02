/**
 * Client-side event bus for real-time data updates.
 * This allows components to subscribe to and dispatch data update events.
 */

export type DataUpdateEvent = {
  type: string; // e.g., 'user', 'account', 'stock', 'order'
  action: 'create' | 'update' | 'delete';
  data?: unknown;
  id?: string;
  timestamp: number;
};

type EventCallback = (event: DataUpdateEvent) => void;

class DataEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private globalListeners: Set<EventCallback> = new Set();

  /**
   * Subscribe to events of a specific type (e.g., 'user', 'account', 'stock')
   */
  subscribe(type: string, callback: EventCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Subscribe to all events regardless of type
   */
  subscribeAll(callback: EventCallback): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Dispatch an update event to all relevant subscribers
   */
  dispatch(event: DataUpdateEvent): void {
    // Notify type-specific listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (err) {
          console.error('[DataEventBus] Error in listener:', err);
        }
      });
    }

    // Notify global listeners
    this.globalListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('[DataEventBus] Error in global listener:', err);
      }
    });
  }
}

export const dataEventBus = new DataEventBus();
