import { useMemo, useState } from "react";
import { getReactorStatus, MONTH_LABELS, SEASONALITY_CONSTANTS, type YearType } from "../lib/constants";
import { StatCard } from "./StatCard";

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SeasonalityBar() {
  const [month, setMonth] = useState("Sep");
  const [bufferLevelKg, setBufferLevelKg] = useState<number>(SEASONALITY_CONSTANTS.bufferTargetKg);
  const yearType: YearType = "record"; // 2026, confirmado año récord por USF Sargassum Watch System

  const result = useMemo(
    () => getReactorStatus(month, bufferLevelKg, SEASONALITY_CONSTANTS.bufferTargetKg, yearType),
    [month, bufferLevelKg]
  );

  const statusLabel = { alta: "Alta", baja: "Baja", transicion: "Transición" }[result.supplyStatus];
  const statusAccent = result.supplyStatus === "alta" ? "surplus" : result.supplyStatus === "baja" ? "deficit" : "energy";

  return (
    <div className="mb-6">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <StatCard label="Estado de temporada" value={statusLabel} accent={statusAccent} sublabel={MONTH_LABELS[month]} />
        <StatCard
          label="Colchón de reserva"
          value={`${(bufferLevelKg / 1000).toFixed(1)} t`}
          sublabel={`de ${(SEASONALITY_CONSTANTS.bufferTargetKg / 1000).toFixed(1)} t objetivo`}
        />
        <StatCard
          label="Ritmo del reactor"
          value={`${result.reactorRatePct.toFixed(0)}%`}
          accent={result.reactorRatePct >= 100 ? "surplus" : result.reactorRatePct < 50 ? "deficit" : "energy"}
        />
      </div>
      <div className="bg-bg-panel border border-border rounded-lg px-5 py-3 flex items-center gap-4 flex-wrap">
        <label className="text-xs text-text-secondary shrink-0">Simular mes:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-bg-raised border border-border rounded px-2 py-1 text-sm"
        >
          {ALL_MONTHS.map((m) => (
            <option key={m} value={m}>{MONTH_LABELS[m]}</option>
          ))}
        </select>
        <label className="text-xs text-text-secondary shrink-0 ml-2">Nivel de colchón:</label>
        <input
          type="range"
          min={0}
          max={SEASONALITY_CONSTANTS.bufferTargetKg}
          step={500}
          value={bufferLevelKg}
          onChange={(e) => setBufferLevelKg(Number(e.target.value))}
          className="flex-1 min-w-24 accent-accent"
        />
      </div>
    </div>
  );
}
