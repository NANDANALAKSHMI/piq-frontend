import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Phone, Plus, Search, SearchX, UserPlus } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Badge, { StatusBadge, Tag } from '../components/common/Badge.jsx';
import Avatar from '../components/common/Avatar.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import DataTable from '../components/common/DataTable.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import Modal from '../components/common/Modal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { SelectControl, SelectField, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useLookups from '../hooks/useLookups.js';
import { units, workforce as initialWorkforce } from '../data/unitsData.js';
import { CITIES } from '../data/constants.js';
import { rankUnitsForCity } from '../features/jobs/jobFormHelpers.js';
import { cn, percent } from '../utils/formatters.js';

const AVAILABILITY_TONE = { Free: 'green', 'On job': 'blue', 'On leave': 'amber' };
const UNIT_SERVICES = ['Design', 'Production', 'Packing', 'Crating', 'Delivery'];
const ROLES = ['Unit manager', 'Packaging designer', 'Packing supervisor', 'Logistics coordinator', 'Helper'];

function AddStaffModal({ open, defaultUnitId, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', role: 'Helper', unitId: defaultUnitId, phone: '', skills: '' });
  const [error, setError] = useState('');
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      availability: 'Free',
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add staff or helper"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Add to unit
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" required value={form.name} onChange={update('name')} error={error} className="sm:col-span-2" />
        <SelectField label="Role" value={form.role} onChange={update('role')} options={ROLES} />
        <SelectField label="Unit" value={form.unitId} onChange={update('unitId')} options={units.map((u) => ({ value: u.id, label: u.name }))} />
        <TextField label="Phone" type="tel" value={form.phone} onChange={update('phone')} />
        <TextField label="Skills" value={form.skills} onChange={update('skills')} placeholder="Packing, Loading" hint="Separate with commas" />
      </div>
    </Modal>
  );
}

