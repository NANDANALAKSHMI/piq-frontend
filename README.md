# PIQ — Packaging & Job Management (frontend)

Internal dashboard for managing clients, jobs, workflows, units, vendors and enquiries.
Built with **React 19 + Vite + Tailwind CSS v4**, React Router, Recharts and Lucide icons.
Most screens run on local dummy data. Sign-in (Google via Firebase) and team invitations are real:
invited people are stored in Firestore and emailed from the Snap Infinity mailbox by a Vercel function.

## Run it

Requires **Node.js 20 or newer** (tested on 20.11). If you upgrade Node or switch machines, delete `node_modules` and run `npm install` again.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint     # ESLint (incl. React hooks rules)
```

**Demo login:** any team email from `src/data/teamData.js` (e.g. `anil@piq.in`) with any password of 6+ characters.

**Google sign-in:** admins listed in `VITE_ADMIN_EMAILS`, plus anyone an admin has invited from the Team page.

After pulling these changes run `npm install` once — the invitation email needs `nodemailer` and `jose`.

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
| Setup | Categories & services, workflow template editor (reorder/add/remove stages), team invitations by email, reports with CSV downloads, settings |

Changes are kept in React state, so they reset on page reload.

## Project structure

```
api/                 Vercel serverless functions (send-invite.js + _lib/ email template, token check)
src/
├── components/
│   ├── common/      Button, Badge, Card, DataTable, Modal, Toast, Tabs, FormFields, Pagination…
│   ├── dashboard/   StatCard, StatusDonut, HorizontalBars, RecentActivity, ChartTooltip
│   └── layout/      DashboardLayout, Sidebar (desktop + drawer), Header, GlobalSearch, MobileTabBar
├── context/         AuthContext (session), AppDataContext (all editable records + actions)
├── data/            Dummy data: jobs, clients, enquiries, units, vendors, categories, workflows, team, reports
├── features/        Feature-specific pieces (jobs, clients, enquiries, vendors)
├── hooks/           useLookups, usePagination, useClickOutside, useSimulatedLoading
├── lib/             firebase.js (Auth + Firestore), members.js (team invitations)
├── pages/           One file per route
├── routes/          AppRoutes (lazy-loaded pages + auth guard)
└── utils/           formatters, job helpers, CSV export
```

Dummy dates are generated relative to today (`daysFromToday`), so "due in 2 days" and "overdue" stay meaningful whenever you run it.

## Connecting a real backend later

Replace the initial `useState(...)` values and action functions in `src/context/AppDataContext.jsx`
with API calls — pages only talk to that context, so no page code needs to change.

## Team invitations

An admin opens **Team → Invite member**. The person is saved in Firestore (`members` collection,
status *Invited*) and gets a Box Theory–branded email from the Snap Infinity Gmail with an
**Accept invitation** button. That link opens `/login?invite=their@email`, they choose
**Continue with Google**, and their first sign-in turns them *Active*. Switching someone off on the
Team page blocks their sign-in, and a pending invitation can be cancelled. Replies to the email go
to the admin who sent it.

There is one role: everyone you invite gets full access, so they can invite people and manage the team
too. The admins in `VITE_ADMIN_EMAILS` are the owners and can't be switched off in the app.

When you sign in with Google, the Team page and the job owner pickers show the **real team**: admins
from `VITE_ADMIN_EMAILS` plus everyone in Firestore.
The dummy team in `src/data/teamData.js` is only used by the demo password login (and to show names on
the sample jobs, which are still dummy data).

One-time setup:

1. **Firestore** — Firebase console → *piq-dashboard* → Build → Firestore Database → Create database
   (production mode, e.g. `asia-south1`).
2. **Rules** — paste `firestore.rules` into Firestore → Rules → Publish (again whenever the file changes)
   (or `npx firebase-tools deploy --only firestore:rules`). Its admin list must match `VITE_ADMIN_EMAILS`.
3. **Gmail App Password** — sign in to the Snap Infinity Gmail → Google Account → Security →
   turn on 2-Step Verification → *App passwords* → create one called "Box Theory invites".
4. **Env vars** — put `SMTP_USER` / `SMTP_PASS` in `.env.local` (restart `npm run dev`), and add the
   same two in Vercel → Settings → Environment Variables (plus `APP_URL` if you use a custom domain).
   The function reuses the `VITE_FIREBASE_PROJECT_ID` and `VITE_ADMIN_EMAILS` values already there.
5. **Authorised domains** — the production domain must be listed in Firebase → Authentication →
   Settings → Authorised domains (already needed for Google sign-in).

`npm run dev` serves `/api/send-invite` locally (see `vite.config.js`), so invitations work in
development too. Gmail allows roughly 500 emails a day from one account.
