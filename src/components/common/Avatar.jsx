import { cn, initials } from '../../utils/formatters.js';

const SIZES = {
  xs: 'size-7 text-[10px]',
  sm: 'size-8 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-base',
};

export default function Avatar({ name, color = 'bg-navy-3', size = 'md', ring = false, className }) {
  return (
    <span
      title={name}
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold text-white',
        SIZES[size],
        color,
        ring && 'ring-2 ring-white',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping avatars with a "+N" chip when there are more than `max`. */
export function AvatarStack({ people, max = 3, size = 'xs' }) {
  if (!people.length) return <span className="text-[13px] text-muted">Unassigned</span>;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((person, index) => (
        <Avatar key={person.id} name={person.name} color={person.color} size={size} ring className={index > 0 ? '-ml-2' : ''} />
      ))}
      {extra > 0 && (
        <span className={cn('-ml-2 grid place-items-center rounded-full bg-slate-100 font-semibold text-slate-600 ring-2 ring-white', SIZES[size])}>
          +{extra}
        </span>
      )}
    </div>
  );
}
