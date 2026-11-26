import { useLayoutEffect, useRef, useState } from 'react';

const GAP = 12; // space kept between the panel and the screen edge
const IDEAL = 420; // height the panel would like
const MIN = 220; // never shorter than this

/** Height covered by the page's sticky header, if there is one (forms use StickyPageHeader). */
function stickyHeaderBottom() {
  const header = document.querySelector('[data-sticky-header]');
  return header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
}

/**
 * Keeps a dropdown panel fully on screen. The panel opens below its field, capped so field + panel
 * fit between the sticky header and the bottom of the screen; if it would run past the bottom
 * (field near the end of a form), the page scrolls just enough to show all of it.
 * Put `panelRef` on the panel and `style={{ maxHeight }}` on it.
 */
export default function useDropdownPlacement(anchorRef, open) {
  const panelRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(IDEAL);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const anchor = anchorRef.current;
    if (!anchor) return undefined;
    const fit = () => {
      const usable = window.innerHeight - stickyHeaderBottom() - anchor.offsetHeight - GAP * 3;
      setMaxHeight(Math.max(MIN, Math.min(IDEAL, usable)));
    };
    fit();
    const frame = requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', fit);
    };
  }, [anchorRef, open]);

  return { panelRef, maxHeight };
}
