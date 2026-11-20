import DataTable from '../../components/common/DataTable.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import ProgressBar from '../../components/common/ProgressBar.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { SelectControl } from '../../components/common/FormFields.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { serviceStatus } from '../../utils/projects.js';

const PROGRESS_OPTIONS = [0, 25, 50, 75, 100].map((value) => ({ value: String(value), label: `${value}%` }));

/**
 * Per-service tracking: each service in scope has its own owner, sub-services, progress and status.
 * `subServiceName(id)` turns a sub-service id into its name.
 */
export default function ServiceScopeTable({ services, getMember, subServiceName, onProgressChange, editable = true }) {
  if (!services.length) return <EmptyState title="No services in scope" description="This project has no services yet." />;

  return (
    <DataTable
      minWidth={680}
      rowKey={(s) => s.serviceId}
      rows={services}
      columns={[
        {
          key: 'name',
          header: 'Service',
          className: 'whitespace-normal',
          render: (s) => {
            const subs = s.subServiceIds.map(subServiceName).filter(Boolean);
            return (
              <div>
                <span className="font-semibold">{s.name}</span>
                {subs.length > 0 && <p className="text-[12.5px] text-muted">{subs.join(', ')}</p>}
              </div>
            );
          },
        },
        {
          key: 'owner',
          header: 'Owner',
          render: (s) => {
            const owner = getMember(s.ownerId);
            return owner ? (
              <div className="flex items-center gap-2">
                <Avatar name={owner.name} color={owner.color} size="xs" />
                {owner.name}
              </div>
            ) : (
              '—'
            );
          },
        },
        {
          key: 'progress',
          header: 'Progress',
          render: (s) => (
            <div className="flex items-center gap-2.5">
              <ProgressBar value={s.progress} tone={s.progress >= 100 ? 'green' : 'brand'} className="w-28" label={`${s.name} progress`} />
              {editable ? (
                <SelectControl
                  aria-label={`Update ${s.name} progress`}
                  value={String(PROGRESS_OPTIONS.some((o) => o.value === String(s.progress)) ? s.progress : 0)}
                  onChange={(e) => onProgressChange(s, Number(e.target.value))}
                  options={PROGRESS_OPTIONS}
                  className="h-8 w-[82px] text-[13px]"
                />
              ) : (
                <span className="text-[13px] font-semibold">{s.progress}%</span>
              )}
            </div>
          ),
        },
        { key: 'status', header: 'Status', render: (s) => <StatusBadge value={serviceStatus(s.progress)} /> },
      ]}
    />
  );
}
