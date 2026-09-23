import { ALL_MONTHS, MONTH_LABELS, SEASONALITY_CONSTANTS, type OperatingPoint } from "../lib/constants";
import { StatCard } from "./StatCard";

interface Props {
  month: string;
  onMonthChange: (m: string) => void;
  bufferLevelKg: number;
  onBufferChange: (kg: number) => void;
  op: OperatingPoint;
}

export function SeasonalityBar({ month, onMonthChange, bufferLevelKg, onBufferChange, op }: Props) {
  const statusLabel = { alta: "Alta", baja: "Baja", transicion: "Transición" }[op.supplyStatus];
  const statusAccent = op.supplyStatus === "alta" ? "surplus" : op.supplyStatus === "baja" ? "deficit" : "energy";
  const bufferPct = (bufferLevelKg / SEASONALITY_CONSTANTS.bufferTargetKg) * 100;

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatCard label="Estado de temporada" value={statusLabel} accent={statusAccent} sublabel={MONTH_LABELS[month]} />
        <StatCard
          label="Colchón de reserva"
          value={`${(bufferLevelKg / 1000).toFixed(1)} t`}
          accent={bufferPct < 25 ? "deficit" : bufferPct > 90 ? "surplus" : "energy"}
          sublabel={`${bufferPct.toFixed(0)}% de ${(SEASONALITY_CONSTANTS.bufferTargetKg / 1000).toFixed(1)} t`}
        />
        <StatCard
          label="Ritmo del reactor"
          value={`${op.reactorRatePct.toFixed(0)}%`}
          accent={op.reactorRatePct >= 100 ? "surplus" : op.reactorRatePct < 50 ? "deficit" : "energy"}
          sublabel={op.reactorRatePct >= 100 ? "ritmo nominal" : "operación reducida"}
        />
        <StatCard
          label="Caudal procesado"
          value={`${op.freshKgPerDay.toFixed(0)} kg/día`}
          accent={op.reactorRatePct >= 100 ? "neutral" : "deficit"}
          sublabel={
            op.reactorRatePct >= 100
              ? `de ${op.nominalKgPerDay.toFixed(0)} kg nominales`
              : `${op.deltaVsNominalPct.toFixed(0)}% vs nominal`
          }
        />
      </div>

      <div className="bg-bg-panel border border-border rounded-lg px-5 py-3 flex items-center gap-4 flex-wrap">
        <label className="text-xs text-text-secondary shrink-0">Simular mes:</label>
        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-bg-raised border border-border rounded px-2 py-1 text-sm"
        >
          {ALL_MONTHS.map((m) => (
            <option key={m} value={m}>{MONTH_LABELS[m]}</option>
          ))}
        </select>
        <label className="text-xs text-text-secondary shrink-0 ml-2">
          Nivel de colchón: <span className="text-accent font-data">{(bufferLevelKg / 1000).toFixed(1)} t</span>
        </label>
        <input
          type="range"
          min={0}
          max={SEASONALITY_CONSTANTS.bufferTargetKg}
          step={500}
          value={bufferLevelKg}
          onChange={(e) => onBufferChange(Number(e.target.value))}
          className="flex-1 min-w-24 accent-accent"
        />
      </div>
    </div>
  );
}
