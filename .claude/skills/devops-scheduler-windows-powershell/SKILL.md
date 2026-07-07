---
name: devops-scheduler-windows-powershell
regimen: divergente
description: Despliega pipelines Python desatendidos en Windows sin servidor, usando Task Scheduler + PowerShell con logging UTF-8 correcto. Cárgala al automatizar un script recurrente en un PC Windows (scrape/ETL/reporte programado), registrar/quitar una tarea del Programador de tareas, o cuando los logs de un job salgan con caracteres basura (UTF-16 / tildes rotas / "NativeCommandError").
---

# DevOps Scheduler — Windows Task Scheduler + PowerShell

**Nivel actual:** N2 · **Dominio:** DevOps y Despliegue · **Agente(s):** `datos-scraping` (titular), disponible para `devops-plataforma`
**Proyectos fuente:** Scraper-Empleos

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Correr un pipeline Python de forma **desatendida en un PC Windows de escritorio** (no servidor, sin cron, sin Docker), sobreviviendo a que el equipo esté apagado a la hora del disparo. Resuelve tres cosas que siempre se rompen en este escenario:

1. **Registro idempotente** de la tarea en Windows Task Scheduler desde un `.ps1` versionado (no a mano en el GUI), con opción de desregistrar.
2. **Wrapper** que resuelve la raíz del proyecto por sí solo (portable entre PCs) y activa flags condicionalmente (ej. `--upload` solo si existen credenciales).
3. **Logging legible**: PowerShell 5.1 corrompe la salida de Python a UTF-16 mixto con `*>>`; hay que forzar UTF-8 real por dos vías distintas (PowerShell y Python).

Se carga cuando el pedido es "que esto corra solo los lunes y jueves", "programa el scrape", "el job de Windows deja logs ilegibles", o "monta esto en un PC nuevo sin que yo toque el Programador de tareas".

## 2. Procedimiento

**Paso 0 — Decidir si aplica.** Este patrón es para PCs Windows de escritorio personales/de oficina que se apagan. Si hay un servidor 24/7 o CI, prefiere cron / systemd / GitHub Actions. La ventaja aquí es `StartWhenAvailable`: si el PC estaba apagado a la hora, corre al encender.

**Paso 1 — Escribir el wrapper** (`scripts/scrape_programado.ps1`). Es lo que ejecuta la tarea; nunca pongas la lógica en el registrador. Reglas:
- Resolver la raíz sin hardcodear rutas: `$proyecto = Split-Path -Parent $PSScriptRoot` y `Set-Location -LiteralPath $proyecto`. Así el mismo script funciona en cualquier PC/carpeta.
- `$ErrorActionPreference = "Continue"` — un fallo de un paso no debe abortar el resto del pipeline (queremos que el log capture todo).
- Nombre de log con timestamp: `logs\scrape_programado_$(Get-Date -Format "yyyyMMdd_HHmmss").log`.
- Activar flags condicionalmente con `Test-Path`, no asumir:
  ```powershell
  $creds = Join-Path $proyecto "credentials\service-account.json"
  $flagUpload = ""
  if (Test-Path -LiteralPath $creds) { $flagUpload = "--upload" }
  ```
- **Redirigir la salida de Python vía `cmd /c`, NO con `*>>`** (ver Gotcha 1):
  ```powershell
  cmd /c "python main.py $flagUpload >> `"$logFile`" 2>&1"
  Log "--- exit main.py: $LASTEXITCODE ---"
  ```
- Las líneas propias del wrapper se escriben con una función `Log` que usa `AppendAllText` en UTF-8 sin BOM (ver Gotcha 2).

**Paso 2 — Escribir el registrador idempotente** (`scripts/programar_tarea.ps1`). Recibe `param([switch]$Quitar)` para instalar o desinstalar con el mismo archivo.
- `Register-ScheduledTask ... -Force` sobreescribe si ya existe → correr dos veces no duplica ni falla.
- Acción: lanzar `powershell.exe` apuntando al wrapper con `-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<wrapper>"`. `-WindowStyle Hidden` para que no salte una consola; `-NoProfile` para arranque limpio.
- Triggers semanales, uno por día (no se puede pasar una lista de días a un solo `-Weekly` de forma fiable; usar un array de triggers):
  ```powershell
  $triggers = @(
      (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday   -At 06:00),
      (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Thursday -At 06:00)
  )
  ```
