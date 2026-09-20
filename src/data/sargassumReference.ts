// Dataset de referencia para el módulo de monitoreo (Track 6), Capa 1.
//
// ⚠️ PLACEHOLDER — ESTO NO ES DATO REAL. Es una serie sintética de marcador de
// posición, calibrada al patrón estacional ya conocido del sargazo pelágico en el
// Caribe mexicano (temporada marzo-octubre, pico junio-julio; ver SEASONALITY_CONSTANTS
// en constants.ts). Debe reemplazarse por la muestra real, descargada offline del
// dataset diario de detección satelital de Météo-France/CNES vía Odatis
// (DOI 10.12770/1eb82d09-77ed-4f63-9f03-2c3516a9713d, formato NetCDF), convertida a
// esta misma forma JSON/TS ligera para la región del Caribe mexicano.
//
// La amplitud está anclada a cifras públicas de 2025 en Quintana Roo (~76,000 t
// removidas en el año, con picos de 13,000+ t en eventos de temporada alta, según
// cobertura local citada en PYRO_CELL.md). Es una calibración de orden de magnitud,
// NO una medición. Nunca presentar como dato real sin la etiqueta REFERENCE_SOURCE_LABEL.

/** Bandera que fuerza el etiquetado honesto en la UI mientras la serie sea sintética.
 *  Poner en `false` únicamente cuando MONTHLY_REFERENCE_TONS provenga de la muestra
 *  real de Odatis ya convertida. */
export const REFERENCE_IS_PLACEHOLDER = true;

export const REFERENCE_SOURCE_LABEL =
  "Datos de referencia (placeholder), pendiente de reemplazar con muestra real de Odatis " +
  "(DOI 10.12770/1eb82d09-77ed-4f63-9f03-2c3516a9713d)";

export interface MonthlyTonnage {
  month: string; // clave de 3 letras en inglés, consistente con SEASONALITY_CONSTANTS
  tons: number;
}

// Total anual de referencia (placeholder): ~76,000 t, ancla de Quintana Roo 2025.
// Reparto mensual según los pesos estacionales conocidos (suman 1.0), pico jun-jul.
export const REFERENCE_ANNUAL_TOTAL_TONS = 76_000;

export const MONTHLY_REFERENCE_TONS: MonthlyTonnage[] = [
  { month: "Jan", tons: 760 }, // 0.01
  { month: "Feb", tons: 760 }, // 0.01
  { month: "Mar", tons: 3040 }, // 0.04
  { month: "Apr", tons: 6840 }, // 0.09
  { month: "May", tons: 10640 }, // 0.14
  { month: "Jun", tons: 14440 }, // 0.19  ← pico
  { month: "Jul", tons: 13680 }, // 0.18  ← pico
  { month: "Aug", tons: 9880 }, // 0.13
  { month: "Sep", tons: 7600 }, // 0.10
  { month: "Oct", tons: 5320 }, // 0.07
  { month: "Nov", tons: 2280 }, // 0.03
  { month: "Dec", tons: 760 }, // 0.01
];
