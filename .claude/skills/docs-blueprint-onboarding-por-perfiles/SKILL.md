---
name: docs-blueprint-onboarding-por-perfiles
regimen: universal
description: Produce el documento de entrada de un proyecto — un blueprint HTML autocontenido con rutas guiadas por perfil (directivo, gestor, desarrollador, operaciones) más un correo formal de handoff con la ruta de montaje verificada. Cárgala cuando haya que entregar/onboardar una plataforma a un equipo nuevo o al cliente, escribir el "punto de entrada único" de un repo, o preparar un correo de despliegue paso a paso.
---

# Blueprint de onboarding por perfiles + correo de handoff

**Nivel actual:** N2 · **Dominio:** docs · **Agente(s):** documentador
**Proyectos fuente:** PNMC SIMUS (Plan Nacional de Música para la Convivencia)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Resuelve el problema del "documento de entrada": cuando una plataforma ya existe pero nadie externo sabe qué es, cómo se despliega ni dónde está cada documento. Produce **dos entregables complementarios** que reemplazan una sesión de contexto de horas:

1. **Blueprint HTML autocontenido** (`BLUEPRINT_PNMC.html`): un solo archivo que abre por doble clic en cualquier navegador, **sin dependencias externas** (no CDN, no fuentes remotas, no imágenes externas — CSS 100% inline). Es la "única fuente de verdad" de navegación del proyecto: rutas por perfil, módulos/roles, arquitectura, despliegue verificado, mapa documental hipervinculado, credenciales de desarrollo y glosario.
2. **Correo de handoff** (`CORREO_DESPLIEGUE_PNMC.md`): texto plano con secciones numeradas ASCII, ruta de montaje verificada de punta a punta y notas de trazabilidad de errores ya resueltos. Es la ruta de entrada por correo que apunta al blueprint.

Se carga cuando el Dueño pide: "dame un blueprint / documento de entrada del proyecto", "arma el correo de despliegue para el equipo", "documenta cómo montar esto en local", "un documento que sirva a cualquier perfil". **Meta medible explícita:** una persona nueva corre la plataforma en ~30 minutos siguiendo el blueprint.

## 2. Procedimiento

1. **Inventaría antes de escribir.** Recorre el repo y lista: piezas del stack (frontend/backend/BD/docs), módulos, roles, scripts de despliegue, y TODOS los `.md`/`.html` de documentación. Estos alimentan la sección "Mapa documental". No inventes documentos que no existan.

2. **Ejecuta el despliegue tú mismo, de punta a punta, en la máquina real.** El paso a paso NO se copia de docs heredadas; se ejecuta y se anota lo que realmente pasó (puertos que anuncia el dev server, errores de seeds, orden de dependencias). El valor entero del blueprint es que su ruta está *verificada* — ver bloque 4.

3. **Verifica las credenciales contra el código sembrado, no contra la documentación previa.** Abre el bootstrap/seed real y confirma usuarios y contraseñas. En PNMC la doc heredada decía `pnmc-master` y la vigente era `admin` (gotcha 3).

4. **Escribe el blueprint HTML con esta estructura fija** (10 secciones, en este orden — es la que probó funcionar en `BLUEPRINT_PNMC.html`):
   - Banda **KPI** arriba (6 cifras que dan escala: módulos, roles, estados, registros, scripts, políticas).
   - **1 · Rutas por perfil** — 4 tarjetas `.ruta`, cada una una lista ordenada de anclas internas. Perfiles: `👔 Directivo / no técnico`, `📋 Gestor / líder funcional`, `💻 Desarrollador`, `🖥️ Tecnología / operaciones`. Criterio: cada ruta ordena la MISMA información según lo que ese perfil necesita primero (el directivo empieza por "Qué es", el desarrollador por "Arquitectura + despliegue").
   - **2 · Qué es (lenguaje simple)** — sin jerga; 3 tarjetas de propósito.
   - **3 · Módulos y roles** — tablas de módulos y de roles (RBAC), y el diagrama del flujo editorial con `.estado` chips.
   - **4 · Arquitectura** — tabla de piezas + bloque `<pre>` "Cómo fluye una petición"; enlaza al anexo `ARQUITECTURA_PNMC.html`.
   - **5 · Despliegue paso a paso verificado** — pasos `.paso` numerados, con notas de troubleshooting (`<span class="chip am">Nota</span>`) y tabla de credenciales de desarrollo con advertencia.
   - **6 · Mapa documental** — tablas con **hipervínculos relativos** a cada `.md`/`.html`, agrupados por audiencia.
   - **7 · Plan de trabajo (resumen)** — tabla de fases; enlaza al plan extendido.
   - **8 · Marco normativo** — tarjetas; marca decisiones críticas pendientes con `.tarjeta.alerta`.
   - **9 · Estado actual** — dos columnas honestas: `✅ Funciona hoy (verificado en local)` vs `🔧 Pendiente (en el plan)`. Nunca atribuyas lo no implementado.
   - **10 · Glosario** — `<dl>` para no desarrolladores.
   - Arriba, un `<nav>` **sticky** con anclas que coinciden 1:1 con los `id` de sección.

