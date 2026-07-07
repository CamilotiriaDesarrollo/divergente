# Plataforma PNMC — Entorno Virtual del Plan Nacional de Música para la Convivencia

Espacio de trabajo completo del proyecto: la plataforma, su documentación, la planeación y el marco normativo del Ministerio de las Culturas, las Artes y los Saberes.

> **🧭 Punto de entrada: descarga/clona este repositorio y abre [`BLUEPRINT_PNMC.html`](BLUEPRINT_PNMC.html) en tu navegador.**
> Es el mapa total de la plataforma, con rutas guiadas para cualquier perfil (directivo, gestor, desarrollador, tecnología), el paso a paso de despliegue y todos los documentos hipervinculados.

## Estructura del repositorio

| Carpeta / archivo | Qué es |
| --- | --- |
| [`Entorno_Virtual_PNMC/`](Entorno_Virtual_PNMC/) | **La plataforma** (monorepo): frontend `pnmc-web/`, backend `pnmc-api/`, base de datos `pnmc-database/` y documentación `docs/` |
| [`normativa/`](normativa/) | Biblioteca normativa: las 6 políticas del Ministerio en versión operativa con checklists de cumplimiento |
| [`BLUEPRINT_PNMC.html`](BLUEPRINT_PNMC.html) | **Mapa maestro** de toda la plataforma (abrir en navegador) |
| [`PLAN_DE_TRABAJO_PNMC.md`](PLAN_DE_TRABAJO_PNMC.md) | Plan de trabajo detallado: 6 fases, tiempos, entregables y checklists |
| [`PLAN_DE_TRABAJO_PNMC.html`](PLAN_DE_TRABAJO_PNMC.html) | Versión presentación del plan (abrir en navegador) |
| [`ARQUITECTURA_PNMC.html`](ARQUITECTURA_PNMC.html) | Anexo de arquitectura: estado actual y evolución (abrir en navegador) |
| [`Iniciar-PNMC.ps1`](Iniciar-PNMC.ps1) | Script de arranque del entorno local en Windows |

## Inicio rápido (entorno local en Windows)

1. **Prerrequisitos**: Node.js 18+, SDK de .NET 10, SQL Server LocalDB (o Express) y sqlcmd.
2. **Base de datos**: crear `PNMC_LOCAL` y ejecutar los 16 scripts de `Entorno_Virtual_PNMC/pnmc-database/` (9 de `schema/` + 7 de `seed/`, en orden) y `EXEC dbo.sp_ActualizarMetricasMapa;`
3. **Arrancar**: ejecutar `Iniciar-PNMC.ps1` (levanta base de datos, API en `http://localhost:8080` y frontend).
4. **Detalle completo, notas de instalación y credenciales de desarrollo**: sección 5 del [Blueprint](BLUEPRINT_PNMC.html).

## Origen del código

La carpeta `Entorno_Virtual_PNMC/` parte de la entrega técnica del prototipo del Entorno Virtual (repositorio de handoff del PNMC) e incorpora los ajustes de este espacio de trabajo. La hoja de ruta para llevarlo a producción en el Ministerio está en el [plan de trabajo](PLAN_DE_TRABAJO_PNMC.md).

---

*Documento vivo del proyecto — se actualiza con cada hito del plan de trabajo.*
