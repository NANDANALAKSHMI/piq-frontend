import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { SelectField } from '../../components/common/FormFields.jsx';
import { PROJECT_STATUSES } from '../../data/constants.js';

/** `onSave` returns a promise resolving to true when saved, so the button can show "Saving…". */
export function StatusModal({ project, onClose, onSave }) {
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  return (
    <Modal
      open
      onClose={onClose}
      title="Update status"
      description={`${project.id} · ${project.name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={status === project.status || saving}
            onClick={async () => {
              setSaving(true);
              if (!(await onSave(status))) setSaving(false);
            }}
          >
            {saving ? 'Saving…' : 'Save status'}
          </Button>
        </>
      }
    >
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={PROJECT_STATUSES} />
    </Modal>
  );
}
