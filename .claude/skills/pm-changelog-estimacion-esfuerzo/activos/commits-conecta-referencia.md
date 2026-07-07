# Historial git como documentación de decisiones — Plataforma Conecta

Extracto real (`git log`) del repo `Plataforma Conecta` (rama `main`, remoto `circularutas`).
Muestra la convención de **commits convencionales en español** cuyo cuerpo documenta
el **porqué** y las **métricas** (kB ahorrados, líneas eliminadas). Distribución real de
tipos en el repo: 5 `fix`, 3 `feat`, 2 `refactor`, 2 `chore`, 1 `perf`, 1 `docs`.

Convención de prefijos usada: `feat` · `fix` · `refactor` · `perf` · `chore` · `docs`.
Asunto en imperativo, en minúscula, en español; cuerpo con viñetas de qué + porqué + métrica.

---

### perf: code-splitting de la ventana internacional y vendors  (2c54d2a)
> Métrica y porqué en el cuerpo. Un buen commit `perf` SIEMPRE cuantifica la mejora.
```
- Carga InternacionalizacionPage con React.lazy/Suspense (difiere ~48 kB y su dataset)
- Separa react y leaflet en chunks propios (manualChunks) para mejor cache
- Elimina el warning de chunk > 500 kB; bundle inicial mas liviano
```

### refactor: modulariza index.css en parciales por seccion  (611f0df)
> Refactor con prueba de no-regresión en el propio mensaje ("byte-identico por hash").
```
Divide el index.css monolitico (5.594 lineas) en src/styles/ por seccion
(base, tirillaF, footer, homeLanding, mapaCirculacion, internacionalizacion)
reimportados en orden via @import. El CSS compilado es byte-identico al previo
(verificado por hash); corrige la ruta relativa del fondo bailarines.jpg.
```

### refactor: elimina componentes y CSS sin uso (variantes tirilla)  (6049cf8)
> Métrica de limpieza: líneas eliminadas + delta de bundle.
```
Variantes de exploracion de diseno nunca importadas desde el grafo de la app:
- Elimina tirillaA/B/C/D/G y tirillaStatic (sin referencias)
- Elimina sus bloques CSS muertos en index.css (~528 lineas; bundle CSS 104->96 kB)
Se conserva tirillaF (componente vivo) con su README y estilos.
```

### fix: corrige anti-patrones de React/TS  (df71bfb)
> Fix con lista de casos concretos + prueba de que no cambia comportamiento.
```
- MapaCirculacion: reemplaza 3 'any' por tipos Feature/FeatureCollection de geojson
- MapaCirculacion: mueve la escritura de ref fuera del render a un useEffect
- ecosistema: reset de pagina con ajuste de estado en render en vez de useEffect
Sin cambios de comportamiento; tsc y vite build verdes.
```

### fix: resuelve warnings de exhaustive-deps en hooks  (a2eb1e6)
```
- tirillaF: reset de escalas con forma funcional (sin dep de sistemasFixed)
- InternacionalizacionPage: incluye 'ref' en deps del efecto de scroll
- MapaCirculacion: quita dep redundante 'dept' de onEachFeature
```

### chore: documenta enlaces placeholder y card pendientes de a11y  (65e849c)
> Deuda técnica registrada en el commit: qué queda pendiente y su condición de cierre.
```
Marca con eslint-disable + TODO los 14 enlaces href=# (footer, header, logos)
que esperan URLs reales, y la card de eventos que requiere rediseno de
interaccion por teclado. Mantiene la semantica <a> y deja el lint en 0,
con el backlog de cableado visible en el codigo.
```

### chore: configura ESLint, Prettier y EditorConfig  (79c329a)
```
Agrega tooling de calidad de codigo para client y server:
- ESLint 9 (flat config) con typescript-eslint; jsx-a11y/react-hooks en client
- Prettier + EditorConfig + .gitattributes (LF) para estilo consistente
- Scripts lint/format en ambos package.json
- Primera pasada de formateo sobre los archivos sin cambios de logica
```

### feat: seccion Ecosistema de Circulacion con carrusel paginado  (592f65f)
```
- Nuevo componente ecosistema.tsx + datos en iniciativas.ts
- Carrusel paginado: 8 cards cuadradas por pagina (2x4), flechas circulares y dots agrandados
- Cards blancas con velo tenue del color de cada direccion
- Seccion fija a una pantalla (height:100vh); paginacion en vez de scroll
- Limpieza: elimina modulos.ts y ModuloPlaceholder.tsx (sin uso)
```

### Cadena de 3 fix consecutivos de despliegue (documenta el problema resuelto en el asunto)
> Serie real de iteraciones para hacer funcionar Vercel — cada asunto nombra la causa.
```
06e8f61  fix: corrige buildCommand en vercel.json para Root Directory = client
77bc0a8  fix: vercel.json con rutas explícitas desde raíz del repo
65d5ddd  fix: corrige errores TypeScript que bloqueaban el build en Vercel
```
