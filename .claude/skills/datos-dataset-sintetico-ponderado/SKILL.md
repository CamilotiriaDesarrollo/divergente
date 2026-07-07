---
name: datos-dataset-sintetico-ponderado
regimen: universal
description: Genera datasets sintéticos realistas con distribuciones ponderadas (helper mkDist) para validar dashboards, filtros multinivel y mapas coropléticos antes de conectar la fuente real. Cargar cuando haya que poblar un dashboard o prototipo con datos plausibles de dominio, probar filtros cruzados sin backend, o simular registros con nomenclatura institucional (IDs tipo DA-INV-001-18) y concentración territorial realista.
---

# Dataset sintético ponderado

**Nivel actual:** N2 · **Dominio:** datos (Datos y Scraping) · **Agente(s):** `datos-bd`
**Proyectos fuente:** Plataforma GEDII

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Cuando un dashboard con filtros multinivel, KPIs y mapa se construye ANTES de que exista la fuente de datos real (caso GEDII: dashboard de 100 investigaciones del Ministerio de las Culturas construido antes de tener el inventario oficial), se necesita un dataset sintético que:

- Tenga **distribuciones realistas por dimensión** (no uniformes): la categoría dominante debe dominar, la cola larga debe existir, para que barras, nubes de palabras y mapa se vean como se verán con datos reales.
- Sea **100% determinista** (sin `Math.random`): mismo dataset en cada render — crítico en Next.js `'use client'` para evitar mismatches de hidratación, y para que las validaciones visuales de QA sean reproducibles.
- Use **nomenclatura institucional plausible** (IDs, títulos del dominio) para que el prototipo sea creíble ante el usuario piloto y la Mesa Técnica.
- Se sustituya por la fuente real **sin tocar el dashboard**: un único `export const` con la misma forma de registro.

Evidencia central: `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataforma GEDII/app/components/dashboard.js` (líneas 34-138).

## 2. Procedimiento

1. **Fijar N y las dimensiones.** N = tamaño del dataset (GEDII: 100 — número redondo facilita que los pesos sean porcentajes). Cada filtro del dashboard es una dimensión del registro. En GEDII: `año`, `dependencia`, `departamentos[]`, `estado`, `temas[]`, `tipo`, `metodologia`, `alcance`, `comunidad[]`.

2. **Escribir el helper `mkDist`** (1 línea):
   ```js
   const mkDist = (pairs) => pairs.flatMap(([v, n]) => Array(n).fill(v));
   ```
   Expande pares `[valor, peso]` en un array plano donde cada valor aparece `peso` veces.

3. **Definir una distribución ponderada por dimensión categórica**, con pesos que **sumen exactamente N**. Así `DIST[i]` es un lookup directo sin módulo. Ejemplo real (dashboard.js:37-43):
   ```js
   const DEPS_DIST = mkDist([
     ["Dirección de Artes", 32], ["Patrimonio y Memoria", 24], ["Planeación", 18],
     ["Biblioteca Nacional", 12], ["Música y Danzas", 8], ["Comunicaciones", 4],
     ["Investigación Cultural", 2],
   ]); // 32+24+18+12+8+4+2 = 100 = N
   const EST_DIST = mkDist([["Finalizada", 50], ["En curso", 25], ["Planeada", 25]]);
   ```
   **Criterio para asignar pesos:** reflejar la realidad conocida del dominio, no la comodidad. En GEDII la mitad de las investigaciones están finalizadas; los años recientes pesan más (2022→20, 2018→8); el tipo más común (Diagnóstico, 28) triplica al menos común (Monitoreo, 6).

4. **Dimensión territorial: array literal de conjuntos con concentración realista.** No se pondera con `mkDist` sino con repetición explícita + combinaciones multi-territorio (dashboard.js:65-100): Bogotá D.C. 10 entradas (~10%), Antioquia 8, Valle del Cauca 5, Atlántico 4… (55 entradas de un solo departamento) y luego 45 combinaciones de 2 y 3 departamentos (`["Bogotá D.C.","Cundinamarca"]`, `["Valle del Cauca","Cauca","Nariño"]`) que simulan proyectos multi-territorio y garantizan que TODO departamento del país tenga al menos una aparición (el mapa coroplético no queda con huecos artificiales). Como el array se construye a mano (no con `mkDist`) y su longitud no queda garantizada por construcción, se indexa defensivamente con `DEPTS_SETS[i % DEPTS_SETS.length]` — en GEDII tiene exactamente 100 entradas = N, pero el módulo evita `undefined` si N llegara a superar la longitud.
   **Criterio:** si los pesos suman N → índice directo `DIST[i]`; si no → módulo. Nunca mezclar sin verificar la suma (ver gotcha 2).

