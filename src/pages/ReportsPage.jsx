import { useState } from 'react';
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
import { SERVICE_SCOPES } from '../data/constants.js';
import { lastMonthLabels, monthlyCompletedByUnit, savedReports, staffPerformance, unitPerformance } from '../data/reportsData.js';
import { displayStatus, isOverdue, jobProgress } from '../utils/jobs.js';
import { cn } from '../utils/formatters.js';
import { exportCsv } from '../utils/exportCsv.js';

/** Monthly completed jobs, combined into one series. */
const MONTHLY_COMPLETED = Object.values(monthlyCompletedByUnit).reduce(
  (totals, series) => totals.map((value, i) => value + series[i]),
  Array(6).fill(0),
);
const PERIODS = [
  { value: '6', label: 'Last 6 months' },
  { value: '3', label: 'Last 3 months' },
];

export default function ReportsPage() {
  const { jobs, enquiries, vendors } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [months, setMonths] = useState('6');

  const count = Number(months);
  const labels = lastMonthLabels(count);

  const chartData = labels.map((label, i) => ({ month: label, completed: MONTHLY_COMPLETED[6 - count + i] }));

  const totalCompleted = chartData.reduce((sum, row) => sum + row.completed, 0);
  const previousTotal = MONTHLY_COMPLETED.slice(0, 6 - count).reduce((a, b) => a + b, 0);
  const avg = (key) => (unitPerformance.reduce((sum, p) => sum + p[key], 0) / unitPerformance.length).toFixed(key === 'avgDays' ? 1 : 0);
  const scopedJobs = jobs;
  const overdue = scopedJobs.filter(isOverdue).length;
  const decided = enquiries.filter((e) => ['Converted', 'Lost'].includes(e.status));
  const conversion = decided.length ? Math.round((decided.filter((e) => e.status === 'Converted').length / decided.length) * 100) : 0;

  const scopeItems = SERVICE_SCOPES.map((scope) => ({ label: scope, value: scopedJobs.filter((j) => j.scope === scope).length }));

  const staffRows = staffPerformance
    .map((s) => ({ ...s, id: s.memberId, member: lookups.getMember(s.memberId), active: jobs.filter((j) => j.teamIds.includes(s.memberId) && j.status === 'In progress').length }));

  const downloadReport = (report) => {
    const files = {
      r1: () => exportCsv('job-status-report.csv', [
        { header: 'Job ID', value: (j) => j.id },
        { header: 'Job', value: (j) => j.name },
        { header: 'Client', value: (j) => lookups.getClient(j.clientId)?.name },
        { header: 'Progress', value: (j) => `${jobProgress(j).percent}%` },
        { header: 'Status', value: (j) => displayStatus(j) },
        { header: 'Due', value: (j) => j.dueDate },
      ], scopedJobs),
      r2: () => exportCsv('overdue-and-pending.csv', [
        { header: 'Job ID', value: (j) => j.id },
        { header: 'Job', value: (j) => j.name },
        { header: 'Status', value: (j) => displayStatus(j) },
        { header: 'Due', value: (j) => j.dueDate },
      ], scopedJobs.filter((j) => ['In progress', 'On hold', 'Upcoming'].includes(j.status))),
      r3: () => exportCsv('client-history.csv', [
        { header: 'Client', value: (j) => lookups.getClient(j.clientId)?.name },
        { header: 'Job ID', value: (j) => j.id },
        { header: 'Job', value: (j) => j.name },
        { header: 'Status', value: (j) => j.status },
      ], [...scopedJobs].sort((a, b) => a.clientId.localeCompare(b.clientId))),
      r4: () => exportCsv('vendor-usage.csv', [
        { header: 'Vendor', value: (v) => v.name },
        { header: 'City', value: (v) => v.city },
        { header: 'Status', value: (v) => v.status },
        { header: 'Jobs used', value: (v) => v.jobsUsed },
      ], vendors),
      r5: () => exportCsv('enquiry-pipeline.csv', [
        { header: 'Enquiry', value: (e) => e.id },
        { header: 'Company', value: (e) => e.company },
        { header: 'City', value: (e) => e.city },
        { header: 'Source', value: (e) => e.source },
        { header: 'Status', value: (e) => e.status },
      ], enquiries),
    };
    files[report.id]();
    showToast(`${report.name} downloaded.`);
  };

  const exportSummary = () => {
    exportCsv('piq-jobs-summary.csv', [
      { header: 'Job ID', value: (j) => j.id },
      { header: 'Job', value: (j) => j.name },
      { header: 'Client', value: (j) => lookups.getClient(j.clientId)?.name },
      { header: 'Scope', value: (j) => j.scope },
      { header: 'Progress', value: (j) => `${jobProgress(j).percent}%` },
      { header: 'Status', value: (j) => displayStatus(j) },
      { header: 'Due', value: (j) => j.dueDate },
    ], jobs);
    showToast('Report exported.');
  };

  const growth = previousTotal ? Math.round(((totalCompleted - previousTotal) / previousTotal) * 100) : null;

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Reports"
        subtitle="How jobs, staff and enquiries are performing."
        actions={
          <>
            <SelectControl aria-label="Period" value={months} onChange={(e) => setMonths(e.target.value)} options={PERIODS} className="h-10.5 w-auto" />
            <Button variant="primary" icon={Download} onClick={exportSummary}>
              Export
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard label="Jobs completed" value={totalCompleted} helper={growth !== null ? `${growth >= 0 ? '+' : ''}${growth}% vs previous period` : PERIODS.find((p) => p.value === months).label} trend={growth !== null ? (growth >= 0 ? 'up' : 'down') : undefined} icon={CheckCircle2} tone="green" />
        <StatCard label="On-time delivery" value={`${avg('onTime')}%`} helper="Delivered by due date" icon={Gauge} tone="blue" />
        <StatCard label="Avg. job duration" value={`${avg('avgDays')} d`} helper="Start to delivery" icon={Clock} tone="orange" />
        <StatCard label="Overdue now" value={overdue} helper={overdue ? 'Needs follow-up' : 'All on track'} trend={overdue ? 'down' : undefined} icon={AlertTriangle} tone="red" valueClassName={overdue ? 'text-red-700' : ''} />
        <StatCard label="Enquiry conversion" value={`${conversion}%`} helper={`${decided.length} decided enquiries`} icon={MessageSquareText} tone="violet" />
      </section>

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Jobs completed per month" subtitle="All jobs" />
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
          <CardHeader title="Jobs by service scope" subtitle="All jobs" />
          <HorizontalBars items={scopeItems} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Staff workload" />
          <DataTable
            rows={staffRows}
            minWidth={560}
            columns={[
              {
                key: 'member',
                header: 'Member',
                sortable: true,
                sortValue: (s) => s.member?.name,
                render: (s) => (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.member?.name} color={s.member?.color} size="sm" />
                    <div>
                      <b>{s.member?.name}</b>
                      <p className="text-[12.5px] text-muted">{s.member?.title}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'active', header: 'Active jobs', sortable: true },
              { key: 'doneThisMonth', header: 'Done this month', sortable: true },
              { key: 'onTime', header: 'On-time %', sortable: true, render: (s) => <span className={cn('font-semibold', s.onTime >= 90 ? 'text-green-700' : s.onTime < 80 && 'text-red-700')}>{s.onTime}%</span> },
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
