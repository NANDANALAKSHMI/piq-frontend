import { Menu } from 'lucide-react';
import { LogoMark } from './Logo.jsx';
import { IconButton } from '../common/Button.jsx';

/** Top bar for phones and tablets only — on desktop the sidebar logo section takes its place. */
export default function Header({ title, onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 md:px-7 lg:hidden">
      <IconButton icon={Menu} label="Open menu" onClick={onOpenMenu} />
      <LogoMark size={32} />
      <p className="truncate text-base font-semibold">{title}</p>
    </header>
  );
}
