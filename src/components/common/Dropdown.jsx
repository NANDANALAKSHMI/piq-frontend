import { useCallback, useRef, useState } from 'react';
import useClickOutside from '../../hooks/useClickOutside.js';
import { cn } from '../../utils/formatters.js';

/**
 * Popover anchored to a trigger. `trigger` receives { open, toggle } and must
 * render the button; `children` receives { close }.
 */
export default function Dropdown({ trigger, children, align = 'right', panelClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          className={cn(
            'absolute top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-white shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children({ close })}
        </div>
      )}
    </div>
  );
}
