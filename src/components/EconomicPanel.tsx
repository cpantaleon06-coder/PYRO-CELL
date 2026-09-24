import { useMemo, useState, type ReactNode } from "react";
import { Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../i18n/context";
import { f, fill } from "../i18n/format";
import {
  biocharYieldInterpolated,
  breakevenPrice,
  computeMassBalance,
  ECONOMIC_CONSTANTS,
  PLANT_REFERENCE,
  type OperatingPoint,
} from "../lib/constants";

const CURVE_DATA = Array.from({ length: 51 }, (_, i) => {
  const x = -25 + i;
  return { x, price: Number(breakevenPrice(x).toFixed(2)) };
});

const massAt = (freshKg: number) =>
  computeMassBalance(
    freshKg,
    PLANT_REFERENCE.initialMoisturePct,
    PLANT_REFERENCE.targetMoisturePctStage1,
    PLANT_REFERENCE.targetMoisturePctStage2
  );

interface EconomicPanelProps {
  /** Temperatura de reactor compartida con el módulo energético (estado en App).
   *  Es la vía real por la que la temperatura toca la economía: cambia el rendimiento
   *  de biochar, que es el producto que se vende. */
  reactorTempC: number;
  /** Punto de operación del mes: el caudal real determina cuánto biochar sale. */
  op: OperatingPoint;
}

export function EconomicPanel({ reactorTempC, op }: EconomicPanelProps) {
  const { t, n, p } = useI18n();
  const ec = t.dash.econ;
  const kgDay = t.dash.kgDay;
  const [acquisitionCost, setAcquisitionCost] = useState(2);
  const price = useMemo(() => breakevenPrice(acquisitionCost), [acquisitionCost]);

  const mass = useMemo(() => massAt(op.freshKgPerDay), [op.freshKgPerDay]);
  const biocharYield = biocharYieldInterpolated(reactorTempC);
  const biocharKgPerDay = biocharYield * mass.materiaSecaKg;
  const biocharNominalKgPerDay = biocharYield * massAt(op.nominalKgPerDay).materiaSecaKg;
  // Ingreso indicativo al precio base de comparación de Cheatham et al. ($100/t).
  const biocharRevenuePerDay = (biocharKgPerDay / 1000) * ECONOMIC_CONSTANTS.baselineBiocharPriceUSDPerTon;

  // Signo delante del símbolo (−$23, no $-23), con el separador decimal del idioma.
  const usd = (v: number, d = 0) => `${v < 0 ? "−" : ""}$${n(Math.abs(v), d)}`;
  const acqLabel = `${usd(acquisitionCost)}/t`;

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5">
      <p className="font-display font-semibold text-base mb-4">{ec.title}</p>

      <label htmlFor="acq-cost" className="text-xs text-text-secondary block mb-1.5">
        {ec.acq} <span className="text-accent font-data">{acqLabel}</span>
        <span className="text-text-muted"> {acquisitionCost < 0 ? ec.feeCharged : ec.costPaid}</span>
      </label>
      <input
        id="acq-cost"
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
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: "#55606b" }} tickFormatter={(v) => usd(Number(v))} />
            <YAxis tick={{ fontSize: 10, fill: "#55606b" }} width={36} tickFormatter={(v) => n(Number(v))} />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #e4e0d4", fontSize: 12 }}
              labelStyle={{ color: "#17202b" }}
              formatter={(v) => [`${usd(Number(v), 2)}/t`, ec.tooltipPrice]}
              labelFormatter={(l) => f(ec.tooltipAcq, `${usd(Number(l))}/t`)}
            />
            <Line type="monotone" dataKey="price" stroke="#4fb8ae" strokeWidth={2} dot={false} />
            <ReferenceDot x={acquisitionCost} y={price} r={5} fill="#e3a03c" stroke="#ffffff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 text-sm border-t border-border pt-3">
        <Row label={ec.rows.breakeven} value={`${usd(price, 2)}/t`} />
        <Row label={ec.rows.npv} value={`+${usd(ECONOMIC_CONSTANTS.npv12yrUSD / 1e6, 2)}M`} accent="surplus" />
        <Row label={ec.rows.capital} value={usd(ECONOMIC_CONSTANTS.capitalCostUSD)} />
        <Row label={ec.rows.breakevenYear} value={f(ec.rows.year, ECONOMIC_CONSTANTS.breakevenYear)} />
      </div>

      <div className="space-y-2 text-sm border-t border-border pt-3 mt-3">
        <p className="text-xs text-text-secondary mb-1">
          {fill(ec.product,
            <span className="text-accent font-data">{n(reactorTempC)} °C</span>,
            <span className="text-accent font-data">{`${n(op.freshKgPerDay)} ${kgDay}`}</span>
          )}
        </p>
        <Row label={ec.yield} value={p(biocharYield * 100, 1)} />
        <Row
          label={ec.produced}
          value={`${n(biocharKgPerDay, 1)} ${kgDay}`}
          accent={op.reactorRatePct < 100 ? "deficit" : undefined}
        />
        {op.reactorRatePct < 100 && (
          <Row
            label={ec.loss}
            value={`−${n(biocharNominalKgPerDay - biocharKgPerDay, 1)} ${kgDay}`}
            accent="deficit"
          />
        )}
        <Row
          label={f(ec.revenue, usd(ECONOMIC_CONSTANTS.baselineBiocharPriceUSDPerTon))}
          value={`${usd(biocharRevenuePerDay, 2)}/${kgDay.split("/")[1]}`}
        />
      </div>

      <p className="text-xs text-text-muted mt-3">
        {fill(ec.note, <span className="text-energy">{ec.noteHl}</span>)}
      </p>
    </div>
  );
}

function Row({ label, value, accent }: { label: ReactNode; value: string; accent?: "surplus" | "deficit" }) {
  const color = accent === "surplus" ? "text-surplus" : accent === "deficit" ? "text-deficit" : "text-text-primary";
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-data text-right ${color}`}>{value}</span>
    </div>
  );
}
