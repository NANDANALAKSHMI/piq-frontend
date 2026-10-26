import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus, SearchX, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Tabs from '../components/common/Tabs.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { buildJobColumns } from '../features/jobs/jobColumns.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import useSimulatedLoading from '../hooks/useSimulatedLoading.js';
import { units } from '../data/unitsData.js';
import { jobCategories } from '../data/categoriesData.js';
import { CITIES, SERVICE_SCOPES } from '../data/constants.js';
import { displayStatus, isOverdue, stageProgress } from '../utils/jobs.js';
import { daysUntil } from '../utils/formatters.js';
import { exportCsv } from '../utils/exportCsv.js';

const STATUS_TABS = [
  { id: 'all', label: 'All jobs', match: () => true },
  { id: 'Upcoming', label: 'Upcoming', match: (j) => j.status === 'Upcoming' },
  { id: 'In progress', label: 'Ongoing', match: (j) => j.status === 'In progress' },
  { id: 'Completed', label: 'Completed', match: (j) => j.status === 'Completed' },
  { id: 'On hold', label: 'On hold', match: (j) => j.status === 'On hold' },
  { id: 'Overdue', label: 'Overdue', match: isOverdue },
  { id: 'Cancelled', label: 'Cancelled', match: (j) => j.status === 'Cancelled' },
];

const DUE_FILTERS = [
  { value: '', label: 'Due: Any time' },
  { value: 'week', label: 'Due this week' },
  { value: 'month', label: 'Due in 30 days' },
  { value: 'past', label: 'Past due date' },
];

const EMPTY_FILTERS = { city: '', unit: '', category: '', scope: '', staff: '', due: '' };

export default function JobsPage() {
  const { jobs, members } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const statusParam = searchParams.get('status');
  const activeTab = STATUS_TABS.some((t) => t.id === statusParam) ? statusParam : 'all';
  const initialSort = searchParams.get('sort') === 'due' ? { key: 'due', direction: 'asc' } : { key: 'id', direction: 'desc' };

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('status');
    else next.set('status', id);
    setSearchParams(next, { replace: true });
  };

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (q) {
        const haystack = `${job.id} ${job.name} ${lookups.getClient(job.clientId)?.name} ${lookups.jobCity(job)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.city && lookups.jobCity(job) !== filters.city) return false;
      if (filters.unit && job.unitId !== filters.unit) return false;
      if (filters.category && job.categoryId !== filters.category) return false;
      if (filters.scope && job.scope !== filters.scope) return false;
      if (filters.staff && !job.teamIds.includes(filters.staff)) return false;
      if (filters.due) {
        const days = daysUntil(job.dueDate);
        if (filters.due === 'week' && !(days >= 0 && days <= 7)) return false;
        if (filters.due === 'month' && !(days >= 0 && days <= 30)) return false;
        if (filters.due === 'past' && days >= 0) return false;
      }
      return true;
    });
  }, [jobs, query, filters, lookups]);

  const tabs = STATUS_TABS.map((tab) => ({ ...tab, count: filtered.filter(tab.match).length }));
  const tabRows = filtered.filter(STATUS_TABS.find((t) => t.id === activeTab).match);
  const loading = useSimulatedLoading(JSON.stringify([activeTab, filters]), 350);

  const activeFilterChips = [
    filters.city && { key: 'city', label: `City: ${filters.city}` },
    filters.unit && { key: 'unit', label: `Unit: ${lookups.getUnit(filters.unit)?.name}` },
    filters.category && { key: 'category', label: `Category: ${lookups.getCategory(filters.category)?.name}` },
    filters.scope && { key: 'scope', label: `Scope: ${filters.scope}` },
    filters.staff && { key: 'staff', label: `Staff: ${lookups.getMember(filters.staff)?.name}` },
    filters.due && { key: 'due', label: DUE_FILTERS.find((d) => d.value === filters.due)?.label },
  ].filter(Boolean);

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery('');
  };

  const handleExport = () => {
    exportCsv(
      'piq-jobs.csv',
      [
        { header: 'Job ID', value: (j) => j.id },
        { header: 'Job', value: (j) => j.name },
        { header: 'Client', value: (j) => lookups.getClient(j.clientId)?.name },
        { header: 'City', value: (j) => lookups.jobCity(j) },
        { header: 'Unit', value: (j) => lookups.getUnit(j.unitId)?.name },
        { header: 'Scope', value: (j) => j.scope },
        { header: 'Stage', value: (j) => stageProgress(j).currentName },
        { header: 'Priority', value: (j) => j.priority },
        { header: 'Status', value: (j) => displayStatus(j) },
        { header: 'Start', value: (j) => j.startDate },
        { header: 'Due', value: (j) => j.dueDate },
      ],
      tabRows,
    );
    showToast(`Exported ${tabRows.length} jobs to CSV.`);
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Jobs"
        subtitle="Every company job in one searchable list — from onboarding to delivery."
        actions={
          <>
            <Button icon={Download} onClick={handleExport} disabled={!tabRows.length}>
              Export
            </Button>
            <Button to="/jobs/new" variant="primary" icon={Plus}>
              New job
            </Button>
          </>
        }
      />

      <Card padded={false}>
        <Tabs tabs={tabs} active={activeTab} onChange={setTab} label="Job status" className="px-4" />

        <div className="flex flex-col gap-3.5 border-b border-line px-5 py-4.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            <SearchInput value={query} onChange={setQuery} placeholder="Job name, ID or client" className="sm:col-span-2 lg:col-span-1 2xl:col-span-1" />
            <SelectControl aria-label="City" value={filters.city} onChange={(e) => setFilter('city', e.target.value)} placeholder="City: All" options={CITIES} />
            <SelectControl aria-label="Unit" value={filters.unit} onChange={(e) => setFilter('unit', e.target.value)} placeholder="Unit: All" options={units.map((u) => ({ value: u.id, label: u.name }))} />
            <SelectControl aria-label="Category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)} placeholder="Category: All" options={jobCategories.map((c) => ({ value: c.id, label: c.name }))} />
            <SelectControl aria-label="Service scope" value={filters.scope} onChange={(e) => setFilter('scope', e.target.value)} placeholder="Scope: All" options={SERVICE_SCOPES} />
            <SelectControl aria-label="Assigned staff" value={filters.staff} onChange={(e) => setFilter('staff', e.target.value)} placeholder="Staff: Anyone" options={members.map((m) => ({ value: m.id, label: m.name }))} />
            <SelectControl aria-label="Due date" value={filters.due} onChange={(e) => setFilter('due', e.target.value)} options={DUE_FILTERS} />
          </div>
          {(activeFilterChips.length > 0 || query) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted">Active filters:</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilter(chip.key, '')}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-line bg-brand-soft px-3 text-[13px] font-medium text-brand-ink hover:bg-[#fde3c8]"
                >
                  {chip.label}
                  <X className="size-3.5" aria-label="Remove filter" />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="text-[13px] font-semibold text-brand-ink hover:underline">
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="px-2 pb-4 pt-1 sm:px-4">
          <DataTable
            key={activeTab}
            columns={buildJobColumns(lookups, ['id', 'name', 'category', 'unit', 'scope', 'stage', 'team', 'priority', 'status', 'due'])}
            rows={tabRows}
            pageSize={8}
            loading={loading}
            minWidth={1120}
            initialSort={initialSort}
            emptyState={
              <EmptyState
                icon={SearchX}
                title="No jobs match these filters"
                description="Try a different search or clear the filters to see every job."
                action={<Button onClick={clearAll}>Clear filters</Button>}
              />
            }
          />
        </div>
      </Card>
    </div>
  );
}
