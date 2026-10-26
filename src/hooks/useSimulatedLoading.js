import { useEffect, useState } from 'react';

/**
 * Shows a short loading state whenever `key` changes, imitating a network
 * request so loading skeletons can be seen in this frontend-only build.
 */
export default function useSimulatedLoading(key, duration = 450) {
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadedKey(key), duration);
    return () => window.clearTimeout(timer);
  }, [key, duration]);

  return loadedKey !== key;
}
