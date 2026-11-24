import { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

/** `breadcrumbs` = [{ label, to? }] — the last item is the current page. */
export default function PageHeader({ title, subtitle, breadcrumbs, actions, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Pages with breadcrumbs are sub-pages: show a Back button that returns to where the user came from,
  // or to the parent page when this page was opened directly.
  const parent = breadcrumbs ? [...breadcrumbs].reverse().find((crumb) => crumb.to)?.to : undefined;
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate(parent ?? '/'));

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white py-0 pl-2.5 pr-4 text-[13px] font-semibold text-ink shadow-sm transition-all hover:border-brand hover:bg-brand-soft hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              Back
            </button>
            <span className="h-5 w-px bg-line" aria-hidden="true" />
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
              {breadcrumbs.map((crumb, index) => (
                <Fragment key={crumb.label}>
                  {index > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                  {crumb.to ? (
                    <Link to={crumb.to} className="rounded px-1 py-0.5 hover:bg-slate-100 hover:text-ink">
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
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
          {children}
        </div>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
