import {
  Bell,
  Briefcase,
  ChartColumn,
  LayoutDashboard,
  MessageSquareText,
  SlidersHorizontal,
  Truck,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';

/** Sidebar sections. `countKey` shows a live count from app data. */
export const NAV_SECTIONS = [
  {
    id: 'main',
    label: null,
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/clients', label: 'Clients', icon: Users },
      { to: '/jobs', label: 'Jobs', icon: Briefcase, countKey: 'activeJobs' },
      { to: '/enquiries', label: 'Enquiries', icon: MessageSquareText, countKey: 'openEnquiries' },
      { to: '/notifications', label: 'Notifications', icon: Bell, countKey: 'unreadNotifications', alert: true },
      { to: '/vendors', label: 'Vendors', icon: Truck },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    items: [
      { to: '/services', label: 'Services', icon: Wrench },
      { to: '/team', label: 'Team', icon: UserRound },
      { to: '/reports', label: 'Reports', icon: ChartColumn },
      { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
    ],
  },
];

/** Page titles for the header, matched by path prefix (longest first). */
export const PAGE_TITLES = [
  ['/jobs/new', 'New job'],
  ['/jobs/', 'Job detail'],
  ['/jobs', 'Jobs'],
  ['/clients/new', 'Add client'],
  ['/clients', 'Clients'],
  ['/enquiries/new', 'New enquiry'],
  ['/enquiries', 'Enquiries'],
  ['/notifications', 'Notifications'],
  ['/vendors', 'Vendors'],
  ['/services', 'Services'],
  ['/team', 'Team'],
  ['/reports', 'Reports'],
  ['/settings', 'Settings'],
  ['/', 'Dashboard'],
];
