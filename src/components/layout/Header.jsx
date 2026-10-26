import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AtSign, Bell, ChevronDown, LogOut, Menu, MessageSquareText, Settings, ShieldCheck, Workflow } from 'lucide-react';
import GlobalSearch from './GlobalSearch.jsx';
import Dropdown from '../common/Dropdown.jsx';
import Avatar from '../common/Avatar.jsx';
import { IconButton } from '../common/Button.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';
import { cn, relativeTime } from '../../utils/formatters.js';

const NOTIFICATION_ICONS = {
  overdue: { icon: AlertTriangle, className: 'bg-red-50 text-red-700' },
  mention: { icon: AtSign, className: 'bg-violet-50 text-violet-700' },
  enquiry: { icon: MessageSquareText, className: 'bg-brand-soft text-brand-ink' },
  stage: { icon: Workflow, className: 'bg-blue-50 text-blue-700' },
};

function NotificationsMenu() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppData();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Dropdown
      panelClassName="w-[min(360px,calc(100vw-2rem))]"
      trigger={({ toggle, open }) => (
        <IconButton icon={Bell} label={`Notifications, ${unread} unread`} onClick={toggle} aria-expanded={open}>
          {unread > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full border-2 border-white bg-red-600" />}
        </IconButton>
      )}
    >
      {({ close }) => (
        <>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">Notifications</p>
            <button
              type="button"
              onClick={markAllNotificationsRead}
              disabled={!unread}
              className="text-[13px] font-semibold text-brand-ink hover:underline disabled:text-muted disabled:no-underline"
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => {
              const { icon: Icon, className } = NOTIFICATION_ICONS[notification.type];
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(notification.id);
                      navigate(notification.link);
                      close();
                    }}
                    className={cn('flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50', !notification.read && 'bg-brand-soft/40')}
                  >
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', className)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{notification.title}</span>
                      <span className="block truncate text-xs text-muted">{notification.body}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">{relativeTime(notification.minutesAgo)}</span>
                    </span>
                    {!notification.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Dropdown>
  );
}

function ProfileMenu({ user, onLogout }) {
  const navigate = useNavigate();
  const items = [
    { label: 'Settings', icon: Settings, to: '/settings' },
    { label: 'Team & Access', icon: ShieldCheck, to: '/team' },
  ];

  return (
    <Dropdown
      panelClassName="w-60"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-slate-50 md:border-l md:border-line md:pl-3"
        >
          <Avatar name={user.name} color={user.color} />
          <span className="hidden text-left md:block">
            <span className="block text-[13px] font-semibold">{user.name}</span>
            <span className="block text-xs text-muted">{user.role === 'Admin' ? 'Administrator' : user.title}</span>
          </span>
          <ChevronDown className="hidden size-4 text-muted md:block" aria-hidden="true" />
        </button>
      )}
    >
      {({ close }) => (
        <div className="py-1.5">
          <div className="border-b border-line px-4 pb-3 pt-2">
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          {items.map(({ label, icon: Icon, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                navigate(to);
                close();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium hover:bg-slate-50"
            >
              <Icon className="size-4 text-muted" aria-hidden="true" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left text-[13px] font-semibold text-red-700 hover:bg-red-50"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </Dropdown>
  );
}

export default function Header({ title, user, onOpenMenu, onLogout }) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 md:px-7 md:py-3.5">
      <IconButton icon={Menu} label="Open menu" onClick={onOpenMenu} className="lg:hidden" />
      <p className="truncate text-base font-semibold md:hidden">{title}</p>
      <div className="order-last w-full md:order-none md:w-auto md:flex-1">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <NotificationsMenu />
        {user && <ProfileMenu user={user} onLogout={onLogout} />}
      </div>
    </header>
  );
}
