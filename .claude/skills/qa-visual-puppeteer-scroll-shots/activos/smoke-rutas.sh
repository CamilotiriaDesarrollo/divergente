#!/usr/bin/env bash
# smoke-rutas.sh — smoke-tests HTTP por ruta antes de capturar screenshots.
# Reconstruido de los comandos reales verificados en DivergenteWEB/.claude/settings.local.json
# Uso: BASE=http://localhost:3001 bash smoke-rutas.sh
# Objetivo: confirmar que el dev server responde 200 en cada página, fuente y CSS
#           ANTES de gastar tiempo en Puppeteer. Si una ruta no da 200, shoot.js
#           capturaría una página rota (fallar temprano y barato).
set -u
BASE="${BASE:-http://localhost:3001}"

# ── 1. Páginas (una línea por ruta con su código HTTP) ──
for ruta in / /analitica /metodologias /creatividad /portafolio; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}${ruta}")
  printf "%-16s -> %s\n" "$ruta" "$code"
done

# ── 2. Guardar el HTML de la home para inspección de errores de render ──
curl -s -o /tmp/pagina.html -w "HTML home -> HTTP %{http_code}\n" "${BASE}/"

# ── 3. Fuentes y CSS (un 404 aquí = FOUT/flash o página sin estilos en la captura) ──
# Ajustar las rutas hasheadas a las de tu build (_next/static/media, _next/static/chunks).
# Ejemplos reales del proyecto fuente:
#   curl -s -o /dev/null -w "Eastman: %{http_code}\n"    "${BASE}/_next/static/media/EastmanAlternateTrial_Regular-s.p.<hash>.otf"
#   curl -s -o /dev/null -w "Montserrat: %{http_code}\n" "${BASE}/_next/static/media/<hash>-s.p.<hash>.woff2"
#   curl -s -o /dev/null -w "CSS: %{http_code}\n"        "${BASE}/_next/static/chunks/<hash>.css"
