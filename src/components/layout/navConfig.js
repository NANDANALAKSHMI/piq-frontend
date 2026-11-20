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
      { to: '/projects', label: 'Projects', icon: Briefcase, countKey: 'activeProjects' },
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
  ['/projects/new', 'New project'],
  ['/projects/', 'Project detail'],
  ['/projects', 'Projects'],
  ['/clients/new', 'Add client'],
  ['/clients', 'Clients'],
  ['/enquiries/new', 'New enquiry'],
  ['/enquiries', 'Enquiries'],
  ['/notifications', 'Notifications'],
  ['/vendors/new', 'Add vendor'],
  ['/vendors/', 'Vendor'],
  ['/vendors', 'Vendors'],
  ['/services', 'Services'],
  ['/team', 'Team'],
  ['/reports', 'Reports'],
  ['/settings', 'Settings'],
  ['/', 'Dashboard'],
];
