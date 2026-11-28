import { Hourglass } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card from '../components/common/Card.jsx';

/** Placeholder for a section that isn't built yet (Dashboard, Reports). */
export default function ComingSoonPage({ title }) {
  return (
    <div className="flex flex-col gap-5.5">
      <PageHeader title={title} />
      <Card className="grid min-h-[22rem] place-items-center text-center">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
            <Hourglass className="size-7" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold tracking-tight">Coming soon</h2>
          <p className="text-[13px] text-muted">The {title.toLowerCase()} is being built. It will show up here once it is ready.</p>
        </div>
      </Card>
    </div>
  );
}
