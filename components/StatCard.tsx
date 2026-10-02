export default function StatCard({ label, value, tone = "plain" }: { label: string; value: string | number; tone?: "plain" | "pink" | "teal" | "gold" }) {
  const bar = { plain: "bg-night", pink: "bg-rani", teal: "bg-peacock", gold: "bg-marigold" }[tone];
  return (
    <div className="card relative overflow-hidden pl-5">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} aria-hidden />
      <div className="text-sm font-bold text-ink/70">{label}</div>
      <div className="mt-1 text-3xl font-extrabold tabular-nums text-night">{value}</div>
    </div>
  );
}
