# Plantilla genérica de parcheo por marcadores para archivos grandes (>50 KB).
# Destilada de _patch_actores3.py (Plataforma GEDII). Patrón PROBADO:
#   localizar con content.find() sobre marcadores únicos SIN comillas
#   y reemplazar por slicing de índices. NO usar str.replace de bloques
#   con comillas escapadas (falla al reproducir los bytes exactos).
#
# Uso: ajustar RUTA, INICIO, FIN y NUEVO_BLOQUE. Ejecutar desde la raíz
# del proyecto (rutas relativas como en el original) con: python parche_por_marcadores.py

RUTA   = "app/components/ArquitecturaMetodologica.js"
INICIO = "      {/* ═══ TAB: CARACTERIZACIÓN DE ACTORES ═══ */}"   # marcador de apertura (único)
FIN    = "      {/* ═══ TAB: NIVELES DE VINCULACIÓN ═══ */}"        # marcador de cierre (único)

NUEVO_BLOQUE = '''      {/* ═══ TAB: CARACTERIZACIÓN DE ACTORES ═══ */}
      {tabActiva === "actores" && <ActoresEcosistema />}

'''

content = open(RUTA, "r", encoding="utf-8").read()

start = content.find(INICIO)
end   = content.find(FIN)

# 1) Verificar que AMBOS marcadores existen antes de escribir.
if start == -1 or end == -1:
    print("Markers not found, start=%d end=%d" % (start, end))
# 2) Verificar orden (evita slice invertido si se confunden los marcadores).
elif start >= end:
    print("Order error: start(%d) >= end(%d)" % (start, end))
else:
    old_block = content[start:end]
    content = content[:start] + NUEVO_BLOQUE + content[end:]
    open(RUTA, "w", encoding="utf-8").write(content)
    # 3) Reportar el tamaño del cambio para auditoría.
    print("OK - replaced %d chars" % len(old_block))
