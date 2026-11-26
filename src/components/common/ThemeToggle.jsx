import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { cn } from '../../utils/formatters.js';

/**
 * Sun/moon button that flips between light and dark.
 * `variant="sidebar"` matches the cocoa sidebar; the default matches the light/dark page surfaces.
 */
export default function ThemeToggle({ variant = 'default', className }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-lg transition-colors',
        variant === 'sidebar'
          ? 'bg-navy-3 text-white hover:bg-[#7a6457] dark:hover:bg-[#4a3b33]'
          : 'size-10.5 rounded-[10px] border border-line bg-surface text-ink hover:bg-slate-50',
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
