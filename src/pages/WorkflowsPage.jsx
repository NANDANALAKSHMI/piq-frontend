import { useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, Save, Trash2, Workflow } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button, { IconButton } from '../components/common/Button.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Toggle from '../components/common/Toggle.jsx';
import { SelectControl, SelectField, TextField } from '../components/common/FormFields.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { workflowTemplates } from '../data/workflowsData.js';
import { jobCategories } from '../data/categoriesData.js';
import { cn } from '../utils/formatters.js';

const OWNER_ROLES = ['Unit manager', 'Supervisor', 'Designer', 'Packing supervisor', 'Logistics', 'Admin'];

const RULES = [
  { key: 'allowJobCustomisation', title: 'Allow per-job customisation', body: 'Managers can add, skip or rename stages on a single job without changing this template.' },
  { key: 'skipOutOfScope', title: 'Skip stages outside job scope', body: 'A “Packing only” job skips Design and Production automatically.' },
  { key: 'requirePhotos', title: 'Require a photo before completing a stage', body: 'Applies to stages marked “photos required”.' },
];

let stageCounter = 0;

export default function WorkflowsPage() {
  const { jobs } = useAppData();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState(workflowTemplates);
  const [selectedId, setSelectedId] = useState(workflowTemplates[0].id);

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];
  const usage = (id) => jobs.filter((j) => j.templateId === id).length;
  const totalDays = selected.stages.reduce((sum, s) => sum + Number(s.days || 0), 0);

  const patch = (changes) => setTemplates((list) => list.map((t) => (t.id === selected.id ? { ...t, ...changes } : t)));
  const patchStage = (stageId, changes) => patch({ stages: selected.stages.map((s) => (s.id === stageId ? { ...s, ...changes } : s)) });

  const moveStage = (index, direction) => {
    const stages = [...selected.stages];
    const target = index + direction;
    [stages[index], stages[target]] = [stages[target], stages[index]];
    patch({ stages });
  };

  const addStage = () => {
    stageCounter += 1;
    patch({ stages: [...selected.stages, { id: `new-${stageCounter}`, name: 'New stage', ownerRole: 'Supervisor', days: 1, service: 'Admin', photos: false }] });
  };

  const createTemplate = (base) => {
    const id = `wf-${Date.now()}`;
    const template = base
      ? { ...base, id, name: `${base.name} (copy)`, version: 1, stages: base.stages.map((s) => ({ ...s })) }
      : { id, name: 'New template', category: jobCategories[0].name, version: 1, allowJobCustomisation: true, skipOutOfScope: true, requirePhotos: false, stages: [{ id: 's1', name: 'Onboarding', ownerRole: 'Unit manager', days: 1, service: 'Admin', photos: false }] };
    setTemplates((list) => [...list, template]);
    setSelectedId(id);
    showToast(base ? `${base.name} duplicated.` : 'New template created.');
  };

  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader
        title="Workflow templates"
        subtitle="Reusable stage lists. Apply one to any job, then adjust it per job when needed."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => createTemplate(null)}>
            New template
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[minmax(280px,1fr)_minmax(0,1.9fr)]">
        <Card className="self-start p-3">
          <ul className="flex flex-col gap-0.5">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  aria-current={t.id === selected.id ? 'true' : undefined}
                  className={cn('flex w-full items-center gap-3 rounded-[10px] p-3 text-left', t.id === selected.id ? 'bg-brand-soft' : 'hover:bg-slate-50')}
                >
                  <span className="grid size-9.5 place-items-center rounded-[10px] bg-white text-brand-ink ring-1 ring-line">
                    <Workflow className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-[12.5px] text-muted">
                      {t.stages.length} stages · used by {usage(t.id)} jobs
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex min-w-0 flex-col gap-5.5">
          <Card>
            <CardHeader
              title={selected.name}
              subtitle={`v${selected.version} · ${selected.stages.length} stages · about ${totalDays} working days`}
              action={
                <div className="flex gap-2">
                  <Button size="sm" icon={Copy} onClick={() => createTemplate(selected)}>
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Save}
                    onClick={() => {
                      patch({ version: selected.version + 1 });
                      showToast(`${selected.name} saved as v${selected.version + 1}.`);
                    }}
                  >
                    Save template
                  </Button>
                </div>
              }
            />
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Template name" value={selected.name} onChange={(e) => patch({ name: e.target.value })} />
              <SelectField label="Default for category" value={selected.category} onChange={(e) => patch({ category: e.target.value })} options={jobCategories.map((c) => c.name)} />
            </div>

            <p className="mb-2.5 font-semibold">Stages</p>
            <ol className="flex flex-col gap-2.5">
              {selected.stages.map((stage, index) => (
                <li key={stage.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-line p-3">
                  <span className="mt-1.5 grid size-7 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand-ink">{index + 1}</span>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_90px]">
                    <TextField aria-label={`Stage ${index + 1} name`} value={stage.name} onChange={(e) => patchStage(stage.id, { name: e.target.value })} />
                    <SelectControl aria-label={`Stage ${index + 1} owner`} value={stage.ownerRole} onChange={(e) => patchStage(stage.id, { ownerRole: e.target.value })} options={OWNER_ROLES} />
                    <TextField aria-label={`Stage ${index + 1} days`} type="number" min="1" value={stage.days} onChange={(e) => patchStage(stage.id, { days: e.target.value })} />
                    <label className="flex items-center gap-2 text-[13px] text-muted sm:col-span-3">
                      <Toggle checked={stage.photos} label={`Photos required for ${stage.name}`} onChange={(value) => patchStage(stage.id, { photos: value })} />
                      Photos required at this stage
                    </label>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <IconButton icon={ArrowUp} label="Move up" onClick={() => moveStage(index, -1)} disabled={index === 0} className="size-9 disabled:opacity-40" />
                    <IconButton icon={ArrowDown} label="Move down" onClick={() => moveStage(index, 1)} disabled={index === selected.stages.length - 1} className="size-9 disabled:opacity-40" />
                    <IconButton
                      icon={Trash2}
                      label="Remove stage"
                      onClick={() => patch({ stages: selected.stages.filter((s) => s.id !== stage.id) })}
                      disabled={selected.stages.length === 1}
                      className="size-9 text-red-700 disabled:opacity-40"
                    />
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={addStage}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-slate-300 py-3 text-[13px] font-semibold text-muted hover:border-brand hover:text-brand-ink"
            >
              <Plus className="size-4" aria-hidden="true" /> Add stage
            </button>
          </Card>

          <Card>
            <CardHeader title="Template rules" />
            <ul className="flex flex-col">
              {RULES.map((rule) => (
                <li key={rule.key} className="flex items-center gap-4 border-b border-line py-3.5 first:pt-0 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold">{rule.title}</p>
                    <p className="text-[13px] text-muted">{rule.body}</p>
                  </div>
                  <Toggle checked={selected[rule.key]} label={rule.title} onChange={(value) => patch({ [rule.key]: value })} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
