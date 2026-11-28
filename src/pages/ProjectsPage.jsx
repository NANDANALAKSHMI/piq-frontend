import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, Download, Plus, SearchX, TriangleAlert, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { ProjectGroup, ProjectRow } from '../features/projects/ProjectRow.jsx';
import { statusLabel } from '../features/projects/StatusMenu.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useServerSearch from '../hooks/useServerSearch.js';
import useLookups from '../hooks/useLookups.js';
import useServices from '../hooks/useServices.js';
import { displayStatus, isOverdue, projectProgress, serviceNames } from '../utils/projects.js';
import { cn, daysUntil } from '../utils/formatters.js';
import { exportCsv } from '../utils/exportCsv.js';

/** Status filter chips. Ongoing is the default (no `status` in the URL). */
const STATUS_TABS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'In progress', label: 'Ongoing', match: (p) => p.status === 'In progress' },
  { id: 'Upcoming', label: 'Upcoming', match: (p) => p.status === 'Upcoming' },
  { id: 'On hold', label: 'On hold', match: (p) => p.status === 'On hold' },
  { id: 'Overdue', label: 'Overdue', match: isOverdue },
  { id: 'Completed', label: 'Completed', match: (p) => p.status === 'Completed' },
  { id: 'Cancelled', label: 'Cancelled', match: (p) => p.status === 'Cancelled' },
];
const DEFAULT_TAB = 'In progress';

/** Groups, in display order: ongoing work first, finished and cancelled last. */
const GROUP_ORDER = ['In progress', 'Upcoming', 'On hold', 'Completed', 'Cancelled'];
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
const GROUP_PAGE = 10;

/** Within a group: High, Medium, Low priority, then the nearest due date first (no date last). */
function byPriorityThenDue(a, b) {
  const priority = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
  if (priority) return priority;
  return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

const DUE_FILTERS = [
  { value: '', label: 'Due: Any time' },
  { value: 'week', label: 'Due this week' },
  { value: 'month', label: 'Due in 30 days' },
  { value: 'past', label: 'Past due date' },
];

const EMPTY_FILTERS = { city: '', service: '', staff: '', due: '' };

export default function ProjectsPage() {
  const { projects, projectsLoading, projectsError, members, setProjectStatus } = useAppData();
  const { services } = useServices();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [toggled, setToggled] = useState({});
  const [shown, setShown] = useState({});
  const [savingId, setSavingId] = useState(null);

  const statusParam = searchParams.get('status');
  const activeTab = STATUS_TABS.some((t) => t.id === statusParam) ? statusParam : DEFAULT_TAB;

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === DEFAULT_TAB) next.delete('status');
    else next.set('status', id);
    setSearchParams(next, { replace: true });
  };

  /** Ongoing starts open; with a single-status filter its group is open too. Others start collapsed. */
  const isExpanded = (status) => toggled[`${activeTab}:${status}`] ?? (activeTab !== 'all' || status === 'In progress');
  const toggleGroup = (status) => setToggled((current) => ({ ...current, [`${activeTab}:${status}`]: !isExpanded(status) }));

  const changeStatus = async (project, status) => {
    setSavingId(project.id);
    try {
      await setProjectStatus(project.id, status);
      showToast(`${project.id} moved to ${statusLabel(status)}.`);
    } catch (err) {
      showToast(err.message || 'Could not change the status. Please try again.', { tone: 'error' });
    } finally {
      setSavingId(null);
    }
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

  const groups = GROUP_ORDER.map((status) => ({
    status,
    rows: tabRows.filter((p) => p.status === status).sort(byPriorityThenDue),
  })).filter((group) => group.rows.length);

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
    <div className="flex flex-col gap-5">
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

      <div role="group" aria-label="Filter by status" className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(tab.id)}
              className={cn(
                'hit-44 inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                active ? 'border-gold bg-gold text-on-gold' : 'border-panel-line bg-panel text-ink-soft hover:border-gold/60 hover:text-ink',
                FOCUS,
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-3.5">
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
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-line bg-brand-soft px-3 text-[13px] font-medium text-brand-ink hover:bg-brand-soft-hover"
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

      </Card>

      {projectsLoading ? (
        <div className="flex flex-col gap-3" aria-label="Loading projects">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="app-card h-24 animate-pulse rounded-xl border" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        projects.length === 0 ? (
          <EmptyState icon={Briefcase} title="No projects yet" description="Click “New project” to create the first one." />
        ) : (
          <EmptyState
            icon={SearchX}
            title="No projects match these filters"
            description="Try another status, a different search or clear the filters."
            action={<Button onClick={clearAll}>Clear filters</Button>}
          />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(({ status, rows }) => {
            const limit = shown[status] ?? GROUP_PAGE;
            return (
              <ProjectGroup key={status} status={status} expanded={isExpanded(status)} onToggle={() => toggleGroup(status)}>
                <ul className="divide-y divide-panel-line">
                  {rows.slice(0, limit).map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      lookups={lookups}
                      saving={savingId === project.id}
                      onStatusChange={changeStatus}
                    />
                  ))}
                </ul>
                {rows.length > limit && (
                  <button
                    type="button"
                    onClick={() => setShown((current) => ({ ...current, [status]: limit + GROUP_PAGE }))}
                    className={cn('min-h-11 w-full rounded-b-xl border-t border-panel-line text-[13px] font-semibold text-brand-ink hover:bg-row-hover', FOCUS, 'focus-visible:-outline-offset-2')}
                  >
                    Show {Math.min(GROUP_PAGE, rows.length - limit)} more of {rows.length - limit}
                  </button>
                )}
              </ProjectGroup>
            );
          })}
        </div>
      )}
    </div>
  );
}
