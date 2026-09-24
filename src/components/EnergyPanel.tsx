import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../i18n/context";
import { f } from "../i18n/format";
import {
  computeEnergyBalance,
  computeMassBalance,
  ENERGY_CONSTANTS,
  PLANT_REFERENCE,
  type OperatingPoint,
} from "../lib/constants";

interface EnergyPanelProps {
  /** Temperatura de reactor compartida con el módulo económico (estado en App). */
  reactorTempC: number;
  onReactorTempChange: (tempC: number) => void;
  /** Punto de operación del mes: el caudal real, no el nominal. */
  op: OperatingPoint;
}

export function EnergyPanel({ reactorTempC, onReactorTempChange, op }: EnergyPanelProps) {
  const { t, n, p } = useI18n();
  const e = t.dash.energy;
  const [dryingMode, setDryingMode] = useState<"passive_only" | "passive_plus_thermal">("passive_plus_thermal");

  // El balance se calcula sobre el caudal REAL del mes, no sobre los 1,500 kg nominales.
  const mass = useMemo(
    () =>
      computeMassBalance(
        op.freshKgPerDay,
        PLANT_REFERENCE.initialMoisturePct,
        PLANT_REFERENCE.targetMoisturePctStage1,
        PLANT_REFERENCE.targetMoisturePctStage2
      ),
    [op.freshKgPerDay]
  );
  const energy = useMemo(() => computeEnergyBalance(mass, reactorTempC), [mass, reactorTempC]);

  const chartData = [
    { etapa: e.chart.centrifuge, MJ: Math.round(energy.stage1EnergyRequiredMJ) },
    { etapa: e.chart.greenhouse, MJ: Math.round(energy.stage2EnergyRequiredMJ) },
    { etapa: e.chart.pyroHeat, MJ: Math.round(energy.pyrolysisHeatRequiredMJPerKg * mass.materiaSecaKg) },
    { etapa: e.chart.syngas, MJ: Math.round(ENERGY_CONSTANTS.syngasBiocrudeYield * mass.materiaSecaKg) },
  ];

  const stage2RequiredKWh = energy.stage2EnergyRequiredMJ / 3.6;
  const coverage = stage2RequiredKWh > 0 ? energy.greenhousePassiveKWh / stage2RequiredKWh : 1;
  const passiveOnly = dryingMode === "passive_only";
  // A caudal reducido el invernadero (35 m², fijos) puede cubrir de sobra la carga del
  // día: en ese caso no hay déficit que cerrar y los colectores no hacen falta.
  const selfSufficient = coverage >= 1;
  // Si falta energía y no hay colectores, solo se seca a 20% la fracción que la energía
  // disponible alcanza. Interpretación del déficit, no una medición.
  const driedBatchKg = mass.salidaEtapa2Kg * Math.min(1, coverage);
  const signed = (v: number, d: number) => `${v >= 0 ? "+" : ""}${n(v, d)}`;

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <p className="font-display font-semibold text-base">{e.title}</p>
        <span className="text-xs font-data text-text-secondary">
          {n(op.freshKgPerDay)} {t.dash.kgDay}
        </span>
      </div>
      <p className="text-xs text-text-muted mb-4">
        {op.reactorRatePct >= 100 ? e.nominal : f(e.scaled, p(op.reactorRatePct))}
      </p>

      <label htmlFor="reactor-temp" className="text-xs text-text-secondary block mb-1.5">
        {e.temp} <span className="text-accent font-data">{n(reactorTempC)} °C</span>
        {reactorTempC === ENERGY_CONSTANTS.reactorDesignTempC && (
          <span className="text-text-muted"> {e.design}</span>
        )}
      </label>
      <input
        id="reactor-temp"
        type="range"
        min={400}
        max={600}
        step={10}
        value={reactorTempC}
        onChange={(ev) => onReactorTempChange(Number(ev.target.value))}
        className="w-full mb-4 accent-accent"
      />
      <p className="text-xs text-text-muted -mt-3 mb-4">{e.shared}</p>

      <label htmlFor="drying-mode" className="text-xs text-text-secondary block mb-1.5">
        {e.dryingMode}
      </label>
      <select
        id="drying-mode"
        value={dryingMode}
        onChange={(ev) => setDryingMode(ev.target.value as typeof dryingMode)}
        className="w-full mb-2 bg-bg-raised border border-border rounded px-2 py-1.5 text-sm"
      >
        <option value="passive_plus_thermal">{e.optBoth}</option>
        <option value="passive_only">{e.optPassive}</option>
      </select>
      <p
        className={`text-xs mb-4 ${
          selfSufficient ? "text-surplus" : passiveOnly ? "text-deficit" : "text-text-muted"
        }`}
      >
        {selfSufficient
          ? f(e.selfSufficient, p(coverage * 100), n(mass.salidaEtapa2Kg, 1))
          : passiveOnly
            ? f(e.passiveShort, p(coverage * 100), n(driedBatchKg, 1), n(mass.salidaEtapa2Kg, 1))
            : f(e.collectorsClose, n(energy.thermalCollectorAreaM2, 1), n(mass.salidaEtapa2Kg, 1))}
      </p>

      <div className="h-44 -mx-2 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d4" vertical={false} />
            <XAxis dataKey="etapa" tick={(props) => <WrapTick {...props} />} interval={0} height={42} />
            <YAxis tick={{ fontSize: 10, fill: "#55606b" }} width={34} tickFormatter={(v) => n(Number(v))} />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #e4e0d4", fontSize: 12 }}
              labelStyle={{ color: "#17202b" }}
              formatter={(v) => [`${n(Number(v))} MJ`, ""]}
              separator=""
            />
            <Bar dataKey="MJ" fill="#e3a03c" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 text-sm border-t border-border pt-3">
        <Row label={e.rows.water1} value={`${n(mass.stage1WaterRemovedKg)} kg`} />
        <Row label={e.rows.water2} value={`${n(mass.stage2WaterRemovedKg, 1)} kg`} />
        <Row
          label={e.rows.coverage}
          value={p(coverage * 100)}
          accent={coverage >= 1 ? "surplus" : "deficit"}
        />
        {selfSufficient ? (
          <Row label={e.rows.collectorArea} value={e.rows.notRequired} accent="surplus" />
        ) : passiveOnly ? (
          <Row label={e.rows.driedBatch} value={`${n(driedBatchKg, 1)} kg`} accent="deficit" />
        ) : (
          <Row label={e.rows.collectorArea} value={`${n(energy.thermalCollectorAreaM2, 1)} m²`} />
        )}
        <Row
          label={e.rows.pyroSurplus}
          value={`${signed(energy.pyrolysisEnergySurplusMJPerKg, 2)} MJ/kg`}
          accent={energy.netBalanceStatus === "surplus" ? "surplus" : "deficit"}
        />
        <Row
          label={e.rows.netEnergy}
          value={`${signed(energy.pyrolysisEnergySurplusTotalMJ, 0)} MJ`}
          accent={energy.pyrolysisEnergySurplusTotalMJ >= 0 ? "surplus" : "deficit"}
        />
      </div>
    </div>
  );
}

/** Parte una etiqueta en renglones de hasta `max` caracteres, sin cortar palabras. */
function wrapWords(text: string, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + " " + word).length <= max) lines[lines.length - 1] = last + " " + word;
    else lines.push(word);
  }
  return lines;
}

/** Tick del eje X en varios renglones: las etapas traducidas ("Gaz de synthèse +
 *  bio-huile") no caben en una línea y se enciman con la vecina en pantallas angostas. */
function WrapTick({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value?: unknown } }) {
  const lines = wrapWords(String(payload?.value ?? ""), 12);
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={9.5} fill="#55606b">
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 10 : 11}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "surplus" | "deficit" }) {
  const color = accent === "surplus" ? "text-surplus" : accent === "deficit" ? "text-deficit" : "text-text-primary";
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-data text-right ${color}`}>{value}</span>
    </div>
  );
}
