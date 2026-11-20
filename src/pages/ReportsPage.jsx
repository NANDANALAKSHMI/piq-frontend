import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, Download, FileText, Gauge, MessageSquareText, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Avatar from '../components/common/Avatar.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import HorizontalBars from '../components/dashboard/HorizontalBars.jsx';
import ChartTooltip from '../components/dashboard/ChartTooltip.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { lastMonths, savedReports } from '../data/reportsData.js';
import { displayStatus, isOverdue, projectProgress, serviceNames } from '../utils/projects.js';
import { cn } from '../utils/formatters.js';
import { exportCsv } from '../utils/exportCsv.js';

const PERIODS = [
  { value: '6', label: 'Last 6 months' },
  { value: '3', label: 'Last 3 months' },
  { value: '12', label: 'Last 12 months' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const monthOf = (iso) => (iso ? iso.slice(0, 7) : '');
const onTime = (p) => Boolean(p.completedOn && p.dueDate && p.completedOn <= p.dueDate);
const durationDays = (p) => (p.completedOn && p.startDate ? Math.max(0, Math.round((new Date(p.completedOn) - new Date(p.startDate)) / DAY_MS)) : null);
const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

export default function ReportsPage() {
  const { projects, enquiries, vendors, members } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [months, setMonths] = useState('6');

  const count = Number(months);
  const completed = useMemo(() => projects.filter((p) => p.status === 'Completed' && p.completedOn), [projects]);

  const period = lastMonths(count);
  const periodKeys = new Set(period.map((m) => m.key));
  const previousKeys = new Set(lastMonths(count, count).map((m) => m.key));
  const inPeriod = completed.filter((p) => periodKeys.has(monthOf(p.completedOn)));
  const previousTotal = completed.filter((p) => previousKeys.has(monthOf(p.completedOn))).length;

  const chartData = period.map((m) => ({ month: m.label, completed: completed.filter((p) => monthOf(p.completedOn) === m.key).length }));
  const growth = previousTotal ? Math.round(((inPeriod.length - previousTotal) / previousTotal) * 100) : null;

  const durations = inPeriod.map(durationDays).filter((d) => d !== null);
  const avgDuration = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '—';
  const overdue = projects.filter(isOverdue).length;
  const decided = enquiries.filter((e) => ['Converted', 'Lost'].includes(e.status));
  const conversion = pct(decided.filter((e) => e.status === 'Converted').length, decided.length);

  /** Projects per service, most used first. */
  const serviceItems = useMemo(() => {
    const counts = new Map();
    projects.forEach((p) => p.services.forEach((s) => counts.set(s.name, (counts.get(s.name) ?? 0) + 1)));
    return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [projects]);

  const thisMonth = lastMonths(1)[0].key;
  const staffRows = members
    .filter((m) => m.status === 'Active')
    .map((member) => {
      const mine = projects.filter((p) => p.teamIds.includes(member.id));
      const done = mine.filter((p) => p.status === 'Completed' && p.completedOn);
      return {
        id: member.id,
        member,
        active: mine.filter((p) => p.status === 'In progress').length,
        doneThisMonth: done.filter((p) => monthOf(p.completedOn) === thisMonth).length,
        onTime: done.length ? pct(done.filter(onTime).length, done.length) : null,
      };
    });

  const projectRows = [
    { header: 'Project ID', value: (p) => p.id },
    { header: 'Project', value: (p) => p.name },
    { header: 'Client', value: (p) => lookups.getClient(p.clientId)?.name },
    { header: 'Services', value: serviceNames },
    { header: 'Progress', value: (p) => `${projectProgress(p).percent}%` },
    { header: 'Status', value: (p) => displayStatus(p) },
    { header: 'Due', value: (p) => p.dueDate },
  ];

  const downloadReport = (report) => {
    const files = {
      r1: () => exportCsv('project-status-report.csv', projectRows, projects),
      r2: () => exportCsv('overdue-and-pending.csv', projectRows, projects.filter((p) => ['In progress', 'On hold', 'Upcoming'].includes(p.status))),
      r3: () =>
        exportCsv(
          'client-history.csv',
          [
            { header: 'Client', value: (p) => lookups.getClient(p.clientId)?.name },
            { header: 'Project ID', value: (p) => p.id },
            { header: 'Project', value: (p) => p.name },
            { header: 'Status', value: (p) => p.status },
          ],
          [...projects].sort((a, b) => (lookups.getClient(a.clientId)?.name ?? '').localeCompare(lookups.getClient(b.clientId)?.name ?? '')),
        ),
      r4: () =>
        exportCsv(
          'vendor-usage.csv',
          [
            { header: 'Vendor', value: (v) => v.name },
            { header: 'City', value: (v) => v.city },
            { header: 'Status', value: (v) => v.status },
            { header: 'Projects', value: (v) => projects.filter((p) => p.vendorIds.includes(v.id)).length },
          ],
          vendors,
        ),
      r5: () =>
        exportCsv(
          'enquiry-pipeline.csv',
          [
            { header: 'Enquiry', value: (e) => e.id },
            { header: 'Company', value: (e) => e.company },
            { header: 'City', value: (e) => e.city },
            { header: 'Source', value: (e) => e.source },
            { header: 'Status', value: (e) => e.status },
          ],
          enquiries,
        ),
    };
    files[report.id]();
    showToast(`${report.name} downloaded.`);
  };

  const exportSummary = () => {
    exportCsv('piq-projects-summary.csv', projectRows, projects);
    showToast('Report exported.');
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Reports"
        subtitle="How projects, staff and enquiries are performing."
        actions={
          <>
            <SelectControl aria-label="Period" value={months} onChange={(e) => setMonths(e.target.value)} options={PERIODS} className="h-10.5 w-auto" />
            <Button variant="primary" icon={Download} onClick={exportSummary} disabled={!projects.length}>
              Export
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard
          label="Projects completed"
          value={inPeriod.length}
          helper={growth !== null ? `${growth >= 0 ? '+' : ''}${growth}% vs previous period` : PERIODS.find((p) => p.value === months).label}
          trend={growth !== null ? (growth >= 0 ? 'up' : 'down') : undefined}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard label="On-time delivery" value={inPeriod.length ? `${pct(inPeriod.filter(onTime).length, inPeriod.length)}%` : '—'} helper="Completed by due date" icon={Gauge} tone="blue" />
        <StatCard label="Avg. project duration" value={avgDuration === '—' ? '—' : `${avgDuration} d`} helper="Start to completion" icon={Clock} tone="orange" />
        <StatCard label="Overdue now" value={overdue} helper={overdue ? 'Needs follow-up' : 'All on track'} trend={overdue ? 'down' : undefined} icon={AlertTriangle} tone="red" valueClassName={overdue ? 'text-red-700' : ''} />
        <StatCard label="Enquiry conversion" value={`${conversion}%`} helper={`${decided.length} decided enquiries`} icon={MessageSquareText} tone="violet" />
      </section>

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Projects completed per month" subtitle={PERIODS.find((p) => p.value === months).label} />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E8E2DA" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6E625B' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6E625B' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F6F4F1' }} />
                <Bar dataKey="completed" name="Completed" fill="#b99a60" maxBarSize={44} radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Projects by service" subtitle="All projects" />
          {serviceItems.length ? <HorizontalBars items={serviceItems} /> : <p className="text-[13px] text-muted">No projects yet.</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Staff workload" />
          <DataTable
            rows={staffRows}
            minWidth={560}
            emptyState={<p className="text-[13px] text-muted">No active team members yet.</p>}
            columns={[
              {
                key: 'member',
                header: 'Member',
                sortable: true,
                sortValue: (s) => s.member.name,
                render: (s) => (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.member.name} color={s.member.color} size="sm" />
                    <div>
                      <b>{s.member.name}</b>
                      <p className="text-[12.5px] text-muted">{s.member.title}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'active', header: 'Active projects', sortable: true },
              { key: 'doneThisMonth', header: 'Done this month', sortable: true },
              {
                key: 'onTime',
                header: 'On-time %',
                sortable: true,
                render: (s) =>
                  s.onTime === null ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <span className={cn('font-semibold', s.onTime >= 90 ? 'text-green-700' : s.onTime < 80 && 'text-red-700')}>{s.onTime}%</span>
                  ),
              },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Saved reports" subtitle="Download as CSV" />
          <ul className="flex flex-col">
            {savedReports.map((report) => (
              <li key={report.id} className="flex items-center gap-3 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0">
                <span className="grid size-9.5 shrink-0 place-items-center rounded-[10px] bg-blue-50 text-blue-700">
                  <FileText className="size-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{report.name}</p>
                  <p className="text-[12.5px] text-muted">
                    {report.description} · {report.schedule}
                  </p>
                </div>
                <Button size="sm" icon={Download} onClick={() => downloadReport(report)}>
                  CSV
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
