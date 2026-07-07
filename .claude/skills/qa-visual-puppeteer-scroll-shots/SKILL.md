---
name: qa-visual-puppeteer-scroll-shots
regimen: divergente
description: Verifica visualmente animaciones scroll-driven capturando screenshots programáticos con puppeteer-core (Chrome del sistema, headless) en 3 puntos del recorrido (5/50/95%), más smoke-tests curl por ruta. Cárgala cuando haya que QA visual de una página con animaciones al hacer scroll, "capturar la animación en varios puntos", "screenshots automáticos", "verificar que las demos animan", o comprobar que las páginas responden 200 antes de revisar.
---

# QA visual de animaciones scroll-driven con Puppeteer (scroll-shots)

**Nivel actual:** N2 · **Dominio:** qa · **Agente(s):** qa-ingeniero
**Proyectos fuente:** DivergenteWEB

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Una animación **scroll-driven** (la que avanza según cuánto has scrolleado, no con el tiempo) no se puede revisar con un solo screenshot: hay que congelarla en varios puntos del recorrido. Esta skill automatiza eso con un script Node + `puppeteer-core` que:

- Lanza el **Chrome ya instalado en el sistema** (no descarga Chromium), en headless.
- Localiza cada sección animada por selector, calcula su rango de scroll y captura a **5%, 50% y 95%** del recorrido con nombres convencionales (`demoN-pXX.png`).
- Escucha `pageerror` y `console.error` para **fallar temprano** si la página rompe en runtime.

Se complementa con **smoke-tests curl por ruta** (código HTTP de cada página, fuentes y CSS) que se corren ANTES de gastar tiempo en Puppeteer: si una ruta no da 200, capturar sería inútil.

Se carga cuando el trabajo es: QA visual de scroll animations, "capturar la demo en varios puntos", regresión visual de una landing con movimiento, o verificar de golpe que todas las páginas responden.

Evidencia origen: `DivergenteWEB/.demo-shots/shoot.js` (página `/metodologias` con 3 demos de interacción de texto) y `DivergenteWEB/.claude/settings.local.json` (comandos curl reales usados en QA).

## 2. Procedimiento

1. **Arranca el dev server y confirma el puerto.** Next dev usa 3000, pero si está ocupado salta a 3001/3002 (`README.md`). El script y los smoke apuntan a un puerto fijo — verifica cuál está sirviendo de verdad antes de correr nada.

2. **Corre los smoke-tests curl primero** (activo `smoke-rutas.sh`). Un bucle por ruta con `curl -s -o /dev/null -w "%{http_code}"` más chequeo de las fuentes y el CSS hasheado. Criterio de decisión: si alguna página no da **200**, arréglala antes de capturar; un 404 de fuente/CSS anticipa una captura sin estilos (FOUT o página pelada).

3. **Instala `puppeteer-core`** (no `puppeteer` completo) para reusar el Chrome del sistema y no bajar ~150 MB de Chromium. Ajusta `CHROME` a la ruta del ejecutable local. En la fuente:
   ```js
   const puppeteer = require("puppeteer-core");
   const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
   const browser = await puppeteer.launch({
     executablePath: CHROME, headless: "new",
     args: ["--no-sandbox", "--disable-gpu"],
   });
   ```

4. **Fija viewport desktop 1440×900.** Criterio: muchas de estas demos NO se renderizan en móvil (la página tiene rama `{isMobile ? ... : <demos/>}` con `isMobile = innerWidth <= 768`, ver Gotchas). Ancho ≥ 769 es obligatorio para que existan los nodos a capturar. La altura 900 se reusa como constante del rango de scroll (paso 8).

5. **Engancha los listeners de error ANTES del goto** para no perder errores de hidratación:
   ```js
   page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
   page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE ERROR:", m.text()); });
   ```
   Criterio: cualquier `PAGE ERROR`/`CONSOLE ERROR` en la salida invalida la corrida aunque las imágenes se generen.

6. **Navega con `waitUntil: "domcontentloaded"` y luego espera 3500 ms fijos** para hidratación de React + carga de fuentes. `networkidle` no sirve aquí porque los efectos scroll se montan tras la hidratación; el sleep explícito es la red de seguridad.

