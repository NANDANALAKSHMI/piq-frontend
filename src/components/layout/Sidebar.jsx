import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import Logo from './Logo.jsx';
import Avatar from '../common/Avatar.jsx';
import { NAV_SECTIONS } from './navConfig.js';
import { cn } from '../../utils/formatters.js';

function SidebarContent({ counts, user, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col gap-5 px-3.5 py-5">
      <Logo />
      <nav aria-label="Main" className="scrollbar-thin -mx-1 flex-1 overflow-y-auto px-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="flex flex-col gap-0.5">
            {section.label && (
              <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-[#8f9bb3]">{section.label}</p>
            )}
            {section.items.map(({ to, label, icon: Icon, end, countKey }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand font-semibold text-navy' : 'text-[#c9d2e3] hover:bg-navy-2 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{label}</span>
                    {countKey && counts[countKey] > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          isActive ? 'bg-navy text-white' : 'bg-navy-3 text-white',
                        )}
                      >
                        {counts[countKey]}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {user && (
        <div className="flex items-center gap-2.5 rounded-xl bg-navy-2 p-3">
          <Avatar name={user.name} color={user.color} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-navy-muted">{user.role === 'Admin' ? 'Administrator' : user.title}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="grid size-9 place-items-center rounded-lg bg-navy-3 text-white transition-colors hover:bg-[#3a4b72]"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Fixed sidebar on large screens and a slide-in drawer below that. */
export default function Sidebar({ counts, user, mobileOpen, onCloseMobile, onLogout }) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 bg-navy lg:block">
        <SidebarContent counts={counts} user={user} onLogout={onLogout} />
      </aside>

      <div className={cn('fixed inset-0 z-50 lg:hidden', mobileOpen ? 'visible' : 'invisible')} aria-hidden={!mobileOpen}>
        <div
          className={cn('absolute inset-0 bg-navy/50 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-navy transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute right-3 top-5 grid size-9 place-items-center rounded-lg text-navy-muted hover:bg-navy-2 hover:text-white"
            aria-label="Close menu"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <SidebarContent counts={counts} user={user} onNavigate={onCloseMobile} onLogout={onLogout} />
        </aside>
      </div>
    </>
  );
}
