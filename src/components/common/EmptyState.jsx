import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
