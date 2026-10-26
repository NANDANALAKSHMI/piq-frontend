import { NavLink } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Menu, MessageSquareText, Plus } from 'lucide-react';
import { cn } from '../../utils/formatters.js';

const tabClass = ({ isActive }) =>
  cn(
    'flex min-h-11 min-w-14 flex-col items-center justify-center gap-1 text-[11px] font-medium',
    isActive ? 'font-semibold text-brand-ink' : 'text-muted',
  );

/** Bottom navigation for phones, matching the mobile design. */
export default function MobileTabBar({ onOpenMenu }) {
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-line bg-white px-1.5 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 md:hidden"
    >
      <NavLink to="/" end className={tabClass}>
        <LayoutDashboard className="size-[22px]" aria-hidden="true" />
        Home
      </NavLink>
      <NavLink to="/jobs" end className={tabClass}>
        <Briefcase className="size-[22px]" aria-hidden="true" />
        Jobs
      </NavLink>
      <NavLink
        to="/jobs/new"
        aria-label="Create new job"
        className="-mt-7 grid size-14 place-items-center rounded-2xl bg-brand text-navy shadow-[0_8px_18px_rgba(242,140,40,0.38)]"
      >
        <Plus className="size-6" aria-hidden="true" />
      </NavLink>
      <NavLink to="/enquiries" className={tabClass}>
        <MessageSquareText className="size-[22px]" aria-hidden="true" />
        Enquiries
      </NavLink>
      <button type="button" onClick={onOpenMenu} className={tabClass({ isActive: false })}>
        <Menu className="size-[22px]" aria-hidden="true" />
        More
      </button>
    </nav>
  );
}
