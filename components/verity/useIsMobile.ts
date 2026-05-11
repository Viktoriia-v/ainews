'use client';

import { useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT_PX } from '@/lib/responsive';

export function useIsMobile(initial = false, breakpoint = MOBILE_BREAKPOINT_PX): boolean {
  const [isMobile, setIsMobile] = useState(initial);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
