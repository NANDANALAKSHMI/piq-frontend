import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** `breadcrumbs` = [{ label, to? }] — the last item is the current page. */
export default function PageHeader({ title, subtitle, breadcrumbs, actions, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs && (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                {index > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-ink">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
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
