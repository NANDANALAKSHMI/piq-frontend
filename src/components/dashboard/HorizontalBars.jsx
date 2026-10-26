import ProgressBar from '../common/ProgressBar.jsx';

/** Simple labelled bars, scaled to the largest value. items: [{ label, value }] */
export default function HorizontalBars({ items }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-center text-[13px]">
            <span>{item.label}</span>
            <span className="ml-auto font-semibold">{item.value}</span>
          </div>
          <ProgressBar value={(item.value / max) * 100} size="md" label={`${item.label}: ${item.value}`} />
        </li>
      ))}
    </ul>
  );
}
