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

## Track 6 — Monitoreo (nota de honestidad sobre los datos)

La **Capa 1 (histórico real)** debería venir de una muestra offline del dataset satelital de Météo-France/CNES vía **Odatis** (DOI `10.12770/1eb82d09-77ed-4f63-9f03-2c3516a9713d`, formato NetCDF). Esa muestra **aún no está descargada ni convertida**, así que hoy la app usa un **dataset sintético de referencia (placeholder)** en `src/data/sargassumReference.ts`, calibrado al patrón estacional conocido (marzo-octubre, pico junio-julio) y anclado en orden de magnitud a cifras públicas de Quintana Roo 2025.

Está **etiquetado como placeholder** en el código (`REFERENCE_IS_PLACEHOLDER`) y en la UI (banner de advertencia y asterisco en el badge "dato: real\*"). **No debe presentarse como dato real** sin reemplazar `MONTHLY_REFERENCE_TONS` por la muestra real de Odatis y poner `REFERENCE_IS_PLACEHOLDER = false`.

La **Capa 2 (proyección)** escala la serie de referencia por el factor de año récord 2026 (+15%, estimación propia consistente con el ajuste por año récord del módulo de estacionalidad).

## Lo que falta

- Descargar y convertir la muestra real de Odatis para reemplazar el placeholder de Track 6 (pipeline offline NetCDF → JSON ligero).
- Optimización de bundle (code-splitting de Recharts) antes del despliegue final si el tiempo alcanza.

## Nota de rendimiento

El bundle de producción pesa ~180 KB comprimido, mayormente por Recharts. El código de la función Edge (`ai` + `@ai-sdk/openai-compatible`) se despliega por separado y no entra al bundle del cliente.
