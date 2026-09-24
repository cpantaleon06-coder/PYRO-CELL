import { useMemo, type ReactNode } from "react";
import { useI18n } from "../i18n/context";
import { cap, f, fill } from "../i18n/format";
import {
  biocharYieldInterpolated,
  computeMassBalance,
  PLANT_REFERENCE,
  SEASONALITY_CONSTANTS,
  type OperatingPoint,
} from "../lib/constants";

interface Props {
  month: string;
  bufferLevelKg: number;
  reactorTempC: number;
  op: OperatingPoint;
}

/** Explica en lenguaje llano qué cambia en la planta al mover mes, colchón o temperatura,
 *  y muestra la cadena causal completa. El objetivo es que el dashboard no se vea igual
 *  sin importar el escenario: aquí se nombra explícitamente la diferencia. */
export function OperatingNarrative({ month, bufferLevelKg, reactorTempC, op }: Props) {
  const { t, n, p, locale, month: monthName } = useI18n();
  const tx = t.dash.narrative;
  const kgDay = t.dash.kgDay;

  const { real, nominal } = useMemo(() => {
    const at = (freshKg: number) => {
      const m = computeMassBalance(
        freshKg,
        PLANT_REFERENCE.initialMoisturePct,
        PLANT_REFERENCE.targetMoisturePctStage1,
        PLANT_REFERENCE.targetMoisturePctStage2
      );
      return { mass: m, biocharKg: biocharYieldInterpolated(reactorTempC) * m.materiaSecaKg };
    };
    return { real: at(op.freshKgPerDay), nominal: at(op.nominalKgPerDay) };
  }, [op, reactorTempC]);

  const mes = monthName(month);
  const reduced = op.reactorRatePct < 100;
  const bufferPct = (bufferLevelKg / SEASONALITY_CONSTANTS.bufferTargetKg) * 100;

  const headline =
    op.supplyStatus === "alta"
      ? f(tx.headlineHigh, mes)
      : f(op.supplyStatus === "transicion" ? tx.headlineTransition : tx.headlineLow, cap(mes, locale));

  const bufferNote =
    op.supplyStatus === "baja"
      ? bufferPct < 5
        ? tx.bufferEmpty
        : bufferPct > 95
          ? tx.bufferFull
          : f(tx.bufferPartial, p(bufferPct))
      : op.supplyStatus === "transicion"
        ? tx.transitionNote
        : tx.highNote;

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5 mb-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <p className="font-display font-semibold text-base">{tx.title}</p>
        <span className="text-xs text-text-muted">{tx.hint}</span>
      </div>

      <p className="text-sm text-text-primary">
        {headline} <span className="text-text-secondary">{bufferNote}</span>
      </p>

      <div className="flex items-center gap-2 flex-wrap mt-4 mb-4">
        <Chip label={tx.chips.month} value={mes} />
        <Arrow />
        <Chip label={tx.chips.season} value={t.dash.season.status[op.supplyStatus]} />
        <Arrow />
        <Chip label={tx.chips.rate} value={p(op.reactorRatePct)} strong />
        <Arrow />
        <Chip label={tx.chips.flow} value={`${n(op.freshKgPerDay)} ${kgDay}`} strong />
        <Arrow />
        <Chip label={tx.chips.biochar} value={`${n(real.biocharKg, 1)} ${kgDay}`} strong />
      </div>

      <p className="text-sm text-text-secondary">
        {reduced
          ? fill(tx.reduced,
              <Num>{n(real.mass.stage1WaterRemovedKg)} kg</Num>,
              <Num>{n(nominal.mass.stage1WaterRemovedKg)} kg</Num>,
              <Num>{n(real.biocharKg, 1)} kg</Num>,
              <Num>{n(nominal.biocharKg, 1)} kg</Num>,
              <span className="text-deficit font-data">{p(op.deltaVsNominalPct)}</span>
            )
          : fill(tx.full,
              <Num>{`${n(op.nominalKgPerDay)} ${kgDay}`}</Num>,
              <Num>{n(real.mass.stage1WaterRemovedKg)} kg</Num>,
              <Num>{n(real.mass.salidaEtapa2Kg, 1)} kg</Num>,
              <Num>{n(real.biocharKg, 1)} kg</Num>
            )}
      </p>
    </div>
  );
}

function Chip({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span
      className={`text-xs rounded px-2.5 py-1.5 border ${
        strong ? "border-accent-dim bg-accent/5 text-accent" : "border-border bg-bg-raised text-text-secondary"
      }`}
    >
      <span className="text-text-muted mr-1.5">{label}</span>
      <span className="font-data font-medium">{value}</span>
    </span>
  );
}

function Arrow() {
  return (
    <span className="text-text-muted text-xs" aria-hidden>
      →
    </span>
  );
}

function Num({ children }: { children: ReactNode }) {
  return <span className="font-data text-text-primary">{children}</span>;
}
