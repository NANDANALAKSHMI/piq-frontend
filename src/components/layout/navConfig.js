import {
  Briefcase,
  ChartColumn,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Truck,
  Users,
  Workflow,
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
      { to: '/units', label: 'Units & Workforce', icon: MapPin },
      { to: '/vendors', label: 'Vendors', icon: Truck },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    items: [
      { to: '/categories', label: 'Categories & Services', icon: Tag },
      { to: '/workflows', label: 'Workflow Templates', icon: Workflow },
      { to: '/team', label: 'Team & Access', icon: ShieldCheck },
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
  ['/enquiries', 'Enquiries'],
  ['/units', 'Units & Workforce'],
  ['/vendors', 'Vendors'],
  ['/categories', 'Categories & Services'],
  ['/workflows', 'Workflow Templates'],
  ['/team', 'Team & Access'],
  ['/reports', 'Reports'],
  ['/settings', 'Settings'],
  ['/', 'Dashboard'],
];
