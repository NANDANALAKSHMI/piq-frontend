import { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import ProgressBar from '../../components/common/ProgressBar.jsx';
import { TextArea } from '../../components/common/FormFields.jsx';
import { Chip } from '../../components/common/Tabs.jsx';
import { serviceStatus } from '../../utils/projects.js';
import { timeAgo } from '../../utils/formatters.js';

const QUICK = [0, 25, 50, 75, 100];

/**
 * Update one service's progress: pick a percentage and add an optional note. The change is time-stamped
 * in the activity history, and a note is also posted to the team chat. `onSave(percent, note)` resolves to true when saved.
 */
export default function ProgressModal({ service, onClose, onSave }) {
  const [percent, setPercent] = useState(service.progress);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const changed = percent !== service.progress;

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={`Update progress · ${service.name}`}
      description={service.updatedAt ? `Last updated ${timeAgo(service.updatedAt)}${service.updatedBy ? ` by ${service.updatedBy}` : ''}` : 'Not updated yet'}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={saving || (!changed && !note.trim())}
            onClick={async () => {
              setSaving(true);
              if (!(await onSave(percent, note.trim()))) setSaving(false);
            }}
          >
            {saving ? 'Saving…' : 'Save update'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-muted">Progress</span>
            <span className="text-2xl font-bold tabular-nums">{percent}%</span>
          </div>
          <ProgressBar value={percent} tone={percent >= 100 ? 'green' : 'brand'} size="md" label={`${service.name} progress`} />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            aria-label="Progress percentage"
            className="mt-3 w-full accent-brand"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((value) => (
              <Chip key={value} active={percent === value} onClick={() => setPercent(value)}>
                {value}%
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Status will be “{serviceStatus(percent)}”. Saved with today’s date and time.</p>
        </div>

        <TextArea
          label="Comment (optional)"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was done, what’s next, anything blocking…"
          hint="Posted to the team chat with this update."
        />
      </div>
    </Modal>
  );
}
