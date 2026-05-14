import { useEffect, useRef, useState } from 'react';
import { initialKioskState, KioskState } from '@/types/kiosk';

const SNAPSHOT_PATH = '/api/kiosk/state';
const EVENTS_PATH = '/api/kiosk/events';

export function useKioskData() {
  const [state, setState] = useState<KioskState>(initialKioskState);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;

    const clearRetryTimer = () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const connectEvents = () => {
      if (cancelled) return;

      eventSource = new EventSource(EVENTS_PATH);

      eventSource.addEventListener('state', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent<string>).data) as KioskState;
          if (!cancelled) {
            setState(parsed);
          }
        } catch {
          if (!cancelled) {
            setState((prev) => ({ ...prev, error: 'Failed to parse backend event stream' }));
          }
        }
      });

      eventSource.onerror = () => {
        if (cancelled) return;

        eventSource?.close();
        setState((prev) => ({ ...prev, error: 'Backend event stream disconnected' }));

        clearRetryTimer();
        retryTimerRef.current = window.setTimeout(() => {
          connectEvents();
        }, 3000);
      };
    };

    const loadSnapshot = async () => {
      try {
        const response = await fetch(SNAPSHOT_PATH, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Snapshot request failed: ${response.status}`);
        }

        const snapshot = (await response.json()) as KioskState;
        if (!cancelled) {
          setState(snapshot);
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, error: 'Failed to load backend snapshot' }));
        }
      }
    };

    void loadSnapshot();
    connectEvents();

    return () => {
      cancelled = true;
      eventSource?.close();
      clearRetryTimer();
    };
  }, []);

  return state;
}
