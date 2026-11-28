import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, Layers, MessageSquareText, Pencil, SearchX, Trash2 } from 'lucide-react';
import StickyPageHeader from '../components/common/StickyPageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Toggle from '../components/common/Toggle.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { buildProjectColumns } from '../features/projects/projectColumns.jsx';
import { ConfirmDeleteModal } from '../features/services/ServiceModals.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import useServices from '../hooks/useServices.js';
import { cn } from '../utils/formatters.js';
import { SERVICE_ROW, SERVICE_SURFACE } from '../features/services/serviceTone.js';

const FINISHED = ['Completed', 'Cancelled'];
/** Cards and list rows that read well on the dark theme (same look as the Services cards). */
const PANEL = SERVICE_SURFACE;
const ROW = cn(SERVICE_ROW, 'flex items-center gap-3 px-3.5 py-2.5');

/** One-line empty message, so an empty list doesn't take up a big box. */
function EmptyNote({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3.5 py-3 text-[13px] text-muted dark:border-white/10">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { services, loading, updateService, removeService } = useServices();
  const { projects } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  /** null | 'delete' */
  const [modal, setModal] = useState(null);

  const service = services.find((s) => s.id === serviceId);

  const ongoing = useMemo(
    () => projects.filter((p) => !FINISHED.includes(p.status) && p.services.some((s) => s.serviceId === serviceId)),
    [projects, serviceId],
  );
  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ongoing.filter((p) => `${p.id} ${p.name} ${p.status}`.toLowerCase().includes(q)) : ongoing;
  }, [ongoing, query]);

  const run = async (action) => {
    try {
      return (await action()) ?? true;
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      return false;
    }
  };

  if (loading) return <p className="py-10 text-center text-[13px] text-muted">Loading service…</p>;

  if (!service) {
    return (
      <EmptyState
        icon={Layers}
        title="Service not found"
        description="This service may have been removed."
        action={<Button to="/services" variant="primary">Back to services</Button>}
      />
    );
  }

  const remove = async () => {
    const name = service.name;
    const ok = await run(() => removeService(service.id));
    if (ok) {
      showToast(`${name} deleted.`);
      navigate('/services', { replace: true });
    }
    return ok;
  };

  return (
    <div className="flex flex-col gap-5">
      <StickyPageHeader
        icon={Layers}
        title={service.name}
        subtitle={service.description || undefined}
        titleAddon={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line py-1 pl-1.5 pr-2.5 text-xs font-semibold dark:border-white/[0.08]">
            <Toggle size="sm" checked={service.active} label={`${service.name} active`} onChange={(active) => run(() => updateService(service.id, { active }))} />
            <span className={service.active ? 'text-green-700' : 'text-muted'}>{service.active ? 'Active' : 'Inactive'}</span>
          </label>
        }
        breadcrumbs={[{ label: 'Services', to: '/services' }, { label: service.name }]}
        actions={
          <>
            <Button size="sm" variant="danger" icon={Trash2} onClick={() => setModal('delete')}>
              Delete
            </Button>
            <Button size="sm" variant="primary" icon={Pencil} to={`/services/${service.id}/edit`}>
              Edit service
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className={PANEL}>
          <CardHeader title={`Sub-services (${service.subServices.length})`} subtitle="Switch one off to stop it being picked for new projects." />
          {service.subServices.length ? (
            <ul className="flex flex-col gap-2">
              {service.subServices.map((sub) => (
                <li key={sub.id} className={ROW}>
                  <span className={cn('size-2 shrink-0 rounded-full', sub.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20')} aria-hidden="true" />
                  <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', !sub.active && 'text-muted line-through')}>{sub.name}</span>
                  <Toggle
                    size="sm"
                    checked={sub.active}
                    label={`${sub.name} active`}
                    onChange={(active) =>
                      run(() => updateService(service.id, { subServices: service.subServices.map((x) => (x.id === sub.id ? { ...x, active } : x)) }))
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote icon={Layers}>No sub-services yet — add them from “Edit service”.</EmptyNote>
          )}
        </Card>

        <Card className={PANEL}>
          <CardHeader title={`Questions (${service.questions.length})`} subtitle="Asked when this service is added to a project." />
          {service.questions.length ? (
            <ol className="flex flex-col gap-2">
              {service.questions.map((q, index) => (
                <li key={q.id} className={cn(ROW, 'items-start')}>
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-soft text-[11px] font-bold text-brand-ink">{index + 1}</span>
                  <span className="min-w-0 break-words pt-0.5 text-sm">{q.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyNote icon={MessageSquareText}>No questions — optional, add them from “Edit service”.</EmptyNote>
          )}
        </Card>
      </div>

      <Card className={PANEL}>
        <CardHeader
          title={`Ongoing projects (${ongoing.length})`}
          subtitle="Projects using this service that aren’t completed or cancelled."
          action={
            ongoing.length > 0 && (
              <SearchInput value={query} onChange={setQuery} placeholder="Search by project ID, name or status" className="w-full sm:w-72 dark:border-white/[0.08] dark:bg-white/[0.03]" />
            )
          }
        />
        <DataTable
          key={`${service.id}-${query}`}
          onRowClick={(p) => navigate(`/projects/${p.id}`)}
          columns={buildProjectColumns(lookups, ['id', 'projectName', 'services', 'progress', 'status', 'due'])}
          rows={visibleProjects}
          pageSize={8}
          minWidth={760}
          emptyState={
            ongoing.length ? (
              <EmptyState icon={SearchX} title="No match" description="Try another project ID, name or status." />
            ) : (
              <EmptyState icon={Briefcase} title="No ongoing projects use this service" />
            )
          }
        />
      </Card>

      {modal === 'delete' && <ConfirmDeleteModal service={service} onClose={() => setModal(null)} onConfirm={remove} />}
    </div>
  );
}
