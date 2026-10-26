import { useEffect } from 'react';

/** Calls `onOutside` when a pointer press or Escape happens outside `ref` while `active`. */
export default function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const handlePointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside();
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') onOutside();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, onOutside, active]);
}
