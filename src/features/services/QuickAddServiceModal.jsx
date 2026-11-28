import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { TextArea, TextField } from '../../components/common/FormFields.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import useServices from '../../hooks/useServices.js';
import { ListInput } from './ServiceModals.jsx';
import { newId, sameName } from './serviceHelpers.js';

/**
 * Adds a service (with its sub-services) without leaving the page you are on (e.g. New project).
 * `onCreated(id)` gets the new service's id so the caller can pick it straight away. Questions and
 * other details can be added later on the Services page.
 */
export default function QuickAddServiceModal({ onClose, onCreated }) {
  const { services, addService } = useServices();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subServices, setSubServices] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const duplicate = services.some((s) => sameName(s.name, name));

  const save = async () => {
    if (saving) return;
    const trimmed = name.trim();
    const problem = !trimmed ? 'Service name is required.' : duplicate ? 'A service with this name already exists.' : '';
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const id = await addService({ name: trimmed, description: description.trim(), subServices, questions: [], active: true });
      showToast(`${trimmed} added to services.`);
      onCreated(id);
    } catch (err) {
      showToast(err.message, { tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      size="lg"
      title="New service"
      description="Something you offer. It is added to this project as soon as you save."
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" icon={Check} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save service'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Service name"
          required
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. Packing"
          error={error || (duplicate ? 'A service with this name already exists.' : undefined)}
        />
        <TextArea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this service covers (optional)" />

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Sub-services (optional)</p>
          <ListInput
            label="New sub-service"
            placeholder="Type a sub-service, then press Enter"
            takenNames={subServices.map((s) => s.name)}
            onAdd={(text) => setSubServices((list) => [...list, { id: newId('sub'), name: text, description: '', active: true }])}
          />
          {subServices.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {subServices.map((sub) => (
                <li key={sub.id} className="inline-flex items-center gap-1 rounded-full bg-navy py-1 pl-3 pr-1 text-[13px] font-medium text-white dark:bg-navy-3">
                  {sub.name}
                  <button
                    type="button"
                    onClick={() => setSubServices((list) => list.filter((x) => x.id !== sub.id))}
                    className="grid size-5 place-items-center rounded-full hover:bg-white/20"
                    aria-label={`Remove ${sub.name}`}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
