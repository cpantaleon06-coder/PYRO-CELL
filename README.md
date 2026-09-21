# Dashboard de simulación — Valorización de sargazo (Fase 3)

Prototipo funcional de las calculadoras interactivas (energética y económica), el panel de estacionalidad, el **monitoreo de arribazón (Track 6)** y la **validación con IA (Track 3)**, siguiendo `esquema_datos.md` y `PYRO_CELL.md` v2 al pie de la letra.

## Correr localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

> La función Edge de validación (Track 3) **no corre bajo `npm run dev`** (Vite no ejecuta `/api`). El panel muestra un aviso claro en ese caso. Para probarla contra Groq necesitas desplegar a Vercel (o correr `vercel dev` con `GROQ_API_KEY` en `.env.local`).

## Qué incluye

- **`src/lib/constants.ts`**: puerto exacto de todas las constantes y fórmulas de `esquema_datos.md`, con las decisiones ya adoptadas (82% de humedad, eficiencia del invernadero al 50%, rango de reactor 400-600°C con 500°C de diseño). Cada constante tiene su fuente en el comentario. Incluye ahora los tipos y la lógica de Track 3 y Track 6.
- **`EnergyPanel`** / **`EconomicPanel`** / **`SeasonalityBar`**: los tres módulos de la Fase 2 (sin cambios).
- **`MonitoringPanel`** (Track 6): arquitectura híbrida de dos capas. Gráfica de arribazón mensual (Recharts), tarjeta de nivel de alerta con color semántico (verde/amarillo/rojo), umbral configurable, días al umbral e indicador visible de si el dato es **real** o **proyectado**.
- **`ValidationPanel`** (Track 3): formulario de observación ciudadana → función Edge que llama a Groq → tarjeta de resultado con confianza, explicación, anomalías y razonamiento, más flujo **human-in-the-loop real** (aprobar/rechazar cuando se requiere revisión).
- **`api/validate-observation.ts`**: función Edge de Vercel. Usa el Vercel AI SDK con el proveedor OpenAI-compatible apuntando a Groq (`llama-3.3-70b-versatile`).

## Track 3 — Validación con IA

- Proveedor: **Groq** (gratis, sin tarjeta, compatible con la API de OpenAI), modelo `llama-3.3-70b-versatile`.
- El prompt pide razonamiento paso a paso y salida JSON estructurada. Se intenta primero `generateObject` (JSON mode del SDK) y, si falla, se cae a `generateText` + parseo manual con validación; si el JSON sale mal formado, el resultado es seguro (`humanReviewRequired = true`).
- Chequeos deterministas de apoyo (geocerca de zonas de sargazo conocidas y rango de tonelaje plausible) que se fusionan con la salida del modelo.
- `humanReviewRequired` se fuerza en el servidor si la confianza < 0.6 o hay cualquier anomalía.

### Desplegar a Vercel

1. Sube el repo a GitHub e impórtalo en Vercel (framework detectado: **Vite**).
2. En **Project Settings → Environment Variables** agrega `GROQ_API_KEY` (créala en https://console.groq.com/keys). Ver `.env.example`.
3. Deploy. La función queda en `https://<tu-deploy>.vercel.app/api/validate-observation`.

## Track 6 — Monitoreo (dato real de Odatis)

La **Capa 1 (histórico real)** ya usa una **muestra real** del producto satelital **MF-L3S-Sargassum-AFAI-OLCI** de Météo-France/CNRM, distribuido por Ifremer/CERSAT vía **Odatis** (DOI `10.12770/1eb82d09-77ed-4f63-9f03-2c3516a9713d`). El script `scripts/extract_odatis.py` descarga los NetCDF diarios (HTTPS abierto), cuenta los píxeles con `status_of_detections == 0` (sargazo detectado) en la caja del Caribe mexicano (0.0032° de resolución), los convierte a **km² reales** (área por píxel corregida por `cos(lat)`) y promedia días muestreados de **2023–2025**. El resultado vive en `src/data/sargassumReference.ts` (`REFERENCE_IS_PLACEHOLDER = false`).

**Unidades, con honestidad:** el satélite mide **área de sargazo detectada (km²)**, no toneladas. El panel muestra el **área real** como métrica principal y una **conversión a toneladas estimada y claramente etiquetada** (≈140 t/km² detectado, un supuesto de cobertura sub-píxel × densidad de manto húmedo, no una medición). El pico real observado es **julio-agosto** (el diseño original asumía junio-julio).

La **Capa 2 (proyección)** escala la serie real por el factor de año récord 2026 (+15%, estimación propia consistente con el ajuste por año récord del módulo de estacionalidad).

## Lo que falta

- Ampliar la muestra de Odatis (más días/año) si se quiere una climatología aún más suave; el pipeline (`scripts/extract_odatis.py`) ya es reproducible.
- Optimización de bundle (code-splitting de Recharts) antes del despliegue final si el tiempo alcanza.

## Nota de rendimiento

El bundle de producción pesa ~180 KB comprimido, mayormente por Recharts. El código de la función Edge (`ai` + `@ai-sdk/openai-compatible`) se despliega por separado y no entra al bundle del cliente.
