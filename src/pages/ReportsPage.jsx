import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, Download, FileText, Gauge, MessageSquareText, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Avatar from '../components/common/Avatar.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import HorizontalBars from '../components/dashboard/HorizontalBars.jsx';
import ChartTooltip from '../components/dashboard/ChartTooltip.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { units } from '../data/unitsData.js';
import { SERVICE_SCOPES } from '../data/constants.js';
import { lastMonthLabels, monthlyCompletedByUnit, savedReports, staffPerformance, unitPerformance } from '../data/reportsData.js';
import { displayStatus, isOverdue, stageProgress } from '../utils/jobs.js';
import { cn } from '../utils/formatters.js';
import { exportCsv } from '../utils/exportCsv.js';

const UNIT_COLORS = { blr: '#F28C28', kch: '#2563EB', chn: '#0F766E', hyd: '#9333EA' };
const PERIODS = [
  { value: '6', label: 'Last 6 months' },
  { value: '3', label: 'Last 3 months' },
];

export default function ReportsPage() {
  const { jobs, enquiries, vendors } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [months, setMonths] = useState('6');
  const [unitId, setUnitId] = useState('');

  const count = Number(months);
  const visibleUnits = unitId ? units.filter((u) => u.id === unitId) : units;
  const labels = lastMonthLabels(count);

  const chartData = labels.map((label, i) => {
    const index = 6 - count + i;
    return Object.fromEntries([['month', label], ...visibleUnits.map((u) => [u.id, monthlyCompletedByUnit[u.id][index]])]);
  });

  const totalCompleted = chartData.reduce((sum, row) => sum + visibleUnits.reduce((s, u) => s + row[u.id], 0), 0);
  const previousTotal = visibleUnits.reduce((sum, u) => sum + monthlyCompletedByUnit[u.id].slice(0, 6 - count).reduce((a, b) => a + b, 0), 0);
  const perf = unitPerformance.filter((p) => !unitId || p.unitId === unitId);
  const avg = (key) => (perf.reduce((sum, p) => sum + p[key], 0) / perf.length).toFixed(key === 'avgDays' ? 1 : 0);
  const scopedJobs = jobs.filter((j) => !unitId || j.unitId === unitId);
  const overdue = scopedJobs.filter(isOverdue).length;
  const decided = enquiries.filter((e) => ['Converted', 'Lost'].includes(e.status));
  const conversion = decided.length ? Math.round((decided.filter((e) => e.status === 'Converted').length / decided.length) * 100) : 0;

  const scopeItems = SERVICE_SCOPES.map((scope) => ({ label: scope, value: scopedJobs.filter((j) => j.scope === scope).length }));

  const unitRows = perf.map((p) => {
    const unitJobs = jobs.filter((j) => j.unitId === p.unitId);
    return {
      ...p,
      id: p.unitId,
      name: lookups.getUnit(p.unitId)?.name,
      completed: monthlyCompletedByUnit[p.unitId].slice(6 - count).reduce((a, b) => a + b, 0),
      ongoing: unitJobs.filter((j) => j.status === 'In progress').length,
      overdue: unitJobs.filter(isOverdue).length,
    };
  });

  const staffRows = staffPerformance
    .map((s) => ({ ...s, id: s.memberId, member: lookups.getMember(s.memberId), active: jobs.filter((j) => j.teamIds.includes(s.memberId) && j.status === 'In progress').length }))
    .filter((s) => !unitId || s.member?.unitId === unitId);

  const downloadReport = (report) => {
    const files = {
      r1: () => exportCsv('job-status-report.csv', [
        { header: 'Job ID', value: (j) => j.id },
        { header: 'Job', value: (j) => j.name },
        { header: 'Client', value: (j) => lookups.getClient(j.clientId)?.name },
        { header: 'Stage', value: (j) => stageProgress(j).currentName },
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
    exportCsv('unit-performance.csv', [
      { header: 'Unit', value: (u) => u.name },
      { header: 'Completed', value: (u) => u.completed },
      { header: 'Ongoing', value: (u) => u.ongoing },
      { header: 'Overdue', value: (u) => u.overdue },
      { header: 'On-time %', value: (u) => u.onTime },
      { header: 'Avg days', value: (u) => u.avgDays },
      { header: 'Utilisation %', value: (u) => u.utilisation },
    ], unitRows);
    showToast('Report exported.');
  };

  const growth = previousTotal ? Math.round(((totalCompleted - previousTotal) / previousTotal) * 100) : null;

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Reports"
        subtitle="How jobs, units, staff and enquiries are performing."
        actions={
          <>
            <SelectControl aria-label="Period" value={months} onChange={(e) => setMonths(e.target.value)} options={PERIODS} className="h-10.5 w-auto" />
            <SelectControl aria-label="Unit" value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="All units" options={units.map((u) => ({ value: u.id, label: u.name }))} className="h-10.5 w-auto" />
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
          <CardHeader title="Jobs completed per month" subtitle={unitId ? lookups.getUnit(unitId)?.name : 'Stacked by unit'} />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E3E8F0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#5B6476' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#5B6476' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F3F5F9' }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                {visibleUnits.map((u, i) => (
                  <Bar
                    key={u.id}
                    dataKey={u.id}
                    name={u.city}
                    stackId="units"
                    fill={UNIT_COLORS[u.id]}
                    maxBarSize={44}
                    radius={i === visibleUnits.length - 1 ? [6, 6, 0, 0] : 0}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Jobs by service scope" subtitle="All jobs in the selected unit(s)" />
          <HorizontalBars items={scopeItems} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Unit performance" />
        <DataTable
          rows={unitRows}
          minWidth={820}
          columns={[
            { key: 'name', header: 'Unit', sortable: true, render: (u) => <b>{u.name}</b> },
            { key: 'completed', header: 'Completed', sortable: true },
            { key: 'ongoing', header: 'Ongoing', sortable: true },
            { key: 'overdue', header: 'Overdue', sortable: true, render: (u) => <span className={cn(u.overdue > 0 && 'font-semibold text-red-700')}>{u.overdue}</span> },
            { key: 'onTime', header: 'On-time %', sortable: true, render: (u) => <span className={cn(u.onTime >= 90 && 'font-semibold text-green-700')}>{u.onTime}%</span> },
            { key: 'avgDays', header: 'Avg. duration', sortable: true, render: (u) => `${u.avgDays} d` },
            {
              key: 'utilisation',
              header: 'Staff utilisation',
              sortable: true,
              render: (u) => (
                <div className="flex items-center gap-2.5">
                  <ProgressBar value={u.utilisation} tone="auto" className="w-28" label={`${u.name} utilisation`} />
                  <span className="text-[13px] font-semibold">{u.utilisation}%</span>
                </div>
              ),
            },
          ]}
        />
      </Card>

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
          <CardHeader title="Saved reports" subtitle="Downloads use the unit filter above" />
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
