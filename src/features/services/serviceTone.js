/**
 * Soft tinted colours for a service's letter avatar, picked from its name so each service keeps
 * the same colour everywhere. Tones were chosen to sit well on the warm brown / gold theme:
 * pale fills in light mode, translucent glows with light text in dark mode.
 */
const TONES = [
  'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-300/25',
  'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-300/25',
  'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-300/25',
  'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-400/15 dark:text-rose-200 dark:ring-rose-300/25',
  'bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-400/15 dark:text-violet-200 dark:ring-violet-300/25',
  'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-400/15 dark:text-teal-200 dark:ring-teal-300/25',
  'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-400/15 dark:text-orange-200 dark:ring-orange-300/25',
];

const INACTIVE = 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/5 dark:text-[#8a7d74] dark:ring-white/10';

export function serviceTone(name = '', active = true) {
  if (!active) return INACTIVE;
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

export const initialOf = (name = '') => name.trim().charAt(0).toUpperCase() || '?';

/** Card surface (the app-wide .app-card look from index.css). */
export const SERVICE_SURFACE = 'app-card rounded-2xl border';

/** List row inside those cards (sub-services, questions). */
export const SERVICE_ROW = 'app-row rounded-xl border';
