import { cn } from '../../utils/formatters.js';

/** Box Theory brand mark — the "T" inside a geometric box (from the brand guidelines). */
const MARK_PATH =
  'M 895.757812 452.871094 L 856.859375 452.871094 L 856.859375 542.371094 L 810.605469 542.371094 L 810.605469 452.871094 L 771.738281 452.871094 L 771.769531 421.089844 L 867.292969 421.089844 L 895.757812 449.796875 Z M 926.167969 477.777344 L 926.167969 439.0625 C 926.167969 437.179688 925.40625 435.351562 924.101562 434.015625 L 882.070312 391.652344 C 880.703125 390.28125 878.878906 389.523438 876.992188 389.523438 L 741.359375 389.523438 L 741.296875 525.097656 C 741.296875 526.980469 742.058594 528.808594 743.394531 530.144531 L 785.121094 571.839844 C 786.457031 573.175781 788.253906 573.9375 790.136719 573.9375 L 925.957031 573.9375 L 925.957031 517.585938 C 925.957031 515.578125 925.105469 513.632812 923.582031 512.261719 L 889.917969 482.125 L 921.820312 482.125 C 924.222656 482.125 926.167969 480.179688 926.167969 477.777344 Z';

export function LogoMark({ size = 38, color = '#b99a60', className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="741.29 389.52 184.88 184.42"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <path fill={color} fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

/** Logo lockup: mark + "Box Theory" wordmark + tagline. `tone` is the background it sits on. */
export default function Logo({ tone = 'dark', size = 40, className }) {
  const dark = tone === 'dark';
  return (
    <div className={cn('flex items-center gap-3 px-2', className)}>
      <LogoMark size={size} />
      <div>
        <span className={cn('block font-display text-[21px] font-bold leading-[0.95]', dark ? 'text-white' : 'text-navy')}>
          Box Theory
        </span>
        <span className={cn('mt-1 block text-[11px] font-medium', dark ? 'text-navy-muted' : 'text-muted')}>
          Packaging Intelligence
        </span>
      </div>
    </div>
  );
}