- Settings críticos: `-StartWhenAvailable` (corre al encender si estaba apagado), `-DontStopOnIdleEnd`, `-ExecutionTimeLimit (New-TimeSpan -Hours 2)` (mata el job si se cuelga, no lo dejes en el default de 3 días).
- Corre como el usuario actual, sin privilegios elevados (no pide UAC; suficiente para scripts de usuario).

**Paso 3 — Registrar y verificar.**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\programar_tarea.ps1
```
El script imprime el estado con `Get-ScheduledTask -TaskName $nombre | Select-Object TaskName, State`. Debe decir `Ready`.

**Paso 4 — Probar sin esperar al trigger.** Forzar una corrida inmediata:
```powershell
Start-ScheduledTask -TaskName "ScraperEmpleos-Scrape"
```
Luego revisar el log más reciente en `logs\` y confirmar que las tildes/emojis salen bien y que aparecen las líneas `--- exit main.py: 0 ---`.

**Paso 5 — Blindar los entrypoints Python** (una vez por proyecto). Cada script Python que imprima debe reconfigurar stdout/stderr a UTF-8 al arrancar (ver Gotcha 3), para no depender de que el wrapper exporte `PYTHONIOENCODING`.

**Paso 6 — Desregistrar cuando toque:** `powershell -ExecutionPolicy Bypass -File scripts\programar_tarea.ps1 -Quitar`.

## 3. Activos copiables

Todos en `.claude/skills/devops-scheduler-windows-powershell/activos/` (copiados de `002 Desarrollos/Scraper-Empleos/scripts/`):

- **`programar_tarea.ps1`** — Registrador idempotente completo. Cópialo tal cual y adapta solo: `$nombre` (nombre de la tarea), los `New-ScheduledTaskTrigger` (días/hora) y el `-Description`. El resto (resolución de ruta, `-Force`, settings) es reutilizable sin cambios. Origen: `Scraper-Empleos/scripts/programar_tarea.ps1`.
- **`scrape_programado.ps1`** — Wrapper con logging UTF-8 correcto y flags condicionales. Adapta: los comandos `cmd /c "python ... "` (tus entrypoints), la condición de `Test-Path` para tus flags, y el prefijo del nombre de log. Conserva intactos: la función `Log` con `AppendAllText`/`UTF8Encoding($false)`, el patrón `cmd /c "... >> logFile 2>&1"` y `$LASTEXITCODE`. Origen: `Scraper-Empleos/scripts/scrape_programado.ps1`.

Activo auxiliar (no copiado, referencia por ruta): `Scraper-Empleos/setup_nuevo_pc.ps1` — plantilla de setup idempotente en PC nuevo (verifica Python, instala `requirements.txt`, restaura `.env`/credenciales, smoke tests) que exporta `$env:PYTHONIOENCODING = "utf-8"` al inicio. Útil como base para el "monta esto en un PC nuevo".

## 4. Gotchas verificados

**Gotcha 1 — `*>>` en PowerShell 5.1 corrompe el log a UTF-16 + inyecta ruido "NativeCommandError".**
Evidencia real: `Scraper-Empleos/logs/scrape_programado_20260609_185413.log`. La versión vieja del wrapper hacía `python main.py @argumentos *>> $logFile`. El resultado en ese log:
- Bytes UTF-16LE mostrados como caracteres espaciados: `p y t h o n : I N F O ...`.
- Tildes/emojis rotos: `l í m i t e` salió `l %� m i t e`, `únicas` salió `%Q%n i c a s`.
- Además, redirigir stderr de un `.exe` nativo con `*>>` hace que PowerShell 5.1 envuelva cada línea de stderr en un `ErrorRecord`, ensuciando el log con `FullyQualifiedErrorId : NativeCommandError` y el bloque `+ CategoryInfo ...`.
Solución (versión actual, `scrape_programado.ps1:36`): redirigir por `cmd /c`, que escribe **bytes crudos** sin reinterpretar encoding:
```powershell
cmd /c "python main.py $flagUpload >> `"$logFile`" 2>&1"
```