7. **Localiza el contenedor de scroll y las secciones.** Ojo: en este proyecto el scroll NO es el de `window` sino un contenedor propio `[data-scroll-container]` (`h-screen overflow-y-auto`, ver `SiteShell.tsx`). Las secciones animadas son `.demo-wrap`. Mide cada una relativa al contenedor:
   ```js
   const c = document.querySelector("[data-scroll-container]");
   const wraps = [...document.querySelectorAll(".demo-wrap")].map((w) => {
     const r = w.getBoundingClientRect();
     return { top: r.top + c.scrollTop, height: r.height };
   });
   ```
   Criterio de decisión: si `!c` o `wraps.length === 0` → `process.exit(1)` (fallar, no capturar basura). Adapta los dos selectores a la página objetivo.

8. **Calcula el rango de scroll de cada sección y captura a 5/50/95%.** El recorrido útil es `span = height - 900` (altura de la sección menos el viewport, porque el `.demo-stage` es `sticky top:0 height:100vh` y la animación consume el sobrante). Para cada fracción, mueve el `scrollTop` DEL CONTENEDOR (no `window.scrollTo`), espera 600 ms a que asiente el frame, y captura:
   ```js
   const span = height - 900;
   for (const frac of [0.05, 0.5, 0.95]) {
     const y = Math.round(top + span * frac);
     await page.evaluate((yy) => { document.querySelector("[data-scroll-container]").scrollTop = yy; }, y);
     await new Promise((r) => setTimeout(r, 600));
     await page.screenshot({ path: path.join(OUT, `demo${d + 1}-p${Math.round(frac * 100)}.png`) });
   }
   ```
   Nombre convencional: `demo{N}-p{5|50|95}.png` (N = índice 1-based de la sección). Salida a `__dirname` (junto al script, carpeta `.demo-shots/`).

9. **Cierra el browser y revisa las imágenes** (con Read sobre los PNG). Contrasta 5% vs 50% vs 95%: deben diferir visiblemente; si las tres son iguales, la animación no corrió (revisa reduce-motion y el selector).

10. **Envuelve todo en `.catch` con `exit(1)`** para que un fallo del script marque la corrida como fallida en CI/consola:
    ```js
    })().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
    ```

## 3. Activos copiables

- **`activos/shoot.js`** — copia verbatim de `DivergenteWEB/.demo-shots/shoot.js`. Script completo (65 líneas) listo para adaptar. Qué cambiar al reusarlo: (a) `CHROME` a la ruta del ejecutable en la máquina destino; (b) la URL y puerto del `page.goto`; (c) los selectores `[data-scroll-container]` y `.demo-wrap`; (d) la constante `900` si cambias la altura del viewport; (e) el prefijo de nombre `demo${d+1}`. Cuándo copiarlo: cualquier QA visual de secciones scroll-driven con stage sticky.

- **`activos/smoke-rutas.sh`** — plantilla de smoke-tests curl reconstruida de los comandos reales verificados en `DivergenteWEB/.claude/settings.local.json` (chequeos HTTP por ruta + fuentes + CSS). Qué adaptar: la lista de rutas, el `BASE`/puerto, y las rutas hasheadas de `_next/static/media` y `_next/static/chunks`. Cuándo copiarlo: como paso previo barato antes de cualquier captura Puppeteer, o como health-check de un dev/preview server.

- **Referencia de estructura HTML/CSS objetivo** (no se copia, se consulta como patrón): `DivergenteWEB/app/metodologias/page.tsx` (definición de las `.demo-wrap` con alturas 220vh/200vh/220vh) y `DivergenteWEB/app/globals.css` (§ "Demos de interacción de texto": `.demo-wrap` relativa + `.demo-stage` sticky top:0 height:100vh). Sirve para entender por qué `span = height - viewportH`.

## 4. Gotchas verificados

