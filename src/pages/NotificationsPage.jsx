import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AtSign, Bell, CheckCheck, MessageSquareText, Workflow } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { cn, relativeTime } from '../utils/formatters.js';

const NOTIFICATION_ICONS = {
  overdue: { icon: AlertTriangle, className: 'bg-red-50 text-red-700' },
  mention: { icon: AtSign, className: 'bg-violet-50 text-violet-700' },
  enquiry: { icon: MessageSquareText, className: 'bg-brand-soft text-brand-ink' },
  stage: { icon: Workflow, className: 'bg-blue-50 text-blue-700' },
};

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppData();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You are all caught up.'}
        actions={
          <Button icon={CheckCheck} onClick={markAllNotificationsRead} disabled={!unread}>
            Mark all read
          </Button>
        }
      />
      <Card padded={false}>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="Updates on jobs and enquiries will show up here." />
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((notification) => {
              const { icon: Icon, className } = NOTIFICATION_ICONS[notification.type] ?? NOTIFICATION_ICONS.stage;
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(notification.id);
                      if (notification.link) navigate(notification.link);
                    }}
                    className={cn(
                      'flex w-full gap-3.5 px-5 py-4 text-left transition-colors hover:bg-slate-50',
                      !notification.read && 'bg-brand-soft/40',
                    )}
                  >
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', className)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{notification.title}</span>
                      <span className="block text-[13px] text-muted">{notification.body}</span>
                      <span className="mt-0.5 block text-xs text-muted">{relativeTime(notification.minutesAgo)}</span>
                    </span>
                    {!notification.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
