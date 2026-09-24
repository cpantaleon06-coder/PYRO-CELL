import { useI18n } from "../i18n/context";
import { f } from "../i18n/format";
import { ALL_MONTHS, SEASONALITY_CONSTANTS, type OperatingPoint } from "../lib/constants";
import { StatCard } from "./StatCard";

interface Props {
  month: string;
  onMonthChange: (m: string) => void;
  bufferLevelKg: number;
  onBufferChange: (kg: number) => void;
  op: OperatingPoint;
}

export function SeasonalityBar({ month, onMonthChange, bufferLevelKg, onBufferChange, op }: Props) {
  const { t, n, p, month: monthName } = useI18n();
  const s = t.dash.season;

  const statusAccent = op.supplyStatus === "alta" ? "surplus" : op.supplyStatus === "baja" ? "deficit" : "energy";
  const bufferPct = (bufferLevelKg / SEASONALITY_CONSTANTS.bufferTargetKg) * 100;
  const nominal = op.reactorRatePct >= 100;

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatCard
          label={s.stateLabel}
          value={s.status[op.supplyStatus]}
          accent={statusAccent}
          sublabel={monthName(month)}
        />
        <StatCard
          label={s.bufferLabel}
          value={`${n(bufferLevelKg / 1000, 1)} t`}
          accent={bufferPct < 25 ? "deficit" : bufferPct > 90 ? "surplus" : "energy"}
          sublabel={f(s.bufferSub, p(bufferPct), n(SEASONALITY_CONSTANTS.bufferTargetKg / 1000, 1))}
        />
        <StatCard
          label={s.rateLabel}
          value={p(op.reactorRatePct)}
          accent={nominal ? "surplus" : op.reactorRatePct < 50 ? "deficit" : "energy"}
          sublabel={nominal ? s.rateNominal : s.rateReduced}
        />
        <StatCard
          label={s.flowLabel}
          value={`${n(op.freshKgPerDay)} ${t.dash.kgDay}`}
          accent={nominal ? "neutral" : "deficit"}
          sublabel={
            nominal ? f(s.flowNominalSub, n(op.nominalKgPerDay)) : f(s.flowDeltaSub, p(op.deltaVsNominalPct))
          }
        />
      </div>

      <div className="bg-bg-panel border border-border rounded-lg px-5 py-3 flex items-center gap-4 flex-wrap">
        <label htmlFor="sim-month" className="text-xs text-text-secondary shrink-0">
          {s.simMonth}
        </label>
        <select
          id="sim-month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-bg-raised border border-border rounded px-2 py-1 text-sm"
        >
          {ALL_MONTHS.map((m) => (
            <option key={m} value={m}>
              {monthName(m)}
            </option>
          ))}
        </select>
        <label htmlFor="sim-buffer" className="text-xs text-text-secondary shrink-0 ml-2">
          {s.bufferLevel} <span className="text-accent font-data">{n(bufferLevelKg / 1000, 1)} t</span>
        </label>
        <input
          id="sim-buffer"
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
