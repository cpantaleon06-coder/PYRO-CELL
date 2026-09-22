import { useMemo, useState } from "react";
import { Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  biocharYieldInterpolated,
  breakevenPrice,
  computeMassBalance,
  ECONOMIC_CONSTANTS,
  PLANT_REFERENCE,
} from "../lib/constants";

const CURVE_DATA = Array.from({ length: 51 }, (_, i) => {
  const x = -25 + i;
  return { x, price: Number(breakevenPrice(x).toFixed(2)) };
});

const MASS = computeMassBalance(
  PLANT_REFERENCE.freshSargassumKgPerDay,
  PLANT_REFERENCE.initialMoisturePct,
  PLANT_REFERENCE.targetMoisturePctStage1,
  PLANT_REFERENCE.targetMoisturePctStage2
);

interface EconomicPanelProps {
  /** Temperatura de reactor compartida con el módulo energético (estado en App).
   *  Es la vía real por la que la temperatura toca la economía: cambia el rendimiento
   *  de biochar, que es el producto que se vende. */
  reactorTempC: number;
}

export function EconomicPanel({ reactorTempC }: EconomicPanelProps) {
  const [acquisitionCost, setAcquisitionCost] = useState(2);
  const price = useMemo(() => breakevenPrice(acquisitionCost), [acquisitionCost]);

  const biocharYield = biocharYieldInterpolated(reactorTempC);
  const biocharKgPerDay = biocharYield * MASS.materiaSecaKg;
  // Ingreso indicativo al precio base de comparación de Cheatham et al. ($100/t).
  const biocharRevenuePerDay = (biocharKgPerDay / 1000) * ECONOMIC_CONSTANTS.baselineBiocharPriceUSDPerTon;

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5">
      <p className="font-display font-semibold text-base mb-4">Modelo económico</p>

      <label className="text-xs text-text-secondary block mb-1.5">
        Costo de adquisición: <span className="text-accent font-data">{acquisitionCost >= 0 ? "$" : "−$"}{Math.abs(acquisitionCost)}/t</span>
        <span className="text-text-muted"> {acquisitionCost < 0 ? "(tarifa cobrada)" : "(costo pagado)"}</span>
      </label>
      <input
        type="range"
        min={-25}
        max={25}
        step={1}
        value={acquisitionCost}
        onChange={(e) => setAcquisitionCost(Number(e.target.value))}
        className="w-full mb-4 accent-accent"
      />

      <div className="h-36 -mx-2 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={CURVE_DATA} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: "#55606b" }} tickFormatter={(v) => `$${v}`} />
            <YAxis tick={{ fontSize: 10, fill: "#55606b" }} width={36} />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #e4e0d4", fontSize: 12 }}
              labelStyle={{ color: "#17202b" }}
              formatter={(v) => [`$${Number(v).toFixed(2)}/t`, "Precio de equilibrio"]}
              labelFormatter={(l) => `Adquisición: $${l}/t`}
            />
            <Line type="monotone" dataKey="price" stroke="#4fb8ae" strokeWidth={2} dot={false} />
            <ReferenceDot x={acquisitionCost} y={price} r={5} fill="#e3a03c" stroke="#ffffff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 text-sm border-t border-border pt-3">
        <Row label="Precio de equilibrio" value={`$${price.toFixed(2)}/t`} />
        <Row label="VAN a 12 años (base)" value={`+$${(ECONOMIC_CONSTANTS.npv12yrUSD / 1e6).toFixed(2)}M`} accent="surplus" />
        <Row label="Capital total" value={`$${ECONOMIC_CONSTANTS.capitalCostUSD.toLocaleString("en-US")}`} />
        <Row label="Punto de equilibrio" value={`Año ${ECONOMIC_CONSTANTS.breakevenYear}`} />
      </div>

      <div className="space-y-2 text-sm border-t border-border pt-3 mt-3">
        <p className="text-xs text-text-secondary mb-1">
          Producto vendible a <span className="text-accent font-data">{reactorTempC}°C</span> (slider del módulo energético)
        </p>
        <Row label="Rendimiento de biochar" value={`${(biocharYield * 100).toFixed(1)}%`} />
        <Row label="Biochar producido" value={`${biocharKgPerDay.toFixed(1)} kg/día`} />
        <Row label={`Ingreso a $${ECONOMIC_CONSTANTS.baselineBiocharPriceUSDPerTon}/t`} value={`$${biocharRevenuePerDay.toFixed(2)}/día`} />
      </div>

      <p className="text-xs text-text-muted mt-3 leading-relaxed">
        Curva interpolada por el proyecto entre los 3 escenarios que reportó Cheatham et al. 2026, no es la
        fórmula original del estudio. El rendimiento de biochar es una <span className="text-energy">interpolación propia</span>{" "}
        entre Milledge (67.6% a 400°C) y Cheatham (51.91% a 600°C), no un dato medido a temperaturas intermedias;
        el precio de equilibrio, en cambio, solo depende del costo de adquisición (la temperatura no entra en esa
        fórmula del estudio).
      </p>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "surplus" }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-data ${accent === "surplus" ? "text-surplus" : "text-text-primary"}`}>{value}</span>
    </div>
  );
}
