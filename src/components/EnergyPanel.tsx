import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
    { etapa: "Centrífuga", MJ: Math.round(energy.stage1EnergyRequiredMJ) },
    { etapa: "Invernadero\n(50% ef.)", MJ: Math.round(energy.stage2EnergyRequiredMJ) },
    { etapa: "Calor\npirólisis", MJ: Math.round(energy.pyrolysisHeatRequiredMJPerKg * mass.materiaSecaKg) },
    { etapa: "Syngas +\nbio-aceite", MJ: Math.round(ENERGY_CONSTANTS.syngasBiocrudeYield * mass.materiaSecaKg) },
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

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <p className="font-display font-semibold text-base">Balance energético</p>
        <span className="text-xs font-data text-text-secondary">{op.freshKgPerDay.toFixed(0)} kg/día</span>
      </div>
      <p className="text-xs text-text-muted mb-4">
        {op.reactorRatePct >= 100
          ? "Caudal nominal completo"
          : `Escalado al ${op.reactorRatePct.toFixed(0)}% por la estacionalidad`}
      </p>

      <label className="text-xs text-text-secondary block mb-1.5">
        Temperatura de reactor: <span className="text-accent font-data">{reactorTempC}°C</span>
        {reactorTempC === 500 && <span className="text-text-muted"> (diseño)</span>}
      </label>
      <input
        type="range"
        min={400}
        max={600}
        step={10}
        value={reactorTempC}
        onChange={(e) => onReactorTempChange(Number(e.target.value))}
        className="w-full mb-4 accent-accent"
      />
      <p className="text-xs text-text-muted -mt-3 mb-4">
        Punto de diseño compartido: también recalcula el rendimiento de biochar en el módulo económico.
      </p>

      <label className="text-xs text-text-secondary block mb-1.5">Modo de secado, Etapa 2</label>
      <select
        value={dryingMode}
        onChange={(e) => setDryingMode(e.target.value as typeof dryingMode)}
        className="w-full mb-2 bg-bg-raised border border-border rounded px-2 py-1.5 text-sm"
      >
        <option value="passive_plus_thermal">Invernadero + colectores térmicos</option>
        <option value="passive_only">Solo invernadero pasivo (déficit sin cerrar)</option>
      </select>
      <p
        className={`text-xs mb-4 leading-relaxed ${
          selfSufficient ? "text-surplus" : passiveOnly ? "text-deficit" : "text-text-muted"
        }`}
      >
        {selfSufficient
          ? `A este caudal el invernadero pasivo se basta solo: sus 35 m² cubren el ${(coverage * 100).toFixed(0)}% de la energía necesaria, así que el lote de ${mass.salidaEtapa2Kg.toFixed(1)} kg llega al 20% sin encender los colectores.`
          : passiveOnly
          ? `Sin colectores, los 35 m² de invernadero solo cubren el ${(coverage * 100).toFixed(0)}% de la energía necesaria: únicamente ${driedBatchKg.toFixed(1)} kg de los ${mass.salidaEtapa2Kg.toFixed(1)} kg alcanzan el 20% de humedad.`
          : `Los ${energy.thermalCollectorAreaM2.toFixed(1)} m² de colectores cierran el déficit: el lote completo de ${mass.salidaEtapa2Kg.toFixed(1)} kg llega al 20%.`}
      </p>

      <div className="h-36 -mx-2 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d4" vertical={false} />
            <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: "#55606b" }} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: "#55606b" }} width={36} />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #e4e0d4", fontSize: 12 }}
              labelStyle={{ color: "#17202b" }}
            />
            <Bar dataKey="MJ" fill="#e3a03c" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 text-sm border-t border-border pt-3">
        <Row label="Agua removida etapa 1" value={`${mass.stage1WaterRemovedKg.toFixed(0)} kg`} />
        <Row label="Agua evaporada etapa 2" value={`${mass.stage2WaterRemovedKg.toFixed(1)} kg`} />
        <Row
          label="Cobertura pasiva del invernadero"
          value={`${(coverage * 100).toFixed(0)}%`}
          accent={coverage >= 1 ? "surplus" : "deficit"}
        />
        {selfSufficient ? (
          <Row label="Área de colectores térmicos" value="no requeridos" accent="surplus" />
        ) : passiveOnly ? (
          <Row label="Lote que alcanza 20% humedad" value={`${driedBatchKg.toFixed(1)} kg`} accent="deficit" />
        ) : (
          <Row label="Área de colectores térmicos" value={`${energy.thermalCollectorAreaM2.toFixed(1)} m²`} />
        )}
        <Row
          label="Superávit de pirólisis"
          value={`${energy.pyrolysisEnergySurplusMJPerKg >= 0 ? "+" : ""}${energy.pyrolysisEnergySurplusMJPerKg.toFixed(2)} MJ/kg`}
          accent={energy.netBalanceStatus === "surplus" ? "surplus" : "deficit"}
        />
        <Row
          label="Energía neta del día"
          value={`${energy.pyrolysisEnergySurplusTotalMJ >= 0 ? "+" : ""}${energy.pyrolysisEnergySurplusTotalMJ.toFixed(0)} MJ`}
          accent={energy.pyrolysisEnergySurplusTotalMJ >= 0 ? "surplus" : "deficit"}
        />
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "surplus" | "deficit" }) {
  const color = accent === "surplus" ? "text-surplus" : accent === "deficit" ? "text-deficit" : "text-text-primary";
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-data ${color}`}>{value}</span>
    </div>
  );
}
