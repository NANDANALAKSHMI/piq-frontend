import DataTable from '../../components/common/DataTable.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import ProgressBar from '../../components/common/ProgressBar.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { serviceStatus } from '../../utils/projects.js';
import { timeAgo } from '../../utils/formatters.js';

/**
 * Per-service tracking: each service in scope has its own owner, sub-services, progress and status.
 * `subServiceName(id)` turns a sub-service id into its name.
 */
export default function ServiceScopeTable({ services, getMember, subServiceName, onUpdate, editable = true }) {
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
            <div className="w-56 max-w-full">
              <div className="flex items-center gap-3">
                <ProgressBar value={s.progress} tone={s.progress >= 100 ? 'green' : 'brand'} className="flex-1" label={`${s.name} progress`} />
                <span className="w-10 text-right text-[13px] font-semibold tabular-nums">{s.progress}%</span>
              </div>
              {s.updatedAt && <p className="mt-0.5 text-[11.5px] text-muted">Updated {timeAgo(s.updatedAt)}</p>}
            </div>
          ),
        },
        { key: 'status', header: 'Status', render: (s) => <StatusBadge value={serviceStatus(s.progress)} /> },
        ...(editable
          ? [
              {
                key: 'update',
                header: <span className="sr-only">Update</span>,
                className: 'text-right',
                render: (s) => (
                  <Button size="sm" onClick={() => onUpdate(s)} aria-label={`Update ${s.name} progress`}>
                    Update
                  </Button>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
