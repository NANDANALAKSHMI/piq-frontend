import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Briefcase, CalendarDays, CircleCheck, Clock, MessageSquareText, Plus, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Badge from '../components/common/Badge.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import StatusDonut from '../components/dashboard/StatusDonut.jsx';
import HorizontalBars from '../components/dashboard/HorizontalBars.jsx';
import RecentActivity from '../components/dashboard/RecentActivity.jsx';
import ChartTooltip from '../components/dashboard/ChartTooltip.jsx';
import { buildProjectColumns } from '../features/projects/projectColumns.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { isOverdue } from '../utils/projects.js';
import { cn, daysUntil, dueLabel, formatDate, formatToday } from '../utils/formatters.js';

const STATUS_COLORS = {
  'In progress': '#b99a60',
  Upcoming: '#2563EB',
  Completed: '#16A34A',
  'On hold': '#FCD34D',
  Cancelled: '#DC2626',
};

const PERIODS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function deadlineTone(days) {
  if (days < 0) return 'red';
  if (days <= 3) return 'orange';
  if (days <= 7) return 'amber';
  return 'slate';
}

export default function DashboardPage() {
  const { projects, projectsLoading, clients, enquiries } = useAppData();
  const { user } = useAuth();
  const lookups = useLookups();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('90');

  const stats = useMemo(() => {
    const count = (status) => projects.filter((p) => p.status === status).length;
    const openEnquiries = enquiries.filter((e) => !['Converted', 'Lost'].includes(e.status));
    const followUpsToday = enquiries.flatMap((e) => e.followUps).filter((f) => !f.done && daysUntil(f.date) === 0).length;
    return {
      clients: clients.length,
      locations: clients.reduce((sum, c) => sum + c.locations.length, 0),
      cities: new Set(clients.flatMap((c) => c.locations.map((l) => l.city))).size,
      ongoing: count('In progress'),
      dueThisWeek: projects.filter((p) => p.status === 'In progress' && p.dueDate && daysUntil(p.dueDate) >= 0 && daysUntil(p.dueDate) <= 7).length,
      upcoming: count('Upcoming'),
      completed: count('Completed'),
      completedRecently: projects.filter((p) => p.status === 'Completed' && p.completedOn && daysUntil(p.completedOn) >= -30).length,
      overdue: projects.filter(isOverdue).length,
      openEnquiries: openEnquiries.length,
      followUpsToday,
      statusData: Object.entries(STATUS_COLORS).map(([name, color]) => ({ name, value: count(name), color })),
    };
  }, [projects, clients, enquiries]);

  const periodProjects = useMemo(() => {
    if (period === 'all') return projects;
    return projects.filter((p) => !p.startDate || daysUntil(p.startDate) >= -Number(period));
  }, [projects, period]);

  /** The five busiest cities, then everything else as "Others". */
  const cityData = useMemo(() => {
    const counts = new Map();
    periodProjects.forEach((project) => {
      const city = lookups.projectCity(project);
      counts.set(city, (counts.get(city) ?? 0) + 1);
    });
    const sorted = [...counts.entries()].filter(([city]) => city !== '—').sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5).map(([city, value]) => ({ city, value }));
    const others = sorted.slice(5).reduce((sum, [, value]) => sum + value, 0) + (counts.get('—') ?? 0);
    return others ? [...top, { city: 'Others', value: others }] : top;
  }, [periodProjects, lookups]);

  /** Projects per service, most used first. */
  const serviceData = useMemo(() => {
    const counts = new Map();
    periodProjects.forEach((p) => p.services.forEach((s) => counts.set(s.name, (counts.get(s.name) ?? 0) + 1)));
    return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [periodProjects]);

  const recentProjects = useMemo(() => projects.filter((p) => p.status !== 'Cancelled').slice(0, 6), [projects]);

  const deadlines = useMemo(
    () =>
      projects
        .filter((p) => ['In progress', 'On hold', 'Upcoming'].includes(p.status) && p.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [projects],
  );

  /** Latest activity across every project. */
  const activity = useMemo(
    () =>
      projects
        .flatMap((p) => p.activity.map((item) => ({ ...item, projectId: p.id, projectName: p.name })))
        .sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))
        .slice(0, 8),
    [projects],
  );

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name.split(' ')[0]} — here’s where every project stands today.`}
        actions={
          <>
            <div className="hidden h-10.5 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 sm:flex">
              <CalendarDays className="size-4.5 text-muted" aria-hidden="true" />
              <span className="text-[13px] font-semibold">{formatToday()}</span>
            </div>
            <Button to="/enquiries/new" icon={MessageSquareText}>
              New enquiry
            </Button>
            <Button to="/projects/new" variant="primary" icon={Plus}>
              New project
            </Button>
          </>
        }
      />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total clients" value={stats.clients} helper={`${stats.locations} sites in ${stats.cities} cities`} icon={Users} tone="blue" />
        <StatCard label="Ongoing projects" value={stats.ongoing} helper={`${stats.dueThisWeek} due this week`} icon={Clock} tone="orange" />
        <StatCard label="Upcoming projects" value={stats.upcoming} helper="Not started yet" icon={CalendarDays} tone="sky" />
        <StatCard label="Completed" value={stats.completed} helper={`${stats.completedRecently} in last 30 days`} trend="up" icon={CircleCheck} tone="green" />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          helper={stats.overdue ? 'Needs attention' : 'All on track'}
          trend={stats.overdue ? 'down' : undefined}
          icon={AlertTriangle}
          tone="red"
          valueClassName={stats.overdue ? 'text-red-700' : ''}
        />
        <StatCard label="Open enquiries" value={stats.openEnquiries} helper={`${stats.followUpsToday} follow-ups today`} icon={MessageSquareText} tone="violet" />
      </section>

      <section className="grid grid-cols-1 gap-5.5 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Project status overview" subtitle="Click a status to see those projects" />
          <StatusDonut data={stats.statusData} total={projects.length} onSelect={(status) => navigate(`/projects?status=${encodeURIComponent(status)}`)} />
        </Card>

        <Card>
          <CardHeader
            title="Projects by location"
            action={<SelectControl aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={PERIODS} className="h-9 w-auto" />}
          />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ top: 16, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-slate-50)' }} />
                <Bar dataKey="value" name="Projects" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false}>
                  {cityData.map((entry) => (
                    <Cell key={entry.city} fill={entry.city === 'Others' ? 'var(--color-slate-300)' : '#b99a60'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Projects by service" subtitle={PERIODS.find((p) => p.value === period)?.label} action={<Button to="/reports" variant="ghost" size="sm" className="text-brand-ink">Reports</Button>} />
          {serviceData.length ? <HorizontalBars items={serviceData} /> : <p className="text-[13px] text-muted">No projects in this period.</p>}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Recent projects" action={<Link to="/projects" className="text-[13px] font-semibold text-brand-ink hover:underline">View all projects</Link>} />
          <DataTable
            columns={buildProjectColumns(lookups, ['id', 'name', 'progress', 'status', 'due'])}
            rows={recentProjects}
            onRowClick={(p) => navigate(`/projects/${p.id}`)}
            loading={projectsLoading}
            emptyState={<p className="text-[13px] text-muted">No projects yet.</p>}
            minWidth={640}
          />
        </Card>

        <Card>
          <CardHeader title="Upcoming deadlines" action={<Link to="/projects?sort=due" className="text-[13px] font-semibold text-brand-ink hover:underline">View all</Link>} />
          {deadlines.length === 0 && <p className="text-[13px] text-muted">No open projects with a due date.</p>}
          <ul className="flex flex-col">
            {deadlines.map((project) => {
              const days = daysUntil(project.dueDate);
              const late = isOverdue(project);
              return (
                <li key={project.id} className="border-b border-line last:border-0">
                  <Link to={`/projects/${project.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                    <span className={cn('grid size-9.5 shrink-0 place-items-center rounded-[10px]', late ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-ink')}>
                      {late ? <AlertTriangle className="size-4.5" aria-hidden="true" /> : <Briefcase className="size-4.5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{project.name}</span>
                      <span className="block truncate text-[12.5px] text-muted">
                        {lookups.getClient(project.clientId)?.name} · {formatDate(project.dueDate, { withYear: false })}
                      </span>
                    </span>
                    <Badge tone={deadlineTone(days)} dot={false}>
                      {dueLabel(project.dueDate)}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader title="Recent activity" />
          <RecentActivity items={activity} />
        </Card>
      </section>
    </div>
  );
}
