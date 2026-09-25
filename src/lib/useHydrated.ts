import { useEffect, useState } from 'react';
import { useApp } from '@/state/app';

/** True once the persisted store has been loaded from device storage. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useApp.persist.hasHydrated());
  useEffect(() => {
    const unsub = useApp.persist.onFinishHydration(() => setHydrated(true));
    if (useApp.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
