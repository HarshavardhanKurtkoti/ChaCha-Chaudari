import { useEffect, useRef } from 'react';

// Tracks total focused time on the website across sessions in seconds.
// Stores in localStorage under key 'siteTimeSeconds'.
export default function useSiteTimer() {
  const intervalRef = useRef(null);

  useEffect(() => {
    const KEY = 'siteTimeSeconds';
    const tick = () => {
      // Only count when tab is visible
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        const raw = localStorage.getItem(KEY);
        const val = raw ? parseInt(raw, 10) || 0 : 0;
        localStorage.setItem(KEY, String(val + 1));
      } catch { /* ignore */ }
    };

    intervalRef.current = setInterval(tick, 1000);

    const onVisibility = () => {
      // no-op, tick checks visibility
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
