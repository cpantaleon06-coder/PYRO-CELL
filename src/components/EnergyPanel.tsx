import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { computeEnergyBalance, computeMassBalance, ENERGY_CONSTANTS } from "../lib/constants";

const FRESH_KG = 1500;
const INITIAL_MOISTURE = 0.82;

export function EnergyPanel() {
  const [reactorTempC, setReactorTempC] = useState<number>(ENERGY_CONSTANTS.reactorDesignTempC);
  const [dryingMode, setDryingMode] = useState<"passive_only" | "passive_plus_thermal">("passive_plus_thermal");

  const mass = useMemo(() => computeMassBalance(FRESH_KG, INITIAL_MOISTURE, 0.6, 0.2), []);
  const energy = useMemo(() => computeEnergyBalance(mass, reactorTempC), [mass, reactorTempC]);

  const chartData = [
    { etapa: "Centrífuga", MJ: Math.round(energy.stage1EnergyRequiredMJ) },
    { etapa: "Invernadero\n(50% ef.)", MJ: Math.round(energy.stage2EnergyRequiredMJ) },
    { etapa: "Calor\npirólisis", MJ: Math.round(energy.pyrolysisHeatRequiredMJPerKg * mass.materiaSecaKg) },
    { etapa: "Syngas +\nbio-aceite", MJ: Math.round(ENERGY_CONSTANTS.syngasBiocrudeYield * mass.materiaSecaKg) },
  ];

  const coveragePct = (energy.greenhousePassiveKWh / (energy.stage2EnergyRequiredMJ / 3.6)) * 100;

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5">
      <p className="font-display font-semibold text-base mb-4">Balance energético</p>

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
        onChange={(e) => setReactorTempC(Number(e.target.value))}
        className="w-full mb-4 accent-accent"
      />

      <label className="text-xs text-text-secondary block mb-1.5">Modo de secado, Etapa 2</label>
      <select
        value={dryingMode}
        onChange={(e) => setDryingMode(e.target.value as typeof dryingMode)}
        className="w-full mb-4 bg-bg-raised border border-border rounded px-2 py-1.5 text-sm"
      >
        <option value="passive_plus_thermal">Invernadero + colectores térmicos</option>
        <option value="passive_only">Solo invernadero pasivo (déficit sin cerrar)</option>
      </select>

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
          value={`${coveragePct.toFixed(0)}%`}
          accent={coveragePct >= 100 ? "surplus" : "deficit"}
        />
        {dryingMode === "passive_plus_thermal" && (
          <Row label="Área de colectores térmicos" value={`${energy.thermalCollectorAreaM2.toFixed(1)} m²`} />
        )}
        <Row
          label="Superávit de pirólisis"
          value={`${energy.pyrolysisEnergySurplusMJPerKg >= 0 ? "+" : ""}${energy.pyrolysisEnergySurplusMJPerKg.toFixed(2)} MJ/kg`}
          accent={energy.netBalanceStatus === "surplus" ? "surplus" : "deficit"}
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
