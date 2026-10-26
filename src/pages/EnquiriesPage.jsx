import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarPlus, Check, MessageSquareText, Phone, Plus, RefreshCw, SearchX } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import DataTable, { CellStack } from '../components/common/DataTable.jsx';
import { StatusBadge, Tag } from '../components/common/Badge.jsx';
import { Chip } from '../components/common/Tabs.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { ConvertModal, FollowUpModal, NewEnquiryModal } from '../features/enquiries/EnquiryModals.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { CITIES, ENQUIRY_STATUSES, SERVICES } from '../data/constants.js';
import { cn, daysUntil, formatDate } from '../utils/formatters.js';

const PIPELINE = [
  { status: 'New', helper: 'Not contacted' },
  { status: 'Follow-up', helper: 'Calls & visits' },
  { status: 'Quotation sent', helper: 'Awaiting reply' },
  { status: 'Negotiation', helper: 'Closing soon' },
  { status: 'Converted', helper: 'Became jobs' },
];

function nextFollowUp(enquiry) {
  return [...enquiry.followUps].filter((f) => !f.done).sort((a, b) => a.date.localeCompare(b.date))[0];
}

function followUpLabel(followUp) {
  if (!followUp) return null;
  const days = daysUntil(followUp.date);
  if (days === 0) return `Today, ${followUp.time}`;
  if (days === 1) return `Tomorrow, ${followUp.time}`;
  if (days < 0) return `Overdue · ${formatDate(followUp.date, { withYear: false })}`;
  return formatDate(followUp.date, { withYear: false });
}