5. **Pool de títulos plausibles del dominio** (~20, dashboard.js:102-123): frases que un experto del sector reconocería ("Caracterización del sector musical colombiano", "Inventario del patrimonio inmaterial"). Al ciclar el pool para N > pool, desambiguar con sufijo: `TITULOS[i%20] + (i>=20 ? ` · Vol. ${Math.floor(i/20)+1}` : '')` — evita duplicados exactos en listados de "últimas investigaciones".

6. **IDs con nomenclatura institucional** (dashboard.js:126): formato `DA-INV-001-18` = sigla dependencia + tipo + correlativo con `padStart(3,'0')` + año en 2 dígitos. **El año embebido debe salir del MISMO `AÑO_DIST[i]` que alimenta el campo `año`** del registro; si se genera por separado, el ID contradice el filtro de año.

7. **Dimensiones multivalor como arrays de conjuntos ponderados** (dashboard.js:59-63): `COMUNIDAD_SETS` pondera arrays (incluidas combinaciones `[["General","Indígena"],5]`). Para pares derivados de un pool, usar offset + dedup defensivo (dashboard.js:132-133):
   ```js
   temas: [TEMAS_POOL[i%9], TEMAS_POOL[(i+3)%9]].filter((v,idx,a) => a.indexOf(v)===idx)
   ```

8. **Generar con `Array.from` y exportar una sola constante** (dashboard.js:125-138): `export const INVESTIGATIONS = Array.from({ length: 100 }, (_, i) => ({...}))`. El dashboard solo conoce `INVESTIGATIONS`; conectar la fuente real = reemplazar ese export.

9. **Validar contra el dashboard con el patrón de 3 conjuntos filtrados** (dashboard.js:1005-1022): `filteredNoTerr` (todos los filtros menos territorio — alimenta los conteos del mapa), `filteredBase` (todos menos dependencia — alimenta las barras de dependencia), `filtered` (todos). Probar que cada filtro tiene ≥2 valores con resultados y que los cruces no vacían el dashboard.

## 3. Activos copiables

| Activo | Qué es | Cuándo copiarlo / qué adaptar |
|---|---|---|
| `activos/generador-dataset-ponderado.js` | Extracto fiel y autónomo del generador (dashboard.js líneas 34-145 de GEDII): `mkDist`, 7 distribuciones, `DEPTS_SETS`, `TITULOS`, `INVESTIGATIONS`, `freq()` | Base de cualquier dataset sintético nuevo. Adaptar: valores y pesos por dimensión, pool de títulos del dominio, formato de ID, N |
| `activos/dashboard-gedii-referencia.js` | Copia completa de `Plataforma GEDII/app/components/dashboard.js` (60 KB) | Referencia de cómo el dataset alimenta KPIs, filtros multinivel y el patrón `filteredNoTerr`/`filteredBase`/`filtered` (líneas 1005-1022). No copiar entero a un proyecto: extraer el patrón |
| `activos/MapaColombiaInner-consumo-geojson.js` | Copia de `Plataforma GEDII/app/components/MapaColombiaInner.js` | Muestra cómo el mapa consume `departamentos[]` del dataset y el alias `DEPT_ALIAS` que reconcilia nombres con el GeoJSON (línea 5) |

Origen verificado de todos: `C:/Users/camil/Desktop/IA Raiz Proyectos/002 Desarrollos/Plataforma GEDII/app/components/`. El GeoJSON compañero (32 departamentos + Bogotá D.C.) está en `Plataforma GEDII/public/colombia-depts.json`.

## 4. Gotchas verificados

