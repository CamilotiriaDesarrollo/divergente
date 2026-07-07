content = open('app/components/ArquitecturaMetodologica.js','r',encoding='utf-8').read()

# Find the actores tab block using unique strings
start = content.find("      {/* ═══ TAB: CARACTERIZACIÓN DE ACTORES ═══ */}")
end   = content.find("      {/* ═══ TAB: NIVELES DE VINCULACIÓN ═══ */}")

if start == -1 or end == -1:
    print("Markers not found, start=%d end=%d" % (start, end))
else:
    old_block = content[start:end]
    new_block = '''      {/* ═══ TAB: CARACTERIZACIÓN DE ACTORES ═══ */}
      {tabActiva === "actores" && <ActoresEcosistema />}

'''
    content = content[:start] + new_block + content[end:]
    open('app/components/ArquitecturaMetodologica.js','w',encoding='utf-8').write(content)
    print("OK — replaced %d chars" % len(old_block))