**Gotcha 2 — Mezclar la salida del wrapper y la de Python en el mismo log rompe el encoding del archivo.**
Las líneas propias del wrapper (cabeceras, marcas de exit) NO deben escribirse con `Add-Content`/`Out-File` (que en PS 5.1 default es UTF-16) si el resto del archivo lo llena `cmd /c` en UTF-8. Solución verificada en `scrape_programado.ps1:20-22`: escribir siempre con .NET, UTF-8 sin BOM:
```powershell
function Log([string]$texto) {
    [System.IO.File]::AppendAllText($logFile, $texto + "`r`n", [System.Text.UTF8Encoding]::new($false))
}
```
El `$false` del constructor es "sin BOM" — con BOM algunos lectores meten `` al inicio de cada append.

**Gotcha 3 — La consola de Windows es cp1252 y revienta el `print()` de Python con tildes/emojis, incluso dentro de la tarea.**
No basta con `PYTHONIOENCODING` externo (una tarea programada puede no heredarlo). Solución verificada, aplicada en cada entrypoint del proyecto (`main.py:638-644`, `scripts/bootstrap_from_excel.py:33-38`, y ~6 scripts más): reconfigurar los streams al inicio de `main()`:
```python
# En Windows la consola usa cp1252 y rompe con los caracteres de caja/emoji.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
```
El `try/except` es obligatorio: `reconfigure` no existe si stdout fue reemplazado (tests, pipes envueltos) → `AttributeError`. El wrapper además exporta `$env:PYTHONIOENCODING = "utf-8"` como segundo cinturón (`scrape_programado.ps1:16`).

**Gotcha 4 — El default de `ExecutionTimeLimit` es 3 días; un job colgado bloquea las siguientes corridas.**
Verificado en `programar_tarea.ps1:31-32`: fijar explícitamente `-ExecutionTimeLimit (New-TimeSpan -Hours 2)` acorde a lo que realmente tarda el pipeline (el scrape corre en ~55s–2min; 2h es margen amplio). Sin esto, un cuelgue deja la tarea "Running" y Task Scheduler puede saltarse el siguiente disparo.

**Gotcha 5 — Pasar varios días a un solo `-Weekly` es frágil; usar un array de triggers.**
Verificado en `programar_tarea.ps1:26-29`: se define un `@()` con un `New-ScheduledTaskTrigger -Weekly` por día y se pasa el array a `-Trigger`. Es explícito y sobrevive a re-registros con `-Force`.

## 5. Criterios de done

- [ ] Existen dos `.ps1` separados: registrador (`programar_tarea.ps1`) y wrapper (`scrape_programado.ps1`). La lógica NO está en el registrador.
- [ ] `programar_tarea.ps1` corre dos veces seguidas sin error ni tarea duplicada (idempotente, por `-Force`).
- [ ] `programar_tarea.ps1 -Quitar` desregistra limpio (`Unregister-ScheduledTask -Confirm:$false`).
- [ ] Ninguna ruta absoluta hardcodeada: la raíz sale de `$PSScriptRoot`. El proyecto se puede mover/clonar a otro PC y sigue funcionando.
- [ ] `Get-ScheduledTask` reporta `State = Ready`; settings incluyen `StartWhenAvailable` y un `ExecutionTimeLimit` acotado.
- [ ] `Start-ScheduledTask` produce un log en `logs\` con timestamp, tildes/emojis correctos (abrir el archivo y verificar: sin caracteres espaciados, sin `NativeCommandError`), y líneas `--- exit <script>: <código> ---`.
- [ ] Cada entrypoint Python del pipeline reconfigura stdout/stderr a UTF-8 con el `try/except`.
- [ ] Flags opcionales (ej. `--upload`) se activan por `Test-Path`, no por asunción; el log dice cuál rama tomó.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Scraper-Empleos | Uso original (fuente de esta skill): tarea `ScraperEmpleos-Scrape` lun/jue 06:00 corriendo `main.py` + `export_landing.py` desatendido | ok | - |
