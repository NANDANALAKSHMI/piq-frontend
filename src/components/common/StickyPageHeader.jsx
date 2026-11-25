import { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

/**
 * Compact, pinned header for create / edit / view pages: back + breadcrumb + optional badge,
 * then icon, title (+ `titleAddon`, e.g. status badges) and subtitle on the left.
 * On the right: `actions` if given, otherwise Cancel / Save for forms.
 * `breadcrumbs` = [{ label, to? }] — the last item is the current page.
 */
export default function StickyPageHeader({
  icon: Icon,
  title,
  subtitle,
  titleAddon,
  actions,
  breadcrumbs,
  badge,
  cancelTo,
  submitLabel,
  submittingLabel,
  submitting = false,
  disabled = false,
  onSubmit,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const parent = [...breadcrumbs].reverse().find((crumb) => crumb.to)?.to ?? '/';
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate(parent));

  return (
    <header className="sticky -top-5 z-30 -mx-4 -mt-5 flex flex-col gap-3.5 border-b border-line bg-canvas px-4 pb-4 pt-5 md:-top-7 md:-mx-7 md:-mt-7 md:px-7 md:pt-7">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <button
          type="button"
          onClick={goBack}
          className="group inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white pl-2 pr-3 text-[13px] font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-ink"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Back
        </button>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.label}>
              {index > 0 && <ChevronRight className="size-3.5 text-slate-400" aria-hidden="true" />}
              {crumb.to ? (
                <Link to={crumb.to} className="rounded px-1 py-0.5 hover:bg-black/5 hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-ink">
                  {crumb.label}
                </span>
              )}
            </Fragment>
          ))}
        </nav>
        {badge && (
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-white/70 px-2.5 text-xs font-medium text-muted">
            <span className="size-1.5 rounded-full bg-green-600" aria-hidden="true" />
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink ring-1 ring-brand-line" aria-hidden="true">
              <Icon className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="truncate text-xl font-bold leading-tight tracking-tight sm:text-2xl">{title}</h1>
              {titleAddon}
            </div>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions ?? (
            <>
              <Button size="sm" to={cancelTo}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" icon={Check} disabled={disabled || submitting} onClick={onSubmit}>
                {submitting ? submittingLabel ?? 'Saving…' : submitLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