1. **Los nombres territoriales del dataset no coinciden con el GeoJSON.** El dataset usa `"Bogotá D.C."` (con espacio) pero la propiedad `NAME_1` del GeoJSON trae `"BogotáD.C."` (sin espacio): el departamento quedaba sin colorear en el mapa. Solución real: mapa de alias en `MapaColombiaInner.js` línea 5 — `const DEPT_ALIAS = { "BogotáD.C.": "Bogotá D.C." };` aplicado en cada feature (`DEPT_ALIAS[raw] || raw`). Evidencia: `Plataforma GEDII/app/components/MapaColombiaInner.js:5,40-41,93-94`.

2. **Si los pesos no suman N, `DIST[i]` devuelve `undefined` silenciosamente.** Con índice directo, el registro 99 lee `DIST[99]`: si los pesos suman 95, los últimos 5 registros salen con campos `undefined` que rompen `freq()` y los filtros. En GEDII TODAS las listas de pesos suman exactamente 100 (verificable en dashboard.js:37-63) y el único array construido a mano en vez de con `mkDist` (`DEPTS_SETS`, 100 entradas = N) se indexa con módulo por seguridad (`dashboard.js:130`). Regla: sumar los pesos antes de usar índice directo; si no cuadra, módulo.

3. **Las barras del filtro colapsan al seleccionar su propio valor.** Al filtrar por dependencia, si las barras de dependencia se calculan sobre el conjunto ya filtrado, todas las demás caen a 0 y no se puede cambiar de selección. Solución real documentada en el propio código: comentario `// filteredBase: all filters except fDep — dep bars use this so they don't collapse on dep select` — cada grupo de controles se calcula sobre el conjunto filtrado por TODO menos su propia dimensión (mismo patrón para territorio con `filteredNoTerr`). Evidencia: `Plataforma GEDII/app/components/dashboard.js:1005-1022,1037`.

4. **Ciclar el pool de títulos produce duplicados exactos que delatan el dato falso.** Con N=100 y 20 títulos, cada título aparecería 5 veces idéntico en los listados. Solución real: sufijo `· Vol. ${Math.floor(i/20)+1}` a partir de i≥20. Evidencia: `Plataforma GEDII/app/components/dashboard.js:127`.

5. **Pares de temas derivados del mismo pool pueden duplicarse dentro del registro.** El par `[pool[i%L], pool[(i+3)%L]]` colisionaría si se cambia el tamaño del pool a un divisor del offset; GEDII lo blinda con dedup en línea: `.filter((v,idx,a) => a.indexOf(v)===idx)`. Evidencia: `Plataforma GEDII/app/components/dashboard.js:132-133`.

6. **Aleatoriedad en módulo cliente = riesgo de hidratación.** El generador vive a nivel de módulo en un componente `'use client'` de Next.js; GEDII no usa `Math.random` ni `Date.now` en ninguna parte de la generación — el dataset es idéntico en servidor y cliente y entre recargas, lo que además hace estables los baselines visuales de QA. Evidencia: `dashboard.js:34-138` (cero llamadas a `Math.random`).

## 5. Criterios de done

- [ ] `mkDist` definido y **cada lista de pesos suma exactamente N** (verificar con una suma rápida; si un array no suma N, su acceso usa `% length`).
- [ ] Dos ejecuciones/renders producen un dataset **bit a bit idéntico** (sin `Math.random`, `Date.now` ni orden dependiente del entorno).
- [ ] Los IDs siguen la nomenclatura institucional acordada y **el año embebido en el ID coincide con el campo año** del mismo registro.
- [ ] Los valores territoriales coinciden 1:1 con los del GeoJSON/catálogo maestro, o existe un mapa de alias documentado junto al consumidor (patrón `DEPT_ALIAS`).
- [ ] Ningún título se repite exacto en el listado (sufijo de desambiguación aplicado) y ningún registro tiene valores duplicados dentro de sus campos multivalor.
- [ ] Cada filtro del dashboard muestra ≥2 valores con conteo > 0, y los controles de cada dimensión se calculan sobre el conjunto filtrado por todo-menos-su-dimensión (no colapsan al seleccionar).
- [ ] Cero datos personales o reales sensibles: títulos, dependencias y comunidades son sintéticos o públicos.
- [ ] El dataset se expone como **un único `export const`** cuya forma de registro está pactada con el consumidor, de modo que conectar la fuente real no toque el dashboard.

## Registro de uso

| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Plataforma GEDII | uso original (fuente de esta skill) | ok | - |