5. **Escribe el correo de handoff** replicando la filosofía del blueprint pero en texto: secciones numeradas con separadores ASCII (`====`), y este orden probado: 1 Repositorio · 2 Estructura · 3 Prerrequisitos · 4 Montaje ruta recomendada · 5 Montaje alternativo (contenedores) · 6 Verificación y credenciales · 7 **Notas técnicas ya resueltas (por trazabilidad)** · 8 Documentación: qué consultar y dónde (orden de lectura) · 9 Recomendaciones. La sección 7 documenta errores ya corregidos "por si trabajan con una copia más antigua".

6. **Copia el archivo de arranque** (script que levanta todo tras un reinicio) y enlázalo desde el paso final del despliegue como "atajo".

7. **Cierra con verificación viva:** confirma que el HTML abre sin conexión, que los enlaces relativos resuelven desde la carpeta del blueprint, y marca el documento como "vivo — se actualiza con cada hito".

## 3. Activos copiables

Todos en `activos/` de esta skill (copiados de PNMC SIMUS; el blueprint se limpió del prompt que traía pegado antes de `<!DOCTYPE`).

- **`activos/BLUEPRINT_PNMC.html`** — plantilla maestra del blueprint (435 líneas, autocontenido). Cópiala y reemplaza contenido conservando la estructura de 10 secciones, el `<nav>` sticky y las clases CSS. Adaptar: cifras KPI, nombres de módulos/roles, pasos de despliegue, filas del mapa documental, glosario. Origen: `Plan Nacional de Musica SIMUS/BLUEPRINT_PNMC.html`. La paleta institucional está en `:root` (cámbiala por la del cliente):
  ```css
  :root{ --morado:#291242; --morado2:#4a2a6e; --verde:#00DA5E; --verde2:#0a8a44;
         --gris:#f4f2f8; --texto:#2b2b35; --linea:#cfc6e0; --azul:#1565c0;
         --ambar:#8a6d00; --rojo:#b3261e; }
  ```
  Molde de una ruta por perfil (repetir 4 veces dentro de `.tarjetas`):
  ```html
  <div class="ruta"><h4>💻 Desarrollador</h4><ol>
    <li>Lee la <a href="#arquitectura">arquitectura</a> y abre el <a href="ARQUITECTURA_PNMC.html">anexo</a></li>
    <li>Sigue el <a href="#despliegue">paso a paso de despliegue local</a></li>
  </ol></div>
  ```

- **`activos/CORREO_DESPLIEGUE_PNMC.md`** — plantilla del correo de handoff (235 líneas). Cópiala y adapta URL del repo, prerrequisitos, pasos y credenciales. Conserva los separadores ASCII y la sección 7 de trazabilidad. Origen: `Plan Nacional de Musica SIMUS/CORREO_DESPLIEGUE_PNMC.md`.

- **`activos/ARQUITECTURA_PNMC.html`** — plantilla de **anexo de arquitectura** con diagramas en HTML/CSS puro (cajas `.caja`, capas `.capa`) y **análisis de factores con veredicto** (`.veredicto`) para justificar decisiones tipo monolito-vs-microservicios. Úsala cuando el proyecto necesite defender una decisión arquitectónica. Origen: `Plan Nacional de Musica SIMUS/ARQUITECTURA_PNMC.html`.

- **`activos/Iniciar-PNMC.ps1`** — script PowerShell de arranque multiproceso (LocalDB + API .NET + Vite en ventanas separadas con `Start-Process`). Es el "atajo" que enlaza el paso final del despliegue. Adaptar rutas, puertos y variables de entorno. Origen: `Plan Nacional de Musica SIMUS/Iniciar-PNMC.ps1`.

- **`activos/README_repo_portada.md`** — portada del repo que declara el blueprint como punto de entrada único (`🧭 Punto de entrada: abre BLUEPRINT.html`) con tabla de estructura e inicio rápido. Origen: `Plan Nacional de Musica SIMUS/README.md`.

## 4. Gotchas verificados

1. **El paso a paso NO puede ser aspiracional: se ejecuta.** El seed de la consola de moderación (`V20260519_07__datos_moderacion_consola.sql`) fallaba en instalaciones nuevas porque el backend solo creaba 2 de los 6 usuarios base y ese seed referencia `IdUsuario 4-7`. Solución documentada: arrancar el backend con `Database__SeedBootstrapUsers=true` (crea los 6) *antes* de correr el seed 07. Si escribes el orden sin ejecutarlo, el lector se estrella. Evidencia: `CORREO_DESPLIEGUE_PNMC.md` §7a y PASO 4; `BLUEPRINT_PNMC.html` paso 3 (nota ámbar).

