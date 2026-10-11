'use client';
import { useSyncExternalStore } from 'react';
function useMedia(query: string) {
  return useSyncExternalStore(callback => { const m = matchMedia(query); m.addEventListener('change',callback); return () => m.removeEventListener('change',callback); }, () => matchMedia(query).matches, () => false);
}
export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');
export const useFinePointer = () => useMedia('(pointer: fine)');
