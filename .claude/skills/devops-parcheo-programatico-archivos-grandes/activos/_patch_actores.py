content = open('app/components/ArquitecturaMetodologica.js','r',encoding='utf-8').read()

# Find the actores placeholder tab and replace it
old = '''      {/* ═══ TAB: CARACTERIZACIÓN DE ACTORES ═══ */}
      {tabActiva === "actores" && (
        <div style={{ padding:"28px 36px 48px" }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:P.soft, textTransform:"uppercase", letterSpacing:"1px", marginBottom:5 }}>Próximamente</div>
            <h2 style={{ margin:0, fontFamily:"\'Barlow Condensed\',Impact,sans-serif", fontWeight:900, fontSize:"clamp(18px,2vw,28px)", color:P.ink, textTransform:"uppercase", lineHeight:1 }}>Caracterización de actores</h2>
            <p style={{ margin:"10px 0 0", fontSize:13, color:P.soft, lineHeight:1.65 }}>Esta sección contendrá la caracterización de los actores del sector cultural: artistas, gestores, investigadores, comunidades, instituciones y redes. En construcción.</p>
          </div>
        </div>
      )}'''

new = r'''      {/* ═══ TAB: CARACTERIZACIÓN DE ACTORES ═══ */}
      {tabActiva === "actores" && <ActoresEcosistema />}'''

content = content.replace(old, new, 1)
open('app/components/ArquitecturaMetodologica.js','w',encoding='utf-8').write(content)
print("placeholder replaced:", old in open('app/components/ArquitecturaMetodologica.js','r',encoding='utf-8').read() == False)