2. **Credenciales: verifica contra el código, no contra docs heredadas.** La documentación original del repo decía contraseñas tipo `pnmc-master`; la vigente de todas las cuentas demo era `admin`. Un blueprint que copia la doc vieja hace perder el arranque. Regla: abre el bootstrap/seed real y confirma. Evidencia: `BLUEPRINT_PNMC.html` §5, nota de credenciales (`la documentación original… está desactualizada`).

3. **Errores de motor de BD que rompen el seed silenciosamente.** El script `V20260525_02` (roles y aliados) fallaba en SQL Server 2016: `sp_rename` sobre la columna `RolEnEntidad` con una restricción `CHECK` vigente. Solución: el script suelta el CHECK heredado antes de renombrar a `RolAliado` y es idempotente. Documéntalo en la nota del paso, no lo omitas. Evidencia: `CORREO_DESPLIEGUE_PNMC.md` §7b; `BLUEPRINT_PNMC.html` paso 2 (nota ámbar).

4. **`sqlcmd` reciente no resuelve `(localdb)\MSSQLLocalDB`.** Workaround que debe ir en el blueprint: obtener la tubería con nombre con `SqlLocalDB info MSSQLLocalDB` y usarla como servidor: `sqlcmd -S "np:\\.\pipe\LOCALDB#XXXX\tsql\query"`. Sin esta nota, el lector con una versión nueva no puede sembrar. Evidencia: `CORREO_DESPLIEGUE_PNMC.md` §7 (Nota sobre sqlcmd).

5. **CORS/puertos del frontend local.** Se resuelve dejando `VITE_API_BASE_URL=` **vacío** en `pnmc-web/.env` para que las llamadas pasen por el proxy de Vite (`/api`, `/health`, `/swagger` → `:8080`); así funciona en cualquier puerto que Vite anuncie (5173/5175). El blueprint debe decir "el puerto que anuncie Vite", no fijar 5173. Evidencia: `BLUEPRINT_PNMC.html` paso 4; `CORREO_DESPLIEGUE_PNMC.md` §6.

6. **Scripts de arranque atados a un SO.** Los scripts originales eran `.command`/bash (macOS) y el equipo trabajaba en Windows. Solución: `Iniciar-PNMC.ps1` (PowerShell con `Start-Process`) para la ruta Windows sin contenedores, dejando la ruta bash/Docker como alternativa (sección 5 del correo). Da SIEMPRE la ruta del SO real del equipo como "recomendada". Evidencia: `activos/Iniciar-PNMC.ps1`.

7. **Higiene del HTML entregable.** El archivo fuente `BLUEPRINT_PNMC.html` traía el prompt del Dueño pegado *antes* de `<!DOCTYPE html>` (la copia en `activos/` ya está limpia). Al generar/entregar: el archivo debe empezar exactamente en `<!DOCTYPE html>` y ser autocontenido (ningún `<link>`/`<script>`/`<img>` a host externo) para que abra por doble clic sin conexión. Verifícalo antes de entregar.

## 5. Criterios de done

- [ ] El blueprint **abre por doble clic sin conexión**: empieza en `<!DOCTYPE html>`, todo el CSS es inline y no hay recursos externos (CDN/fuentes/imágenes remotas).
- [ ] Están las **4 rutas por perfil** (directivo, gestor, desarrollador, tecnología/operaciones), cada una como lista ordenada de anclas internas que existen como `id` de sección.
- [ ] El `<nav>` sticky tiene un ancla por sección y **cada `href="#..."` resuelve** a un `id` real.
- [ ] El **paso a paso de despliegue se ejecutó de punta a punta** en la máquina real; incluye el troubleshooting observado (dependencias de seeds, tubería de sqlcmd, proxy de Vite) — no es copia de docs heredadas.
- [ ] Las **credenciales fueron verificadas contra el código sembrado** y llevan advertencia (solo local / rotar antes de compartir); no hay secretos ni datos personales reales.
- [ ] El **mapa documental** enlaza con rutas **relativas** que resuelven desde la carpeta del blueprint; no lista documentos inexistentes.
- [ ] La sección "Estado actual" separa **Funciona hoy (verificado)** de **Pendiente**; nada no implementado se presenta como hecho.
- [ ] El **correo de handoff** replica: secciones numeradas ASCII, ruta de montaje verificada, sección 7 de trazabilidad de errores resueltos y orden de lectura sugerido; apunta al blueprint como punto de entrada.
- [ ] Declara la **meta medible** ("persona nueva corre la plataforma en ~30 min") y el documento se marca como vivo.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | PNMC SIMUS | uso original (fuente de esta skill) | ok | - |
