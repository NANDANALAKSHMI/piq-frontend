# PIQ — Packaging & Job Management (frontend)

Internal dashboard for managing clients, jobs, workflows, units, vendors and enquiries.
Built with **React 19 + Vite + Tailwind CSS v4**, React Router, Recharts and Lucide icons.
Everything runs on local dummy data — there is no backend yet.

## Run it

Requires **Node.js 20 or newer** (tested on 20.11). If you upgrade Node or switch machines, delete `node_modules` and run `npm install` again.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint     # ESLint (incl. React hooks rules)
```

**Demo login:** any team email from `src/data/teamData.js` (e.g. `anil@piq.in`) with any password of 6+ characters.

## What works

| Area | Features |
| --- | --- |
| Login | Validation, show/hide password, "keep me signed in", protected routes, sign out |
| Dashboard | Live stats, status donut (click a slice to filter jobs), jobs by city with period filter, service-scope bars, recent jobs, deadlines, unit workload, activity |
| Jobs | Status tabs, search, 6 filters with removable chips, sortable columns, pagination, CSV export, loading + empty states |
| Job detail | Workflow stepper, move to next stage, status/edit modals, per-service progress, media upload, comments with pinned key decisions, activity log |
| New job | Client + location picker, scope presets, service owners, vendor suggestions by category/unit, nearest-unit suggestion, validation |
| Clients | Search/filter list, profile, multiple locations (add location modal), job tabs, project history |
| Add client | Company, contact, repeatable locations with nearest unit, validation |
| Enquiries | Pipeline counters, filters, follow-ups (schedule / tick off), status changes, mark lost / reopen, convert to job |
| Units & Workforce | Unit finder (city + service + staff), unit cards, workforce table, add staff, availability toggling |
| Vendors | Six vendor categories, vendor list + profile, status changes, add vendor, raise PO |
| Setup | Categories & services, workflow template editor (reorder/add/remove stages), team & permissions, reports with CSV downloads, settings |

Changes are kept in React state, so they reset on page reload.

## Project structure

```
src/
├── components/
│   ├── common/      Button, Badge, Card, DataTable, Modal, Toast, Tabs, FormFields, Pagination…
│   ├── dashboard/   StatCard, StatusDonut, HorizontalBars, RecentActivity, ChartTooltip
│   └── layout/      DashboardLayout, Sidebar (desktop + drawer), Header, GlobalSearch, MobileTabBar
├── context/         AuthContext (session), AppDataContext (all editable records + actions)
├── data/            Dummy data: jobs, clients, enquiries, units, vendors, categories, workflows, team, reports
├── features/        Feature-specific pieces (jobs, clients, enquiries, vendors)
├── hooks/           useLookups, usePagination, useClickOutside, useSimulatedLoading
├── pages/           One file per route
├── routes/          AppRoutes (lazy-loaded pages + auth guard)
└── utils/           formatters, job helpers, CSV export
```

Dummy dates are generated relative to today (`daysFromToday`), so "due in 2 days" and "overdue" stay meaningful whenever you run it.

## Connecting a real backend later

Replace the initial `useState(...)` values and action functions in `src/context/AppDataContext.jsx`
with API calls — pages only talk to that context, so no page code needs to change.