export default function EnquiriesPage() {
  const { enquiries, addEnquiry, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('open');
  const [city, setCity] = useState('');
  const [modal, setModal] = useState(searchParams.get('new') ? 'new' : null);

  const selectedId = searchParams.get('selected');
  const selected = enquiries.find((e) => e.id === selectedId) ?? enquiries.find((e) => !['Converted', 'Lost'].includes(e.status)) ?? enquiries[0];

  const select = (id) => {
    setSearchParams({ selected: id }, { replace: true });
    if (window.innerWidth < 1280) window.setTimeout(() => document.getElementById('enquiry-detail')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (q && !`${e.id} ${e.company} ${e.contactName} ${e.phone}`.toLowerCase().includes(q)) return false;
      if (status === 'open' && ['Converted', 'Lost'].includes(e.status)) return false;
      if (status !== 'open' && status !== 'all' && e.status !== status) return false;
      if (city && e.city !== city) return false;
      return true;
    });
  }, [enquiries, query, status, city]);

  const counts = Object.fromEntries(ENQUIRY_STATUSES.map((s) => [s, enquiries.filter((e) => e.status === s).length]));
  const decided = counts.Converted + counts.Lost;
  const winRate = decided ? Math.round((counts.Converted / decided) * 100) : 0;
  const dueToday = enquiries.flatMap((e) => e.followUps).filter((f) => !f.done && daysUntil(f.date) <= 0).length;

  const closeModal = () => {
    setModal(null);
    if (searchParams.get('new')) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  };

  const columns = [
    { key: 'id', header: 'Enquiry', sortable: true, render: (e) => <CellStack primary={<span className="text-brand-ink">{e.id}</span>} secondary={e.company} /> },
    { key: 'contactName', header: 'Contact', sortable: true, render: (e) => <CellStack primary={e.contactName} secondary={e.phone} /> },
    { key: 'city', header: 'City', sortable: true },
    { key: 'services', header: 'Service required', render: (e) => <Tag>{e.scope === 'Custom' ? e.services.join(' + ') : e.scope}</Tag> },
    {
      key: 'followUp',
      header: 'Next follow-up',
      sortable: true,
      sortValue: (e) => nextFollowUp(e)?.date ?? '9999',
      render: (e) => {
        const f = nextFollowUp(e);
        if (!f) return <span className="text-muted">Not scheduled</span>;
        const days = daysUntil(f.date);
        return <span className={cn(days <= 0 && 'font-semibold', days < 0 ? 'text-red-700' : days === 0 && 'text-brand-ink')}>{followUpLabel(f)}</span>;
      },
    },
    { key: 'status', header: 'Status', sortable: true, render: (e) => <StatusBadge value={e.status} /> },
    {
      key: 'open',
      header: <span className="sr-only">Open</span>,
      render: (e) => (
        <button type="button" onClick={() => select(e.id)} className="text-[13px] font-semibold text-brand-ink hover:underline">
          View
        </button>
      ),
    },
  ];

  const closed = selected && ['Converted', 'Lost'].includes(selected.status);

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Enquiries"
        subtitle="Capture leads before they become jobs. Convert in one click — nothing is re-typed."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setModal('new')}>
            New enquiry
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5" aria-label="Pipeline">
        {PIPELINE.map((stage) => (
          <button
            key={stage.status}
            type="button"
            onClick={() => setStatus(status === stage.status ? 'open' : stage.status)}
            aria-pressed={status === stage.status}
            className={cn(
              'flex flex-col items-start gap-1 rounded-2xl border bg-white p-4 text-left transition-colors hover:border-slate-300',
              status === stage.status ? 'border-2 border-brand' : 'border-line',
            )}
          >
            <span className="text-[13px] text-muted">{stage.status}</span>
            <span className="text-[26px] font-bold leading-tight">{counts[stage.status]}</span>
            <StatusBadge value={stage.status} dot={false} className="!font-medium" />
            <span className="sr-only">{stage.helper}</span>
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card padded={false}>
          <div className="flex flex-wrap items-center gap-2.5 p-4">
            <SearchInput value={query} onChange={setQuery} placeholder="Name, company or phone" className="min-w-52 flex-1" />
            <SelectControl
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[{ value: 'open', label: 'Status: Open' }, { value: 'all', label: 'Status: All' }, ...ENQUIRY_STATUSES]}
              className="w-auto"
            />
            <SelectControl aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City: All" options={CITIES} className="w-auto" />
          </div>
          <p className="px-4 pb-2 text-[13px] text-muted">
            <b className="text-ink">{dueToday}</b> follow-ups due today or overdue · <b className="text-ink">{winRate}%</b> win rate
          </p>
          <div className="px-2 pb-4 sm:px-4">
            <DataTable
              columns={columns}
              rows={rows}
              pageSize={6}
              minWidth={820}
              rowClassName={(e) => e.id === selected?.id && 'bg-brand-soft/60 hover:bg-brand-soft/60'}
              emptyState={<EmptyState icon={SearchX} title="No enquiries match" description="Change the filters or add a new enquiry." />}
            />
          </div>
        </Card>

        {selected && (
          <Card id="enquiry-detail" className="scroll-mt-24 self-start">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-muted">
                  {selected.id} · received {formatDate(selected.receivedOn, { withYear: false })} · {selected.source}
                </p>
                <h2 className="mt-0.5 text-[19px] font-semibold">{selected.company}</h2>
              </div>
              <StatusBadge value={selected.status} />
            </div>
            <div className="my-4 h-px bg-line" />
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-muted">Contact</dt>
                <dd className="font-medium">{selected.contactName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd>
                  <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-medium hover:text-brand-ink">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {selected.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Location</dt>
                <dd className="font-medium">{selected.location}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Assigned to</dt>
                <dd className="font-medium">{lookups.getMember(selected.assignedTo)?.name ?? 'Unassigned'}</dd>
              </div>
            </dl>

            <p className="mb-2 mt-4 text-xs text-muted">Services required</p>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((service) => (
                <Chip key={service} active={selected.services.includes(service)} className="pointer-events-none">
                  {service}
                </Chip>
              ))}
            </div>

            <p className="mb-1 mt-4 text-xs text-muted">Project notes</p>
            <p>{selected.notes || '—'}</p>

            {!closed && (
              <div className="mt-4 flex flex-col gap-1.5">
                <label htmlFor="enquiry-status" className="text-xs font-semibold text-muted">
                  Status
                </label>
                <SelectControl
                  id="enquiry-status"
                  value={selected.status}
                  onChange={(e) => {
                    updateEnquiry(selected.id, { status: e.target.value });
                    showToast(`${selected.id} moved to ${e.target.value}.`);
                  }}
                  options={ENQUIRY_STATUSES.filter((s) => s !== 'Converted')}
                />
              </div>
            )}

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <b>Follow-ups</b>
                {!closed && (
                  <button type="button" onClick={() => setModal('followup')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink hover:underline">
                    <CalendarPlus className="size-3.5" aria-hidden="true" /> Schedule
                  </button>
                )}
              </div>
              {selected.followUps.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted">No follow-ups yet.</p>
              ) : (
                <ul className="mt-1.5 flex flex-col">
                  {selected.followUps.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                      <button
                        type="button"
                        onClick={() => toggleFollowUp(selected.id, f.id)}
                        aria-pressed={f.done}
                        aria-label={f.done ? 'Mark as not done' : 'Mark as done'}
                        className={cn(
                          'grid size-7 shrink-0 place-items-center rounded-lg border transition-colors',
                          f.done ? 'border-green-700 bg-green-700 text-white' : 'border-slate-300 bg-white text-transparent hover:text-slate-400',
                        )}
                      >
                        <Check className="size-4" aria-hidden="true" />
                      </button>
                      <div className="min-w-0">
                        <p className={cn('text-[13px] font-semibold', f.done && 'text-muted line-through')}>{f.title}</p>
                        <p className="text-xs text-muted">
                          {formatDate(f.date, { withYear: false })}, {f.time} · {lookups.getMember(f.ownerId)?.name}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {closed ? (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-slate-50 p-3.5 text-[13px]">
                <MessageSquareText className="size-4 text-muted" aria-hidden="true" />
                {selected.status === 'Converted' ? 'This enquiry has been converted into a job.' : 'This enquiry was marked as lost.'}
                {selected.status === 'Lost' && (
                  <button
                    type="button"
                    onClick={() => updateEnquiry(selected.id, { status: 'Follow-up' })}
                    className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-ink hover:underline"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" /> Reopen
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3.5 text-[13px] text-green-900">
                  Converting carries over client, contact, location, services and notes. You just pick a workflow and unit.
                </div>
                <div className="mt-3.5 flex gap-2.5">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      updateEnquiry(selected.id, { status: 'Lost' });
                      showToast(`${selected.id} marked as lost.`, { tone: 'info' });
                    }}
                  >
                    Mark as lost
                  </Button>
                  <Button variant="primary" className="flex-[2]" iconRight={ArrowRight} onClick={() => setModal('convert')}>
                    Convert to job
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </div>

      <NewEnquiryModal
        open={modal === 'new'}
        onClose={closeModal}
        onSave={(draft) => {
          const id = addEnquiry(draft);
          closeModal();
          setStatus('open');
          select(id);
          showToast(`${id} recorded.`);
        }}
      />
      {modal === 'followup' && selected && (
        <FollowUpModal
          open
          enquiry={selected}
          onClose={() => setModal(null)}
          onSave={(followUp) => {
            addFollowUp(selected.id, followUp);
            setModal(null);
            showToast('Follow-up scheduled.');
          }}
        />
      )}
      {modal === 'convert' && selected && (
        <ConvertModal
          open
          enquiry={selected}
          onClose={() => setModal(null)}
          onConvert={(options) => {
            const jobId = convertEnquiry(selected, options);
            setModal(null);
            showToast(`${selected.id} converted into ${jobId}.`);
            navigate(`/jobs/${jobId}`);
          }}
        />
      )}
    </div>
  );
}
