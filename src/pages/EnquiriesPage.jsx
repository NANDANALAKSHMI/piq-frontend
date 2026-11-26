import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarPlus, Check, Eye, Mail, MessageSquareText, Phone, Plus, RefreshCw, SearchX, TriangleAlert } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Modal from '../components/common/Modal.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import { SelectControl } from '../components/common/FormFields.jsx';
import DataTable, { CellStack } from '../components/common/DataTable.jsx';
import { StatusBadge, Tag } from '../components/common/Badge.jsx';
import { Chip } from '../components/common/Tabs.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { ConvertModal, FollowUpModal } from '../features/enquiries/EnquiryModals.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import useServerSearch from '../hooks/useServerSearch.js';
import useServices from '../hooks/useServices.js';
import { ENQUIRY_STATUSES } from '../data/constants.js';
import { cn, daysUntil, formatDate } from '../utils/formatters.js';

const PIPELINE = [
  { status: 'New', helper: 'Not contacted' },
  { status: 'Follow-up', helper: 'Calls & visits' },
  { status: 'Quotation sent', helper: 'Awaiting reply' },
  { status: 'Negotiation', helper: 'Closing soon' },
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
  const { enquiries, enquiriesLoading, enquiriesError, updateEnquiry, addFollowUp, toggleFollowUp, convertEnquiry } = useAppData();
  const lookups = useLookups();
  const { services } = useServices();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('open');
  const [city, setCity] = useState('');
  const [modal, setModal] = useState(null);

  /** Saves a change to Firestore; toasts `message` when it worked and the error when it didn't. */
  const save = async (action, message, tone) => {
    try {
      await action();
      if (message) showToast(message, tone ? { tone } : undefined);
      return true;
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      return false;
    }
  };

  /** Cities that actually have enquiries, so new cities show up in the filter. */
  const cityOptions = useMemo(() => [...new Set(enquiries.map((e) => e.city).filter(Boolean))].sort(), [enquiries]);

  const selectedId = searchParams.get('selected');
  /** The details popup only opens when someone clicks View (or lands here from a saved enquiry). */
  const selected = enquiries.find((e) => e.id === selectedId);
  const closeDetails = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  const select = (id) => {
    setSearchParams({ selected: id }, { replace: true });
  };

  const { filter: searchFilter } = useServerSearch('enquiries', query);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesLocally = (e) => `${e.id} ${e.company} ${e.contactName} ${e.phone}`.toLowerCase().includes(q);
    return searchFilter(enquiries, matchesLocally).filter((e) => {
      if (status === 'open' && ['Converted', 'Lost'].includes(e.status)) return false;
      if (status !== 'open' && status !== 'all' && e.status !== status) return false;
      if (city && e.city !== city) return false;
      return true;
    });
  }, [enquiries, query, status, city, searchFilter]);


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
        <Button size="sm" variant={e.id === selectedId ? 'dark' : 'secondary'} icon={Eye} onClick={() => select(e.id)} aria-label={`View ${e.id}`}>
          View
        </Button>
      ),
    },
  ];

  const closed = selected && ['Converted', 'Lost'].includes(selected.status);

  return (
    <div className="flex h-full min-h-160 flex-col gap-5.5">
      <PageHeader
        title="Enquiries"
        subtitle="Capture leads before they become projects. Convert in one click — nothing is re-typed."
        actions={
          <Button variant="primary" icon={Plus} to="/enquiries/new">
            New enquiry
          </Button>
        }
      />

      {enquiriesError && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="text-[13px]">
            <p className="font-semibold text-amber-900">Enquiries aren’t connected yet</p>
            <p className="mt-0.5 text-amber-800">{enquiriesError}</p>
          </div>
        </div>
      )}

      <section className="grid shrink-0 grid-cols-2 gap-4 md:grid-cols-4" aria-label="Pipeline">
        {PIPELINE.map((stage) => (
          <button
            key={stage.status}
            type="button"
            onClick={() => setStatus(status === stage.status ? 'open' : stage.status)}
            aria-pressed={status === stage.status}
            className={cn(
              'flex flex-col items-start gap-1 rounded-2xl border bg-surface p-4 text-left transition-colors hover:border-slate-300',
              status === stage.status ? 'border-2 border-brand' : 'border-line',
            )}
          >
            <span className="text-[13px] text-muted">{stage.status}</span>
            <StatusBadge value={stage.status} dot={false} className="!font-medium" />
            <span className="sr-only">{stage.helper}</span>
          </button>
        ))}
      </section>

      <Card padded={false} className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 p-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Name, company or phone" className="w-full sm:w-80" />
          <SelectControl
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: 'open', label: 'Status: Open' }, { value: 'all', label: 'Status: All' }, ...ENQUIRY_STATUSES]}
            className="w-auto"
          />
          <SelectControl aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City: All" options={cityOptions} className="w-auto" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-2 pb-4 sm:px-4">
          <DataTable
            fill
            onRowClick={(e) => select(e.id)}
            columns={columns}
            rows={rows}
            pageSize={8}
            loading={enquiriesLoading}
            minWidth={820}
            rowClassName={(e) => e.id === selected?.id && 'bg-brand-soft/60 hover:bg-brand-soft/60'}
            emptyState={
              enquiries.length === 0 ? (
                <EmptyState icon={MessageSquareText} title="No enquiries yet" description="Click “New enquiry” to record your first lead." />
              ) : (
                <EmptyState icon={SearchX} title="No enquiries match" description="Change the filters or add a new enquiry." />
              )
            }
          />
        </div>
      </Card>

      {/* Hidden while the follow-up or convert popup is open, so only one popup shows at a time. */}
      {selected && !modal && (
        <Modal
          open
          onClose={closeDetails}
          size="lg"
          title={selected.company}
          description={`${selected.id} · received ${formatDate(selected.receivedOn)}`}
          footer={
            closed ? (
              <>
                {selected.status === 'Lost' && (
                  <Button icon={RefreshCw} onClick={() => save(() => updateEnquiry(selected.id, { status: 'Follow-up' }), `${selected.id} reopened.`)}>
                    Reopen
                  </Button>
                )}
                <Button onClick={closeDetails}>Close</Button>
              </>
            ) : (
              <>
                <Button onClick={() => save(() => updateEnquiry(selected.id, { status: 'Lost' }), `${selected.id} marked as lost.`, 'info')}>Mark as lost</Button>
                <Button variant="primary" iconRight={ArrowRight} onClick={() => setModal('convert')}>
                  Convert to project
                </Button>
              </>
            )
          }
        >
          <div className="mb-4 flex items-center gap-2.5">
            <StatusBadge value={selected.status} />
            {closed && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                <MessageSquareText className="size-4" aria-hidden="true" />
                {selected.status === 'Converted' ? 'Converted into a project.' : 'Marked as lost.'}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
            <div className="col-span-2">
              <dt className="text-xs text-muted">Email</dt>
              <dd>
                {selected.email ? (
                  <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 break-all font-medium hover:text-brand-ink">
                    <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                    {selected.email}
                  </a>
                ) : (
                  <span className="font-medium">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">State</dt>
              <dd className="font-medium">{selected.state || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">City</dt>
              <dd className="font-medium">{selected.city || '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted">Area / address</dt>
              <dd className="font-medium">{selected.location || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Source</dt>
              <dd className="font-medium">{selected.source || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Received on</dt>
              <dd className="font-medium">{formatDate(selected.receivedOn)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Assigned to</dt>
              <dd className="font-medium">{lookups.getMember(selected.assignedTo)?.name ?? 'Unassigned'}</dd>
            </div>
          </dl>

          <p className="mb-2 mt-4 text-xs text-muted">Services required</p>
          <div className="flex flex-wrap gap-2">
            {selected.services.map((service) => (
              <Chip key={service} active className="pointer-events-none">
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
                  const next = e.target.value;
                  save(() => updateEnquiry(selected.id, { status: next }), `${selected.id} moved to ${next}.`);
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
                      onClick={() => save(() => toggleFollowUp(selected.id, f.id))}
                      aria-pressed={f.done}
                      aria-label={f.done ? 'Mark as not done' : 'Mark as done'}
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-lg border transition-colors',
                        f.done ? 'border-green-700 bg-green-700 text-white' : 'border-slate-300 bg-surface text-transparent hover:text-slate-400',
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
        </Modal>
      )}

      {modal === 'followup' && selected && (
        <FollowUpModal
          open
          enquiry={selected}
          onClose={() => setModal(null)}
          onSave={async (followUp) => {
            if (await save(() => addFollowUp(selected.id, followUp), 'Follow-up scheduled.')) setModal(null);
          }}
        />
      )}
      {modal === 'convert' && selected && (
        <ConvertModal
          open
          enquiry={selected}
          onClose={() => setModal(null)}
          onConvert={async (options) => {
            try {
              const projectId = await convertEnquiry(selected, { ...options, services });
              setModal(null);
              showToast(`${selected.id} converted into ${projectId}.`);
              navigate(`/projects/${projectId}`);
            } catch (err) {
              showToast(err.message, { tone: 'error' });
            }
          }}
        />
      )}
    </div>
  );
}
