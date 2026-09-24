import { useMemo, useState, useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "../i18n/context";
import { f, fill } from "../i18n/format";
import {
  areaToEstimatedTons,
  computeMonitoring,
  monitoringMonthlySeries,
  type AlertLevel,
  type MonitoringDataSource,
} from "../lib/constants";
import { REFERENCE_IS_PLACEHOLDER, REFERENCE_SOURCE_LABEL } from "../data/sargassumReference";
import { StatCard } from "./StatCard";

const ALERT_META: Record<AlertLevel, { accent: "surplus" | "energy" | "deficit"; hex: string }> = {
  verde: { accent: "surplus", hex: "#7cb86b" },
  amarillo: { accent: "energy", hex: "#e3a03c" },
  rojo: { accent: "deficit", hex: "#e0654a" },
};

interface MonitoringPanelProps {
  /** Mes global de simulación (estado en App): el mismo que mueve la estacionalidad,
   *  para que no haya dos selectores de mes contradiciéndose. */
  month: string;
}

export function MonitoringPanel({ month }: MonitoringPanelProps) {
  const { t, n, month: monthName } = useI18n();
  const m = t.dash.monitor;
  const [source, setSource] = useState<MonitoringDataSource>("odatis_offline_snapshot");
  const [thresholdKm2, setThresholdKm2] = useState<number>(800);
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow, () => false);

  const series = useMemo(() => monitoringMonthlySeries(source), [source]);
  const output = useMemo(
    () => computeMonitoring({ historicalBloomDataSource: source, alertThresholdAreaKm2: thresholdKm2 }, month),
    [source, month, thresholdKm2]
  );

  const fmtTons = (tons: number) =>
    tons >= 1_000_000 ? `~${n(tons / 1_000_000, 2)} Mt` : tons >= 1_000 ? `~${n(tons / 1_000)} kt` : `~${n(tons)} t`;

  const chartData = series.map((s) => ({ mes: monthName(s.month, "short"), km2: s.areaKm2, key: s.month }));
  const selected = chartData.find((d) => d.key === month);
  const alert = ALERT_META[output.alertLevel];
  const lineColor = output.dataSourceUsed === "real" ? "#4fb8ae" : "#e3a03c";

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <p className="font-display font-semibold text-base">{m.title}</p>
        <SourceBadge real={output.dataSourceUsed === "real"} label={output.dataSourceUsed === "real" ? m.badgeReal : m.badgeProj} />
      </div>
      <p className="text-xs text-text-muted mb-4">{m.subtitle}</p>

      {source === "odatis_offline_snapshot" && REFERENCE_IS_PLACEHOLDER && (
        <div className="border border-energy-dim bg-energy-dim/15 rounded px-4 py-2.5 mb-4">
          <p className="text-xs text-energy">⚠ {REFERENCE_SOURCE_LABEL}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatCard
          label={m.alertLabel}
          value={m.alert[output.alertLevel]}
          accent={alert.accent}
          sublabel={f(m.thresholdSub, n(thresholdKm2))}
        />
        <StatCard
          label={m.areaLabel}
          value={`${n(output.currentAreaKm2)} km²`}
          sublabel={`${monthName(month)} · ${fmtTons(output.currentEstimatedTons)} ${m.est}`}
        />
        <StatCard
          label={m.daysLabel}
          value={output.daysToThreshold === null ? "—" : f(m.daysUnit, n(output.daysToThreshold))}
          accent={output.daysToThreshold !== null && output.daysToThreshold <= 30 ? "deficit" : "neutral"}
          sublabel={output.daysToThreshold === null ? m.notCrossed : m.estimated}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap mb-4">
        <div>
          <label htmlFor="mon-layer" className="text-xs text-text-secondary block mb-1">
            {m.layer}
          </label>
          <select
            id="mon-layer"
            value={source}
            onChange={(e) => setSource(e.target.value as MonitoringDataSource)}
            className="bg-bg-raised border border-border rounded px-2 py-1.5 text-sm"
          >
            <option value="odatis_offline_snapshot">{m.optReal}</option>
            <option value="seasonal_projection">{m.optProj}</option>
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label htmlFor="mon-threshold" className="text-xs text-text-secondary block mb-1">
            {m.thresholdLabel}{" "}
            <span className="text-accent font-data">
              {n(thresholdKm2)} {m.perMonth}
            </span>
          </label>
          <input
            id="mon-threshold"
            type="range"
            min={100}
            max={2000}
            step={50}
            value={thresholdKm2}
            onChange={(e) => setThresholdKm2(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      <div className="h-44 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d4" vertical={false} />
            {/* En teléfono no caben 12 meses (en francés son los más largos): se muestra uno
                sí y uno no, de forma regular, en vez de encimarlos. */}
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#55606b" }} interval={narrow ? 1 : 0} />
            <YAxis
              tick={{ fontSize: 10, fill: "#55606b" }}
              width={44}
              tickFormatter={(v) => n(Number(v))}
              label={{ value: "km²", angle: -90, position: "insideLeft", fill: "#8a8f98", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #e4e0d4", fontSize: 12 }}
              labelStyle={{ color: "#17202b" }}
              formatter={(v) => [
                `${n(Number(v))} km²  (${fmtTons(areaToEstimatedTons(Number(v)))} ${m.est})`,
                m.tooltipArea,
              ]}
            />
            <ReferenceLine y={thresholdKm2} stroke="#e0654a" strokeDasharray="4 4" strokeWidth={1.5} />
            <Line type="monotone" dataKey="km2" stroke={lineColor} strokeWidth={2} dot={false} />
            {selected && (
              <ReferenceDot x={selected.mes} y={selected.km2} r={5} fill={alert.hex} stroke="#ffffff" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-text-muted mt-3">
        {fill(m.note,
          <span className="text-text-secondary">{m.noteReal}</span>,
          <span className="text-energy">{m.noteEst}</span>
        )}
      </p>
    </div>
  );
}

const NARROW_QUERY = "(max-width: 480px)";
const isNarrow = () => matchMedia(NARROW_QUERY).matches;
function subscribeNarrow(onChange: () => void) {
  const mq = matchMedia(NARROW_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function SourceBadge({ real, label }: { real: boolean; label: string }) {
  return (
    <span
      className={`text-xs font-data px-2 py-0.5 rounded border ${
        real ? "text-water border-water-dim bg-water-dim/20" : "text-energy border-energy-dim bg-energy-dim/20"
      }`}
    >
      {label}
    </span>
  );
}
