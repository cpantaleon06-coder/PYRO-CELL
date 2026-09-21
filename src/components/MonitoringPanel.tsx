import { useMemo, useState } from "react";
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
import {
  ALL_MONTHS,
  areaToEstimatedTons,
  computeMonitoring,
  MONTH_LABELS,
  monitoringMonthlySeries,
  type AlertLevel,
  type MonitoringDataSource,
} from "../lib/constants";
import { REFERENCE_IS_PLACEHOLDER, REFERENCE_SOURCE_LABEL } from "../data/sargassumReference";
import { StatCard } from "./StatCard";

// Mes actual del sistema (hoy), como default de la posición en la serie.
const CURRENT_MONTH = ALL_MONTHS[new Date().getMonth()];

const ALERT_META: Record<AlertLevel, { label: string; accent: "surplus" | "energy" | "deficit"; hex: string }> = {
  verde: { label: "Verde", accent: "surplus", hex: "#7cb86b" },
  amarillo: { label: "Amarillo", accent: "energy", hex: "#e3a03c" },
  rojo: { label: "Rojo", accent: "deficit", hex: "#e0654a" },
};

function fmtTons(t: number): string {
  if (t >= 1_000_000) return `~${(t / 1_000_000).toFixed(2)} Mt`;
  if (t >= 1_000) return `~${(t / 1_000).toFixed(0)} kt`;
  return `~${t.toFixed(0)} t`;
}

export function MonitoringPanel() {
  const [source, setSource] = useState<MonitoringDataSource>("odatis_offline_snapshot");
  const [month, setMonth] = useState<string>(CURRENT_MONTH);
  const [thresholdKm2, setThresholdKm2] = useState<number>(800);

  const series = useMemo(() => monitoringMonthlySeries(source), [source]);
  const output = useMemo(
    () => computeMonitoring({ historicalBloomDataSource: source, alertThresholdAreaKm2: thresholdKm2 }, month),
    [source, month, thresholdKm2]
  );

  const chartData = series.map((m) => ({ mes: MONTH_LABELS[m.month].slice(0, 3), km2: m.areaKm2, key: m.month }));
  const selected = chartData.find((d) => d.key === month);
  const alert = ALERT_META[output.alertLevel];
  const lineColor = output.dataSourceUsed === "real" ? "#4fb8ae" : "#e3a03c";

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <p className="font-display font-semibold text-base">Monitoreo de arribazón (Track 6)</p>
        <SourceBadge source={output.dataSourceUsed} />
      </div>
      <p className="text-xs text-text-muted mb-4">
        Arquitectura híbrida de dos capas: histórico real (Odatis) + proyección estacional
      </p>

      {source === "odatis_offline_snapshot" && REFERENCE_IS_PLACEHOLDER && (
        <div className="border border-energy-dim bg-energy-dim/15 rounded px-4 py-2.5 mb-4">
          <p className="text-xs text-energy leading-relaxed">⚠ {REFERENCE_SOURCE_LABEL}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard
          label="Nivel de alerta"
          value={alert.label}
          accent={alert.accent}
          sublabel={`umbral ${thresholdKm2} km²/mes`}
        />
        <StatCard
          label="Área detectada (mes)"
          value={`${output.currentAreaKm2.toFixed(0)} km²`}
          sublabel={`${MONTH_LABELS[month]} · ${fmtTons(output.currentEstimatedTons)} est.`}
        />
        <StatCard
          label="Días al umbral"
          value={output.daysToThreshold === null ? "—" : `${output.daysToThreshold} d`}
          accent={output.daysToThreshold !== null && output.daysToThreshold <= 30 ? "deficit" : "neutral"}
          sublabel={output.daysToThreshold === null ? "no se cruza en 12 meses" : "estimado"}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap mb-4">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Capa de datos</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as MonitoringDataSource)}
            className="bg-bg-raised border border-border rounded px-2 py-1.5 text-sm"
          >
            <option value="odatis_offline_snapshot">Histórico real (Odatis)</option>
            <option value="seasonal_projection">Proyección estacional</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-bg-raised border border-border rounded px-2 py-1.5 text-sm"
          >
            {ALL_MONTHS.map((m) => (
              <option key={m} value={m}>{MONTH_LABELS[m]}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label className="text-xs text-text-secondary block mb-1">
            Umbral de alerta: <span className="text-energy font-data">{thresholdKm2} km²/mes</span>
          </label>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={thresholdKm2}
            onChange={(e) => setThresholdKm2(Number(e.target.value))}
            className="w-full accent-energy"
          />
        </div>
      </div>

      <div className="h-44 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#26404f" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9fb0ba" }} interval={0} />
            <YAxis
              tick={{ fontSize: 10, fill: "#9fb0ba" }}
              width={44}
              tickFormatter={(v) => `${Number(v).toFixed(0)}`}
              label={{ value: "km²", angle: -90, position: "insideLeft", fill: "#64747e", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ background: "#1a2c3a", border: "1px solid #26404f", fontSize: 12 }}
              labelStyle={{ color: "#f2eee3" }}
              formatter={(v) => [`${Number(v).toFixed(0)} km²  (${fmtTons(areaToEstimatedTons(Number(v)))} est.)`, "Área detectada"]}
            />
            <ReferenceLine y={thresholdKm2} stroke="#e0654a" strokeDasharray="4 4" strokeWidth={1.5} />
            <Line type="monotone" dataKey="km2" stroke={lineColor} strokeWidth={2} dot={false} />
            {selected && <ReferenceDot x={selected.mes} y={selected.km2} r={5} fill={alert.hex} stroke="#0b1620" strokeWidth={2} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-text-muted mt-3 leading-relaxed">
        Área: <span className="text-text-secondary">medición satelital real</span> de Odatis / Météo-France
        (MF-L3S-Sargassum-AFAI-OLCI, DOI 10.12770/1eb82d09), media de días muestreados 2023–2025 para el Caribe
        mexicano; pico real observado en julio-agosto. Toneladas: conversión <span className="text-energy">estimada</span> (≈140 t/km²
        detectado, supuesto sub-píxel), no una medición. La proyección escala el histórico real por el factor de
        año récord 2026 (+15%). Ninguna capa depende de una llamada de red en vivo.
      </p>
    </div>
  );
}

function SourceBadge({ source }: { source: "real" | "proyectado" }) {
  const isReal = source === "real";
  return (
    <span
      className={`text-xs font-data px-2 py-0.5 rounded border ${
        isReal ? "text-water border-water-dim bg-water-dim/20" : "text-energy border-energy-dim bg-energy-dim/20"
      }`}
    >
      {isReal ? "dato: real (satélite)" : "dato: proyectado"}
    </span>
  );
}