export default function UnitsPage() {
  const { jobs } = useAppData();
  const lookups = useLookups();
  const { showToast } = useToast();
  const [workforce, setWorkforce] = useState(initialWorkforce);
  const [selectedUnitId, setSelectedUnitId] = useState(units[0].id);
  const [finder, setFinder] = useState({ city: 'Kochi', service: 'Packing', staff: '2' });
  const [finderResults, setFinderResults] = useState(null);
  const [staffQuery, setStaffQuery] = useState('');
  const [availability, setAvailability] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const unitStats = useMemo(
    () =>
      units.map((unit) => {
        const staff = workforce.filter((w) => w.unitId === unit.id);
        const busy = staff.filter((w) => w.availability !== 'Free').length;
        return {
          ...unit,
          staff,
          busy,
          free: staff.length - busy,
          utilisation: percent(busy, staff.length),
          activeJobs: jobs.filter((j) => j.unitId === unit.id && ['In progress', 'On hold'].includes(j.status)).length,
        };
      }),
    [workforce, jobs],
  );

  const runFinder = (event) => {
    event.preventDefault();
    const needed = Number(finder.staff) || 1;
    const ranked = rankUnitsForCity(finder.city).map((unit) => {
      const stats = unitStats.find((u) => u.id === unit.id);
      const offers = unit.services.includes(finder.service);
      const enoughStaff = stats.free >= needed;
      let match = 'Partial';
      if (offers && enoughStaff) match = 'Best match';
      if (!offers) match = 'No service';
      return { ...unit, free: stats.free, staffTotal: stats.staff.length, offers, enoughStaff, match };
    });
    const best = ranked.findIndex((u) => u.match === 'Best match');
    setFinderResults(ranked.map((u, i) => ({ ...u, match: u.match === 'Best match' && i !== best ? 'Good' : u.match })).slice(0, 3));
  };

  const selected = unitStats.find((u) => u.id === selectedUnitId);
  const staffRows = selected.staff.filter((w) => {
    if (availability && w.availability !== availability) return false;
    const q = staffQuery.trim().toLowerCase();
    return !q || `${w.name} ${w.role} ${w.skills.join(' ')}`.toLowerCase().includes(q);
  });

  const currentJobFor = (person) =>
    person.availability === 'On job'
      ? jobs.find((j) => j.unitId === person.unitId && j.status === 'In progress' && j.teamIds.some((id) => lookups.getMember(id)?.name === person.name)) ??
        jobs.find((j) => j.unitId === person.unitId && j.status === 'In progress')
      : null;

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Units & Workforce"
        subtitle={`${units.length} units · ${workforce.length} staff & helpers across ${units.map((u) => u.city).join(', ')}.`}
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setAddOpen(true)}>
            Add staff
          </Button>
        }
      />

      <Card className="border-navy bg-navy text-white">
        <h2 className="text-base font-semibold">Find a suitable unit</h2>
        <p className="mt-0.5 text-[13px] text-navy-muted">Match a job to the nearest unit with the right service and free workforce.</p>
        <form onSubmit={runFinder} className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_140px_auto]">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#c9d2e3]">
            Job city
            <SelectControl value={finder.city} onChange={(e) => setFinder({ ...finder, city: e.target.value })} options={[...CITIES, 'Hosur']} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#c9d2e3]">
            Service required
            <SelectControl value={finder.service} onChange={(e) => setFinder({ ...finder, service: e.target.value })} options={UNIT_SERVICES} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#c9d2e3]">
            Staff needed
            <input
              type="number"
              min="1"
              value={finder.staff}
              onChange={(e) => setFinder({ ...finder, staff: e.target.value })}
              className="h-10 rounded-[10px] border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
            />
          </label>
          <Button type="submit" variant="primary" icon={Search}>
            Find units
          </Button>
        </form>
        {finderResults && (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {finderResults.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitId(unit.id)}
                className={cn('rounded-xl bg-navy-2 p-3.5 text-left transition-colors hover:bg-navy-3', unit.match === 'Best match' && 'ring-[1.5px] ring-brand')}
              >
                <span className="flex items-center justify-between gap-2">
                  <b>{unit.name}</b>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', unit.match === 'Best match' ? 'bg-brand text-navy' : 'bg-navy-3 text-white')}>
                    {unit.match}
                  </span>
                </span>
                <span className="mt-1.5 block text-[13px] text-[#c9d2e3]">
                  {unit.distance} km · {finder.service} {unit.offers ? '✓' : '✗'} · {unit.free} of {unit.staffTotal} staff free
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <section className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 2xl:grid-cols-4">
        {unitStats.map((unit) => {
          const manager = lookups.getMember(unit.managerId);
          const active = unit.id === selectedUnitId;
          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => setSelectedUnitId(unit.id)}
              aria-pressed={active}
              className={cn(
                'flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-shadow hover:shadow-sm',
                active ? 'border-2 border-brand' : 'border-line',
              )}
            >
              <div className="grid h-24 place-items-center bg-[#e6ebf2] text-slate-400">
                <Building2 className="size-12" strokeWidth={1.4} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{unit.name}</h3>
                  <StatusBadge value={unit.status} />
                </div>
                <p className="text-[13px] text-muted">
                  {unit.area}, {unit.state} · Mgr: {manager?.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unit.services.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span>{unit.activeJobs} active jobs</span>
                  <span className={cn('font-semibold', unit.utilisation >= 85 && 'text-red-700', unit.utilisation <= 45 && 'text-green-700')}>
                    {unit.busy} / {unit.staff.length} busy
                  </span>
                </div>
                <ProgressBar value={unit.utilisation} tone="auto" label={`${unit.name} utilisation`} />
              </div>
            </button>
          );
        })}
      </section>

      <Card>
        <CardHeader
          title={`Workforce · ${selected.name}`}
          subtitle={`${selected.staff.length} members · ${selected.free} free right now`}
          action={
            <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>
              Add to {selected.city}
            </Button>
          }
        />
        <div className="mb-3 flex flex-wrap gap-2.5">
          <SearchInput value={staffQuery} onChange={setStaffQuery} placeholder="Search name, role or skill" className="min-w-52 flex-1 sm:max-w-xs" />
          <SelectControl aria-label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="All availability" options={['Free', 'On job', 'On leave']} className="w-auto" />
        </div>
        <DataTable
          key={selectedUnitId}
          rows={staffRows}
          minWidth={760}
          pageSize={6}
          emptyState={<EmptyState icon={SearchX} title="No staff match" description="Try a different search or availability filter." />}
          columns={[
            {
              key: 'name',
              header: 'Name',
              sortable: true,
              render: (w) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={w.name} size="sm" color="bg-navy-3" />
                  <b>{w.name}</b>
                </div>
              ),
            },
            { key: 'role', header: 'Role', sortable: true },
            { key: 'skills', header: 'Skills', render: (w) => <div className="flex gap-1.5">{w.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div> },
            {
              key: 'job',
              header: 'Current job',
              render: (w) => {
                const job = currentJobFor(w);
                return job ? <Link to={`/jobs/${job.id}`} className="font-semibold text-brand-ink hover:underline">{job.id}</Link> : <span className="text-muted">—</span>;
              },
            },
            {
              key: 'availability',
              header: 'Availability',
              sortable: true,
              render: (w) => (
                <button
                  type="button"
                  title="Click to change availability"
                  onClick={() => {
                    const order = ['Free', 'On job', 'On leave'];
                    const next = order[(order.indexOf(w.availability) + 1) % order.length];
                    setWorkforce((list) => list.map((p) => (p.id === w.id ? { ...p, availability: next } : p)));
                  }}
                >
                  <Badge tone={AVAILABILITY_TONE[w.availability]}>{w.availability}</Badge>
                </button>
              ),
            },
            {
              key: 'phone',
              header: 'Phone',
              render: (w) =>
                w.phone ? (
                  <a href={`tel:${w.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-brand-ink">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {w.phone}
                  </a>
                ) : (
                  '—'
                ),
            },
          ]}
        />
        <p className="mt-3 text-xs text-muted">Tip: click an availability badge to cycle it between Free, On job and On leave.</p>
      </Card>

      {addOpen && (
        <AddStaffModal
          open
          defaultUnitId={selectedUnitId}
          onClose={() => setAddOpen(false)}
          onSave={(person) => {
            setWorkforce((list) => [...list, { ...person, id: `w-${Date.now()}` }]);
            setAddOpen(false);
            setSelectedUnitId(person.unitId);
            showToast(`${person.name} added to ${lookups.getUnit(person.unitId)?.name}.`);
          }}
        />
      )}
    </div>
  );
}
