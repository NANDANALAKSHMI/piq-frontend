import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Download, Plus, SearchX, TriangleAlert, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Tabs from '../components/common/Tabs.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { buildProjectColumns } from '../features/projects/projectColumns.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServerSearch from '../hooks/useServerSearch.js';
import useLookups from '../hooks/useLookups.js';
import useServices from '../hooks/useServices.js';
import { displayStatus, isOverdue, projectProgress, serviceNames } from '../utils/projects.js';
import { daysUntil } from '../utils/formatters.js';
import { exportCsv } from '../utils/exportCsv.js';

const STATUS_TABS = [
  { id: 'all', label: 'All projects', match: () => true },
  { id: 'Upcoming', label: 'Upcoming', match: (p) => p.status === 'Upcoming' },
  { id: 'In progress', label: 'Ongoing', match: (p) => p.status === 'In progress' },
  { id: 'Completed', label: 'Completed', match: (p) => p.status === 'Completed' },
  { id: 'On hold', label: 'On hold', match: (p) => p.status === 'On hold' },
  { id: 'Overdue', label: 'Overdue', match: isOverdue },
  { id: 'Cancelled', label: 'Cancelled', match: (p) => p.status === 'Cancelled' },
];

const DUE_FILTERS = [
  { value: '', label: 'Due: Any time' },
  { value: 'week', label: 'Due this week' },
  { value: 'month', label: 'Due in 30 days' },
  { value: 'past', label: 'Past due date' },
];

const EMPTY_FILTERS = { city: '', service: '', staff: '', due: '' };

export default function ProjectsPage() {
  const { projects, projectsLoading, projectsError, members } = useAppData();
  const { services } = useServices();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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

  /** Only cities that projects are actually in. */
  const cityOptions = useMemo(
    () => [...new Set(projects.map((p) => lookups.projectCity(p)).filter((c) => c && c !== '—'))].sort((a, b) => a.localeCompare(b)),
    [projects, lookups],
  );

  const { filter: searchFilter } = useServerSearch('projects', query);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesLocally = (project) =>
      `${project.id} ${project.name} ${lookups.getClient(project.clientId)?.name} ${lookups.projectCity(project)}`.toLowerCase().includes(q);
    return searchFilter(projects, matchesLocally).filter((project) => {
      if (filters.city && lookups.projectCity(project) !== filters.city) return false;
      if (filters.service && !project.services.some((s) => s.serviceId === filters.service)) return false;
      if (filters.staff && !project.teamIds.includes(filters.staff)) return false;
      if (filters.due) {
        const days = daysUntil(project.dueDate);
        if (filters.due === 'week' && !(days >= 0 && days <= 7)) return false;
        if (filters.due === 'month' && !(days >= 0 && days <= 30)) return false;
        if (filters.due === 'past' && days >= 0) return false;
      }
      return true;
    });
  }, [projects, query, filters, lookups, searchFilter]);

  const tabs = STATUS_TABS.map((tab) => ({ ...tab, count: filtered.filter(tab.match).length }));
  const tabRows = filtered.filter(STATUS_TABS.find((t) => t.id === activeTab).match);

  const activeFilterChips = [
    filters.city && { key: 'city', label: `City: ${filters.city}` },
    filters.service && { key: 'service', label: `Service: ${services.find((s) => s.id === filters.service)?.name ?? '—'}` },
    filters.staff && { key: 'staff', label: `Staff: ${lookups.getMember(filters.staff)?.name}` },
    filters.due && { key: 'due', label: DUE_FILTERS.find((d) => d.value === filters.due)?.label },
  ].filter(Boolean);

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery('');
  };

  const handleExport = () => {
    exportCsv(
      'piq-projects.csv',
      [
        { header: 'Project ID', value: (p) => p.id },
        { header: 'Project', value: (p) => p.name },
        { header: 'Client', value: (p) => lookups.getClient(p.clientId)?.name },
        { header: 'City', value: (p) => lookups.projectCity(p) },
        { header: 'Services', value: serviceNames },
        { header: 'Progress', value: (p) => `${projectProgress(p).percent}%` },
        { header: 'Priority', value: (p) => p.priority },
        { header: 'Status', value: (p) => displayStatus(p) },
        { header: 'Start', value: (p) => p.startDate },
        { header: 'Due', value: (p) => p.dueDate },
      ],
      tabRows,
    );
    showToast(`Exported ${tabRows.length} projects to CSV.`);
  };

  return (
    <div className="flex h-full min-h-[34rem] flex-col gap-5.5">
      <PageHeader
        title="Projects"
        subtitle="Every project in one searchable list — from onboarding to delivery."
        actions={
          <>
            <Button icon={Download} onClick={handleExport} disabled={!tabRows.length}>
              Export
            </Button>
            <Button to="/projects/new" variant="primary" icon={Plus}>
              New project
            </Button>
          </>
        }
      />

      {projectsError && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="text-[13px]">
            <p className="font-semibold text-amber-900">Projects aren’t connected yet</p>
            <p className="mt-0.5 text-amber-800">{projectsError}</p>
          </div>
        </div>
      )}

      <Card padded={false} className="flex min-h-0 flex-1 flex-col">
        <Tabs tabs={tabs} active={activeTab} onChange={setTab} label="Project status" className="px-4" />

        <div className="flex flex-col gap-3.5 border-b border-line px-5 py-4.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <SearchInput value={query} onChange={setQuery} placeholder="Project name, ID or client" className="sm:col-span-2 lg:col-span-1" />
            <SelectControl aria-label="City" value={filters.city} onChange={(e) => setFilter('city', e.target.value)} placeholder="City: All" options={cityOptions} />
            <SelectControl aria-label="Service" value={filters.service} onChange={(e) => setFilter('service', e.target.value)} placeholder="Service: All" options={services.map((s) => ({ value: s.id, label: s.name }))} />
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
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-line bg-brand-soft px-3 text-[13px] font-medium text-brand-ink hover:bg-[#efe4cc]"
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

        <div className="flex min-h-0 flex-1 flex-col px-2 pb-4 pt-1 sm:px-4">
          <DataTable
            fill
            onRowClick={(p) => navigate(`/projects/${p.id}`)}
            key={activeTab}
            columns={buildProjectColumns(lookups, ['id', 'name', 'city', 'services', 'progress', 'team', 'priority', 'status', 'due', 'view'])}
            rows={tabRows}
            pageSize={10}
            loading={projectsLoading}
            minWidth={1260}
            initialSort={initialSort}
            emptyState={
              projects.length === 0 ? (
                <EmptyState icon={Briefcase} title="No projects yet" description="Click “New project” to create the first one." />
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="No projects match these filters"
                  description="Try a different search or clear the filters to see every project."
                  action={<Button onClick={clearAll}>Clear filters</Button>}
                />
              )
            }
          />
        </div>
      </Card>
    </div>
  );
}
