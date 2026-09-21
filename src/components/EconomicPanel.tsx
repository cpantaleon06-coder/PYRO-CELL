import { useMemo, useState } from "react";
import { Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { breakevenPrice, ECONOMIC_CONSTANTS } from "../lib/constants";

const CURVE_DATA = Array.from({ length: 51 }, (_, i) => {
  const x = -25 + i;
  return { x, price: Number(breakevenPrice(x).toFixed(2)) };
});

export function EconomicPanel() {
  const [acquisitionCost, setAcquisitionCost] = useState(2);
  const price = useMemo(() => breakevenPrice(acquisitionCost), [acquisitionCost]);

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
      <p className="text-xs text-text-muted mt-3 leading-relaxed">
        Curva interpolada por el proyecto entre los 3 escenarios que reportó Cheatham et al. 2026, no es la
        fórmula original del estudio.
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
