# Extrae una climatología mensual REAL de sargazo detectado (Caribe mexicano) del
# producto MF-L3S-Sargassum-AFAI-OLCI de Météo-France/CNRM vía Ifremer/CERSAT (Odatis).
# Métrica: area diaria de sargazo detectada (km2) en la caja del Caribe mexicano, y
# fraccion de cobertura sobre pixeles observados (robusta a nubosidad). Promedia varios
# dias muestreados por mes/año. Descarga -> calcula -> borra cada archivo (disco bajo).
import sys, os, io, json, calendar, datetime, urllib.request, tempfile
import numpy as np, h5py

BASE = "https://data-cersat.ifremer.fr/data/sargassum/l3s/mf-l3s-sargassum-afai-olci"
# Caja Caribe mexicano (coincide con SARGASSUM_ZONES.caribeMexicano del dashboard)
LA0, LA1, LO0, LO1 = 17.8, 21.6, -88.0, -86.0
DKM = 0.0032 * 111.32  # km por lado de pixel (lat)

YEARS = [int(y) for y in sys.argv[1].split(",")] if len(sys.argv) > 1 else [2024, 2025]
DAYS = [int(d) for d in sys.argv[2].split(",")] if len(sys.argv) > 2 else [10, 20]
OUT = sys.argv[3] if len(sys.argv) > 3 else "climatology.json"

def url_for(dt):
    doy = dt.timetuple().tm_yday
    fname = f"{dt:%Y%m%d}120000-MF-L3S-Sargassum-AFAI-OLCI-fv01.0.nc"
    return f"{BASE}/{dt.year}/{doy:03d}/{fname}"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

# indices de la ventana (se calculan una vez con el primer archivo)
win = {}
def compute(nc_bytes):
    h = h5py.File(io.BytesIO(nc_bytes), "r")
    if not win:
        lat = h["latitude"][:]; lon = h["longitude"][:]
        li = np.where((lat >= LA0) & (lat <= LA1))[0]
        lj = np.where((lon >= LO0) & (lon <= LO1))[0]
        win["i0"], win["i1"] = int(li.min()), int(li.max()) + 1
        win["j0"], win["j1"] = int(lj.min()), int(lj.max()) + 1
        latsub = lat[win["i0"]:win["i1"]]
        win["area_row"] = DKM * (DKM * np.cos(np.radians(latsub)))  # km2/pixel por fila
    sd = h["status_of_detections"][0, win["i0"]:win["i1"], win["j0"]:win["j1"]]
    det = (sd == 0)                      # sargazo detectado
    obs = det | (sd == 3)                # observado (detectado o "sin sargazo"); excluye nube/mascara
    area_km2 = float((det.sum(axis=1) * win["area_row"]).sum())
    n_obs = int(obs.sum()); n_det = int(det.sum())
    cov = (n_det / n_obs) if n_obs > 0 else float("nan")
    return area_km2, cov, n_obs

months = {m: {"area": [], "cov": [], "samples": []} for m in range(1, 13)}
total = len(YEARS) * 12 * len(DAYS); done = 0
for y in YEARS:
    for m in range(1, 13):
        for d in DAYS:
            done += 1
            dim = calendar.monthrange(y, m)[1]
            if d > dim:
                continue
            dt = datetime.date(y, m, d)
            if dt > datetime.date.today():
                continue
            try:
                data = fetch(url_for(dt))
                area, cov, nobs = compute(data)
                months[m]["area"].append(area)
                if not np.isnan(cov): months[m]["cov"].append(cov)
                months[m]["samples"].append(f"{dt.isoformat()}(obs={nobs})")
                print(f"[{done}/{total}] {dt} area={area:.2f}km2 cov={cov*100:.3f}% obs={nobs}", flush=True)
            except Exception as e:
                print(f"[{done}/{total}] {dt} SKIP {type(e).__name__}: {str(e)[:60]}", flush=True)

MONTH_KEYS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
out = {"bbox": [LA0, LA1, LO0, LO1], "years": YEARS, "days_sampled": DAYS, "months": []}
for m in range(1, 13):
    a = months[m]["area"]; c = months[m]["cov"]
    out["months"].append({
        "month": MONTH_KEYS[m-1],
        "areaKm2Mean": round(float(np.mean(a)), 3) if a else None,
        "coveragePctMean": round(float(np.mean(c))*100, 4) if c else None,
        "nSamples": len(a),
        "samples": months[m]["samples"],
    })
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print("WROTE", OUT, flush=True)
