interface StatCardProps {
  label: string;
  value: string;
  accent?: "energy" | "water" | "surplus" | "deficit" | "neutral";
  sublabel?: string;
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  energy: "text-energy",
  water: "text-water",
  surplus: "text-surplus",
  deficit: "text-deficit",
  neutral: "text-text-primary",
};

export function StatCard({ label, value, accent = "neutral", sublabel }: StatCardProps) {
  return (
    <div className="bg-bg-panel border border-border rounded-lg px-5 py-4">
      <p className="text-xs text-text-secondary font-body mb-1.5">{label}</p>
      <p className={`text-2xl font-display font-semibold ${ACCENT_CLASSES[accent]}`}>{value}</p>
      {sublabel && <p className="text-xs text-text-muted font-body mt-1">{sublabel}</p>}
    </div>
  );
}
