import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { TextField } from '../../components/common/FormFields.jsx';

import { plural, sameName } from './serviceHelpers.js';

/** Text box + Add button that appends to a list; Enter adds instead of submitting the form. */
export function ListInput({ label, placeholder, takenNames, onAdd }) {
  const [draft, setDraft] = useState('');
  const duplicate = takenNames.some((taken) => sameName(taken, draft));
  const add = () => {
    if (!draft.trim() || duplicate) return;
    onAdd(draft.trim());
    setDraft('');
  };
  return (
    <div className="flex items-start gap-2">
      <TextField
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        error={duplicate ? 'Already in the list.' : undefined}
        className="flex-1"
      />
      <Button icon={Plus} disabled={!draft.trim() || duplicate} onClick={add} className="h-10">
        Add
      </Button>
    </div>
  );
}

export function ConfirmDeleteModal({ service, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    if (!(await onConfirm())) setDeleting(false);
  };
  const extras = service.subServices.length || service.questions.length;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Delete ${service.name}?`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" icon={Trash2} disabled={deleting} onClick={confirm}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <p className="text-sm">
        {extras
          ? `This also deletes its ${plural(service.subServices.length, 'sub-service')} and ${plural(service.questions.length, 'question')}. It can’t be undone.`
          : 'This can’t be undone.'}
      </p>
    </Modal>
  );
}