- **El scroll no es de `window`; es de un contenedor propio.** En DivergenteWEB las subpáginas viven dentro de `<div data-scroll-container className="h-screen overflow-y-auto">` (`app/components/SiteShell.tsx:266`). Usar `window.scrollTo`/`window.scrollY` no mueve nada y las 3 capturas salen idénticas. Solución: leer y escribir `document.querySelector("[data-scroll-container]").scrollTop`. Verifica siempre si la página scrollea en window o en un contenedor antes de copiar el script.

- **Las demos no existen en viewport móvil → el script aborta con "no wraps".** `metodologias/page.tsx:36` define `isMobile = window.innerWidth <= 768` y renderiza `{isMobile ? (fallback) : (<>…demo-wrap…</>)}`. A ≤768 px de ancho no hay ningún `.demo-wrap`, `wraps.length === 0` y `shoot.js` hace `exit(1)`. Solución: viewport ≥ 769 de ancho (la fuente usa 1440×900). Este es el porqué del viewport desktop, no una preferencia estética.

- **`span = height - 900` acopla el rango de scroll a la altura del viewport.** El `900` es literal en `shoot.js` y solo es correcto porque el viewport se fijó en 900 px de alto y el `.demo-stage` es `sticky; top:0; height:100vh`. Si cambias `setViewport({height})` y olvidas el `900`, las fracciones 5/50/95% se desplazan y capturas fuera del rango animado. Solución: mantén ambos sincronizados (o deriva la altura del viewport en vez de hardcodearla).

- **Puerto del dev server a la deriva.** `shoot.js` fija `localhost:3001` pero Next arranca en 3000 y salta a 3001/3002 si está ocupado (`README.md`). Los propios comandos guardados en `settings.local.json` mezclan `:3001` y `:3002` — evidencia de que el puerto cambió entre sesiones. Solución: confirmar el puerto real (mirar la salida de `npm run dev`) y alinear script + smoke antes de correr.

- **Sin la espera de hidratación las capturas salen a medio montar.** El goto usa `waitUntil: "domcontentloaded"` (rápido) y luego un `setTimeout(3500)` explícito porque los `useEffect` que instalan los listeners de scroll corren tras la hidratación de React 19. Sin ese sleep, `.demo-wrap` puede existir pero la animación aún no está enganchada. Solución: conservar la espera fija (3500 ms hidratación + fuentes) y el `600 ms` por frame tras cada `scrollTop`.

- **`prefers-reduced-motion` apaga las animaciones.** Todos los efectos de la página se guardan con `if (reduced || reduceMotion.current) return` (`metodologias/page.tsx:34,42-48,186,374`). Si el Chrome lanzado emula reduce-motion, las demos no animan y las 3 capturas quedan iguales aunque el script "funcione". Solución: si las capturas no difieren, descartar reduce-motion antes de culpar al selector.

- **`puppeteer-core` NO trae navegador.** A diferencia de `puppeteer`, `puppeteer-core` exige `executablePath` a un Chrome ya instalado; si la ruta `C:\Program Files\Google\Chrome\Application\chrome.exe` no existe en la máquina destino, `launch` falla. Es una decisión deliberada (no bajar Chromium), no un bug — pero hay que ajustar la ruta por entorno.

## 5. Criterios de done

- [ ] Smoke-tests: todas las rutas objetivo devuelven **200**; fuentes y CSS principales devuelven 200 (sin 404).
- [ ] La salida del script NO contiene ninguna línea `PAGE ERROR:` ni `CONSOLE ERROR:`.
- [ ] Se generó el set completo de imágenes `demo{N}-p{5,50,95}.png` para cada sección detectada (3 por sección).
- [ ] El script imprimió el JSON de `info` con `scrollHeight` y todos los `wraps` (top/height) — no cayó en la rama `exit(1)` de "no scroll container / no wraps".
- [ ] Al abrir las imágenes, los 3 puntos (5/50/95%) de cada sección **difieren visiblemente** entre sí (prueba de que la animación avanzó con el scroll).
- [ ] El proceso terminó con `DONE …` y código de salida 0 (no `FAIL:`).

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | DivergenteWEB | uso original (fuente de esta skill) | ok | - |
