import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';

/** data: [{ name, value, color }] */
export default function StatusDonut({ data, total, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
              onClick={(entry) => onSelect?.(entry.name)}
              cursor={onSelect ? 'pointer' : undefined}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[30px] font-bold leading-none">{total}</p>
            <p className="mt-1 text-xs text-muted">Total jobs</p>
          </div>
        </div>
      </div>
      <ul className="flex min-w-[150px] flex-1 flex-col gap-2.5">
        {data.map((entry) => (
          <li key={entry.name}>
            <button
              type="button"
              onClick={() => onSelect?.(entry.name)}
              className="flex w-full items-center gap-2.5 rounded-md text-left text-[13px] hover:bg-slate-50"
            >
              <span className="size-2.5 rounded-[3px]" style={{ background: entry.color }} aria-hidden="true" />
              <span className="flex-1">{entry.name}</span>
              <span className="font-semibold">{entry.value}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
