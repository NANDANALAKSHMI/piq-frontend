import { Menu } from 'lucide-react';
import { LogoMark } from './Logo.jsx';
import { IconButton } from '../common/Button.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';

/** Top bar for phones and tablets only — on desktop the sidebar logo section takes its place. */
export default function Header({ title, onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:px-7 lg:hidden">
      <IconButton icon={Menu} label="Open menu" onClick={onOpenMenu} />
      <LogoMark size={32} />
      <p className="flex-1 truncate text-base font-semibold">{title}</p>
      <ThemeToggle />
    </header>
  );
}
