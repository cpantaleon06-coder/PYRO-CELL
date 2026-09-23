import { useMemo } from "react";
import {
  biocharYieldInterpolated,
  computeMassBalance,
  MONTH_LABELS,
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

  const mes = MONTH_LABELS[month];
  const reduced = op.reactorRatePct < 100;
  const bufferPct = (bufferLevelKg / SEASONALITY_CONSTANTS.bufferTargetKg) * 100;

  let headline: string;
  if (op.supplyStatus === "alta") {
    headline = `En ${mes} la arribazón está en temporada alta, así que la planta corre a su ritmo nominal completo.`;
  } else if (op.supplyStatus === "transicion") {
    headline = `${mes.charAt(0).toUpperCase() + mes.slice(1)} es mes de transición: llega menos sargazo, pero la línea no se detiene.`;
  } else {
    headline = `${mes.charAt(0).toUpperCase() + mes.slice(1)} es núcleo duro de escasez: el reactor depende casi por completo del colchón de reserva.`;
  }

  const bufferNote =
    op.supplyStatus === "baja"
      ? bufferPct < 5
        ? "Con el colchón vacío cae al piso de operación mínima; nunca se apaga del todo."
        : bufferPct > 95
        ? "Con el colchón lleno logra sostener el ritmo casi como en temporada alta."
        : `Con el colchón al ${bufferPct.toFixed(0)}% recupera parte del ritmo.`
      : op.supplyStatus === "transicion"
      ? "El ajuste de +10 puntos por año récord (2026) ya está aplicado."
      : "El colchón no limita nada en este mes: la materia prima entra fresca.";

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5 mb-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <p className="font-display font-semibold text-base">Qué cambia en este escenario</p>
        <span className="text-xs text-text-muted">
          mes · colchón · temperatura → toda la planta
        </span>
      </div>

      <p className="text-sm leading-relaxed text-text-primary">
        {headline} <span className="text-text-secondary">{bufferNote}</span>
      </p>

      <div className="flex items-center gap-2 flex-wrap mt-4 mb-4">
        <Chip label="Mes" value={mes} />
        <Arrow />
        <Chip label="Temporada" value={{ alta: "Alta", baja: "Baja", transicion: "Transición" }[op.supplyStatus]} />
        <Arrow />
        <Chip label="Ritmo" value={`${op.reactorRatePct.toFixed(0)}%`} strong />
        <Arrow />
        <Chip label="Caudal" value={`${op.freshKgPerDay.toFixed(0)} kg/día`} strong />
        <Arrow />
        <Chip label="Biochar" value={`${real.biocharKg.toFixed(1)} kg/día`} strong />
      </div>

      {reduced ? (
        <p className="text-sm leading-relaxed text-text-secondary">
          Frente a un día de temporada alta, la planta procesa{" "}
          <Num>{real.mass.stage1WaterRemovedKg.toFixed(0)} kg</Num> de agua en la centrífuga en vez de{" "}
          <Num>{nominal.mass.stage1WaterRemovedKg.toFixed(0)} kg</Num>, y produce{" "}
          <Num>{real.biocharKg.toFixed(1)} kg</Num> de biochar en vez de{" "}
          <Num>{nominal.biocharKg.toFixed(1)} kg</Num>:{" "}
          <span className="text-deficit font-data">{op.deltaVsNominalPct.toFixed(0)}%</span> en toda la línea.
          Todos los paneles de abajo ya reflejan este caudal reducido.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-text-secondary">
          La línea procesa los <Num>{op.nominalKgPerDay.toFixed(0)} kg/día</Num> completos:{" "}
          <Num>{real.mass.stage1WaterRemovedKg.toFixed(0)} kg</Num> de agua removida en la centrífuga,{" "}
          <Num>{real.mass.salidaEtapa2Kg.toFixed(1)} kg</Num> de sargazo acondicionado al reactor y{" "}
          <Num>{real.biocharKg.toFixed(1)} kg</Num> de biochar. Baja el mes a enero o vacía el colchón para
          ver caer toda la cadena.
        </p>
      )}
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
  return <span className="text-text-muted text-xs" aria-hidden>→</span>;
}

function Num({ children }: { children: React.ReactNode }) {
  return <span className="font-data text-text-primary">{children}</span>;
}
