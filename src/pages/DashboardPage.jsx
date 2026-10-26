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
import ProgressBar from '../components/common/ProgressBar.jsx';
import { Tag } from '../components/common/Badge.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import StatusDonut from '../components/dashboard/StatusDonut.jsx';
import HorizontalBars from '../components/dashboard/HorizontalBars.jsx';
import RecentActivity from '../components/dashboard/RecentActivity.jsx';
import ChartTooltip from '../components/dashboard/ChartTooltip.jsx';
import { buildJobColumns } from '../features/jobs/jobColumns.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useLookups from '../hooks/useLookups.js';
import useSimulatedLoading from '../hooks/useSimulatedLoading.js';
import { recentActivities } from '../data/activityData.js';
import { units, workforce } from '../data/unitsData.js';
import { CITIES, SERVICE_SCOPES } from '../data/constants.js';
import { isOverdue } from '../utils/jobs.js';
import { cn, daysUntil, dueLabel, formatDate, formatToday, percent } from '../utils/formatters.js';

const STATUS_COLORS = {
  'In progress': '#F28C28',
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
  const { jobs, clients, enquiries } = useAppData();
  const { user } = useAuth();
  const lookups = useLookups();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('90');
  const loading = useSimulatedLoading('dashboard');

  const stats = useMemo(() => {
    const count = (status) => jobs.filter((j) => j.status === status).length;
    const openEnquiries = enquiries.filter((e) => !['Converted', 'Lost'].includes(e.status));
    const followUpsToday = enquiries.flatMap((e) => e.followUps).filter((f) => !f.done && daysUntil(f.date) === 0).length;
    return {
      clients: clients.length,
      locations: clients.reduce((sum, c) => sum + c.locations.length, 0),
      cities: new Set(clients.flatMap((c) => c.locations.map((l) => l.city))).size,
      ongoing: count('In progress'),
      dueThisWeek: jobs.filter((j) => j.status === 'In progress' && daysUntil(j.dueDate) >= 0 && daysUntil(j.dueDate) <= 7).length,
      upcoming: count('Upcoming'),
      completed: count('Completed'),
      completedRecently: jobs.filter((j) => j.status === 'Completed' && daysUntil(j.dueDate) >= -30).length,
      overdue: jobs.filter(isOverdue).length,
      openEnquiries: openEnquiries.length,
      followUpsToday,
      statusData: Object.entries(STATUS_COLORS).map(([name, color]) => ({ name, value: count(name), color })),
    };
  }, [jobs, clients, enquiries]);

  const periodJobs = useMemo(() => {
    if (period === 'all') return jobs;
    return jobs.filter((j) => daysUntil(j.startDate) >= -Number(period));
  }, [jobs, period]);

  const cityData = useMemo(() => {
    const counts = Object.fromEntries([...CITIES, 'Others'].map((city) => [city, 0]));
    periodJobs.forEach((job) => {
      const city = lookups.jobCity(job);
      counts[CITIES.includes(city) ? city : 'Others'] += 1;
    });
    return Object.entries(counts).map(([city, value]) => ({ city, value }));
  }, [periodJobs, lookups]);

  const scopeData = useMemo(
    () => SERVICE_SCOPES.map((scope) => ({ label: scope, value: periodJobs.filter((j) => j.scope === scope).length })),
    [periodJobs],
  );

  const recentJobs = useMemo(() => jobs.filter((j) => j.status !== 'Cancelled').slice(0, 6), [jobs]);

  const deadlines = useMemo(
    () =>
      jobs
        .filter((j) => ['In progress', 'On hold', 'Upcoming'].includes(j.status))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [jobs],
  );

  const workload = useMemo(
    () =>
      units.map((unit) => {
        const staff = workforce.filter((w) => w.unitId === unit.id);
        const busy = staff.filter((w) => w.availability === 'On job').length;
        return {
          ...unit,
          activeJobs: jobs.filter((j) => j.unitId === unit.id && ['In progress', 'On hold'].includes(j.status)).length,
          staffTotal: staff.length,
          busy,
          utilisation: percent(busy, staff.length),
        };
      }),
    [jobs],
  );

  const activity = recentActivities.map((a) => ({ ...a, actorName: lookups.getMember(a.actorId)?.name ?? 'Someone' }));

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name.split(' ')[0]} — here’s where every job stands today.`}
        actions={
          <>
            <div className="hidden h-10.5 items-center gap-2.5 rounded-[10px] border border-line bg-white px-3.5 sm:flex">
              <CalendarDays className="size-4.5 text-muted" aria-hidden="true" />
              <span className="text-[13px] font-semibold">{formatToday()}</span>
            </div>
            <Button to="/enquiries?new=1" icon={MessageSquareText}>
              New enquiry
            </Button>
            <Button to="/jobs/new" variant="primary" icon={Plus}>
              New job
            </Button>
          </>
        }
      />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total clients" value={stats.clients} helper={`${stats.locations} sites in ${stats.cities} cities`} icon={Users} tone="blue" />
        <StatCard label="Ongoing jobs" value={stats.ongoing} helper={`${stats.dueThisWeek} due this week`} icon={Clock} tone="orange" />
        <StatCard label="Upcoming jobs" value={stats.upcoming} helper="Not started yet" icon={CalendarDays} tone="sky" />
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
          <CardHeader title="Job status overview" subtitle="Click a status to see those jobs" />
          <StatusDonut data={stats.statusData} total={jobs.length} onSelect={(status) => navigate(`/jobs?status=${encodeURIComponent(status)}`)} />
        </Card>

        <Card>
          <CardHeader
            title="Jobs by location"
            action={<SelectControl aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={PERIODS} className="h-9 w-auto" />}
          />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ top: 16, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E3E8F0" />
                <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#5B6476' }} interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#5B6476' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F3F5F9' }} />
                <Bar dataKey="value" name="Jobs" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false}>
                  {cityData.map((entry) => (
                    <Cell key={entry.city} fill={entry.city === 'Others' ? '#CBD3DF' : '#F28C28'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Jobs by service scope" subtitle={PERIODS.find((p) => p.value === period)?.label} action={<Button to="/reports" variant="ghost" size="sm" className="text-brand-ink">Reports</Button>} />
          <HorizontalBars items={scopeData} />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Recent jobs" action={<Link to="/jobs" className="text-[13px] font-semibold text-brand-ink hover:underline">View all jobs</Link>} />
          <DataTable
            columns={buildJobColumns(lookups, ['id', 'name', 'stage', 'status', 'due'])}
            rows={recentJobs}
            loading={loading}
            minWidth={640}
          />
        </Card>

        <Card>
          <CardHeader title="Upcoming deadlines" action={<Link to="/jobs?sort=due" className="text-[13px] font-semibold text-brand-ink hover:underline">View all</Link>} />
          <ul className="flex flex-col">
            {deadlines.map((job) => {
              const days = daysUntil(job.dueDate);
              const late = isOverdue(job);
              return (
                <li key={job.id} className="border-b border-line last:border-0">
                  <Link to={`/jobs/${job.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                    <span className={cn('grid size-9.5 shrink-0 place-items-center rounded-[10px]', late ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-ink')}>
                      {late ? <AlertTriangle className="size-4.5" aria-hidden="true" /> : <Briefcase className="size-4.5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{job.name}</span>
                      <span className="block truncate text-[12.5px] text-muted">
                        {lookups.getClient(job.clientId)?.name} · {formatDate(job.dueDate, { withYear: false })}
                      </span>
                    </span>
                    <Badge tone={deadlineTone(days)} dot={false}>
                      {dueLabel(job.dueDate)}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Unit workload" action={<Link to="/units" className="text-[13px] font-semibold text-brand-ink hover:underline">Units &amp; workforce</Link>} />
          <DataTable
            minWidth={640}
            rows={workload}
            columns={[
              { key: 'name', header: 'Unit', sortable: true, render: (u) => <div><p className="font-semibold">{u.name}</p><p className="text-[12.5px] text-muted">{u.state}</p></div> },
              { key: 'activeJobs', header: 'Active jobs', sortable: true },
              { key: 'busy', header: 'Staff busy', sortable: true, render: (u) => `${u.busy} of ${u.staffTotal}` },
              {
                key: 'utilisation',
                header: 'Capacity used',
                sortable: true,
                render: (u) => (
                  <div className="flex items-center gap-2.5">
                    <ProgressBar value={u.utilisation} tone="auto" className="w-28" label={`${u.name} capacity`} />
                    <span className={cn('text-[13px] font-semibold', u.utilisation >= 85 && 'text-red-700', u.utilisation <= 45 && 'text-green-700')}>{u.utilisation}%</span>
                  </div>
                ),
              },
              { key: 'services', header: 'Services', render: (u) => <div className="flex gap-1.5">{u.services.slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)}</div> },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Recent activity" />
          <RecentActivity items={activity} />
        </Card>
      </section>
    </div>
  );
}
