Asunto: Entorno Virtual PNMC — repositorio, guía de montaje local y documentación del proyecto

Estimado equipo:

Les comparto el acceso y la guía técnica completa para montar en local el Entorno Virtual del Plan Nacional de Música para la Convivencia (PNMC). El repositorio reúne la plataforma, su documentación técnica y funcional, la planeación de trabajo y la biblioteca normativa del Ministerio. La idea es que cualquiera de ustedes pueda clonarlo y tenerlo corriendo en su equipo en un par de horas.

Toda la información está versionada en el repositorio; este correo es la ruta de entrada. Lo primero que conviene abrir, antes que cualquier comando, es el archivo BLUEPRINT_PNMC.html (se abre en el navegador): es el mapa maestro del proyecto, con rutas por perfil (directivo, gestor, desarrollador, tecnología), el paso a paso de despliegue y todos los documentos hipervinculados.

====================================================================
1. REPOSITORIO
====================================================================

URL:   https://github.com/DivergenteamcDesarrollos/PlataformaPNMCV007
Rama:  main

Clonar:
    git clone https://github.com/DivergenteamcDesarrollos/PlataformaPNMCV007.git

La plataforma vive dentro de la carpeta Entorno_Virtual_PNMC/ (monorepo). En la raíz están la documentación de proyecto, el blueprint, el plan y el script de arranque para Windows.

====================================================================
2. ESTRUCTURA DEL REPOSITORIO
====================================================================

  Entorno_Virtual_PNMC/      La plataforma (monorepo):
      pnmc-web/                Frontend  — React 19 + Vite 8 + Tailwind 4 + Leaflet
      pnmc-api/                Backend   — .NET 10 (Minimal APIs) + EF Core
      pnmc-database/           Base de datos — scripts T-SQL versionados (esquema + datos)
      docs/                    Documentación técnica, funcional, de gobernanza y backlog
  normativa/                 Las 6 políticas del Ministerio en versión operativa con checklists
  BLUEPRINT_PNMC.html        Mapa maestro del proyecto (abrir en navegador) — PUNTO DE ENTRADA
  README.md                  Portada e inicio rápido
  PLAN_DE_TRABAJO_PNMC.md/.html   Plan de trabajo: 6 fases, tiempos, entregables, checklists
  ARQUITECTURA_PNMC.html     Anexo de arquitectura (estado actual y evolución objetivo)
  Iniciar-PNMC.ps1           Script de arranque del entorno local en Windows

====================================================================
3. PRERREQUISITOS
====================================================================

  - Git
  - Node.js 18 o superior (recomendado 20 LTS) + npm
  - SDK de .NET 10
  - SQL Server: LocalDB (viene con SQL Server Express) o SQL Server Express/Developer
  - Herramienta de línea de comandos sqlcmd
  - Un navegador moderno (Chrome/Edge/Firefox)

El frontend consume datos SOLO a través del backend, y la única fuente de verdad es SQL Server. No hay datos "quemados" en el frontend: si la base no está sembrada, la plataforma se ve vacía.

====================================================================
4. MONTAJE LOCAL — RUTA RECOMENDADA (Windows, sin contenedores)
====================================================================

Es la ruta que dejamos verificada de punta a punta. La base se llama PNMC_LOCAL.

PASO 1 — Crear la base de datos vacía
    sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "CREATE DATABASE PNMC_LOCAL;"

PASO 2 — Crear el esquema y sembrar los datos base
    Ejecutar, EN ORDEN, los 9 scripts de Entorno_Virtual_PNMC/pnmc-database/schema/
    y luego los seeds 01 a 06 de Entorno_Virtual_PNMC/pnmc-database/seed/.

    Esquema (carpeta schema/):
       V20260519_01__maestras_estaticas.sql
       V20260519_02__administracion_control.sql
       V20260519_03__contenidos_modulos.sql
       V20260519_04__articulacion_lectura_comun.sql
       V20260521_01__entidades_administrativas.sql
       V20260525_01__administracion_extendida.sql
       V20260525_02__roles_finales_y_aliados.sql
       V20260525_03__notificaciones.sql
       V20260525_04__vinculacion_duplicados_calidad.sql

    Datos base (carpeta seed/), del 01 al 06:
       V20260519_01__maestras_estaticas_seed.sql
       V20260519_02__divipola_seed.sql              (DIVIPOLA: 1.122 municipios)
       V20260519_03__administracion_control_seed.sql
       V20260519_04__contenidos_modulos_seed.sql
       V20260519_05__articulacion_lectura_comun_seed.sql
       V20260519_06__datos_prueba_amplios.sql

    Patrón de ejecución de cada script:
       sqlcmd -S "(localdb)\MSSQLLocalDB" -d PNMC_LOCAL -b -i "ruta\al\script.sql"

    (El seed 07 se ejecuta más adelante, en el PASO 4, porque depende de los
     usuarios que crea el backend al arrancar.)

PASO 3 — Arrancar la plataforma
    Opción A (recomendada): ejecutar Iniciar-PNMC.ps1 desde la raíz del repo.
       Levanta LocalDB, el API en http://localhost:8080 y el frontend (Vite).

    Opción B (manual):
       Backend (desde Entorno_Virtual_PNMC/pnmc-api):
          $env:ASPNETCORE_ENVIRONMENT   = 'Local'
          $env:ASPNETCORE_URLS          = 'http://localhost:8080'
          $env:AZURE_SQL_CONNECTION_STRING = 'Server=(localdb)\MSSQLLocalDB;Initial Catalog=PNMC_LOCAL;Integrated Security=True;Encrypt=False;TrustServerCertificate=True;'
          $env:Database__SeedBootstrapUsers = 'true'
          dotnet run --project src/PNMC.Api --no-launch-profile

       Frontend (desde Entorno_Virtual_PNMC/pnmc-web):
          npm install
          npm run dev

    Al arrancar por primera vez con Database__SeedBootstrapUsers=true, el backend
    crea automáticamente los 6 usuarios de acceso (ver sección 6).

PASO 4 — Cargar los datos de la consola de moderación y recalcular el mapa
    Ya con el backend arrancado al menos una vez (usuarios creados), ejecutar:
       sqlcmd -S "(localdb)\MSSQLLocalDB" -d PNMC_LOCAL -b -i "Entorno_Virtual_PNMC\pnmc-database\seed\V20260519_07__datos_moderacion_consola.sql"
       sqlcmd -S "(localdb)\MSSQLLocalDB" -d PNMC_LOCAL -Q "EXEC dbo.sp_ActualizarMetricasMapa;"
    Refrescar el navegador. La consola de moderación queda con registros en todos
    los estados del flujo editorial.

====================================================================
5. MONTAJE LOCAL — RUTA CON CONTENEDORES (macOS / Linux / Windows con Docker)
====================================================================

El repositorio trae también su ruta nativa con contenedores para quienes prefieran
no instalar SQL Server directamente (SQL Server local en 127.0.0.1,14333). Desde la
carpeta Entorno_Virtual_PNMC/:

    docker compose -f docker-compose.local.yml up -d      (levanta SQL Server local)
    ./scripts/seed-local-db.sh                            (crea esquema y siembra)
    ./scripts/api-local.sh                                (arranca el API en modo Local)
    cd pnmc-web && npm install && npm run dev             (frontend)

Los scripts .sh y .command están pensados para shell (bash); en Windows requieren
Git Bash o WSL. El detalle de esta ruta está en Entorno_Virtual_PNMC/docs/. Para
datos reales usen siempre SQL Server (LocalDB, Express o contenedor), nunca el modo
de pruebas con SQLite.

====================================================================
6. VERIFICACIÓN Y CREDENCIALES
====================================================================

URLs una vez arriba:
    Frontend          http://localhost:5173   (si 5173 está ocupado, Vite anuncia otro puerto, p. ej. 5175)
    Consola admin     /admin                  (webmaster y gestor interno)
    Consola aliados   /colaboradores          (aliados y externo)
    API               http://localhost:8080
    Swagger           http://localhost:8080/swagger
    Health            http://localhost:8080/health/live

Credenciales sembradas (SOLO desarrollo — la contraseña de todas es: admin):
    admin@pnmc.local          webmaster        -> /admin
    gestor@pnmc.local         gestor_interno   -> /admin
    aliado-admin@pnmc.local   aliado_admin     -> /colaboradores
    aliado-editor@pnmc.local  aliado_editor    -> /colaboradores
    aliado-lector@pnmc.local  aliado_lector    -> /colaboradores
    externo@pnmc.local        externo          -> /colaboradores

    IMPORTANTE: estas credenciales son exclusivas del entorno local de desarrollo.
    Deben rotarse antes de cualquier ambiente compartido o de despliegue.

====================================================================
7. NOTAS TÉCNICAS (ya resueltas en esta versión del repo)
====================================================================

Documentamos dos puntos que, en versiones anteriores, hacían fallar el sembrado.
Ambos están corregidos en el repositorio actual; los dejamos por trazabilidad y por
si trabajan con una copia más antigua o con otro motor:

  a) Sembrado de usuarios en modo Local. El backend ahora crea los SEIS usuarios
     base al arrancar (antes solo creaba admin y gestor), de modo que el seed de la
     consola de moderación (datos_moderacion_consola, IdUsuario 4-7) carga sin pasos
     manuales en una instalación nueva.

  b) Script V20260525_02 (roles y aliados). Ahora suelta el CHECK heredado antes de
     renombrar la columna RolEnEntidad a RolAliado, evitando el error de sp_rename
     sobre una columna con restricción vigente (se reproducía en SQL Server 2016).

Nota sobre sqlcmd: algunas versiones recientes de la herramienta no resuelven el
nombre "(localdb)\MSSQLLocalDB". Si les ocurre, obtengan la tubería con nombre con
    SqlLocalDB info MSSQLLocalDB
y úsenla como servidor:  sqlcmd -S "np:\\.\pipe\LOCALDB#XXXX\tsql\query" -d PNMC_LOCAL ...

====================================================================
8. DOCUMENTACIÓN: QUÉ CONSULTAR Y DÓNDE
====================================================================

Orden sugerido de lectura:

  1) BLUEPRINT_PNMC.html  (raíz, abrir en navegador)
     EL documento de entrada. Mapa total de la plataforma, rutas por perfil,
     módulos y roles, arquitectura, despliegue paso a paso (sección 5), mapa
     documental con hipervínculos y glosario.

  2) README.md  (raíz)
     Portada del repositorio e inicio rápido.

  3) Entorno_Virtual_PNMC/docs/DOCUMENTACION_PROYECTO.md  (Manual Maestro)
     Documentación oficial del proyecto, con subdocumentos en:
        docs/tecnico/      arquitectura, instalación, modelo de datos
        docs/funcional/    módulos, flujos, manual de roles
        docs/gobernanza/   roles RBAC, reglas de negocio, auditoría
        docs/backlog/      deuda técnica y pendientes conocidos

  4) PLAN_DE_TRABAJO_PNMC.md (o .html)
     Hoja de ruta a producción: 6 fases (14-16 semanas), entregables y checklists
     de cumplimiento mapeados a la normativa.

  5) ARQUITECTURA_PNMC.html
     Anexo de arquitectura: monolito modular actual, objetivo por servicios y ruta
     de migración progresiva.

  6) normativa/  (con su propio README.md de índice)
     Las 6 políticas del Ministerio en versión operativa con checklists. Es la
     directriz del proyecto. El README de la carpeta lista además los conflictos
     normativos abiertos que conviene revisar temprano.

====================================================================
9. RECOMENDACIONES
====================================================================

  - Empiecen por el BLUEPRINT; ahorra mucho tiempo de contexto.
  - Trabajen sobre ramas, no directamente sobre main; abran pull requests para
    revisión. (Hoy el histórico está consolidado en main.)
  - Nunca suban archivos .env reales ni credenciales al repositorio.
  - Las credenciales sembradas son de desarrollo: rótenlas antes de compartir el
    entorno.
  - Tengan presente la deuda técnica documentada en docs/backlog/ antes de extender
    funcionalidad: el panel AdminShellPage.jsx es muy extenso (~7.900 líneas) y está
    pendiente de desacople; hay una vulnerabilidad conocida en la librería xlsx (plan:
    mover importación/exportación Excel al backend); los proveedores de correo y
    WhatsApp hoy están simulados; y la accesibilidad WCAG está parcial.
  - Para el despliegue institucional, los checklists del plan y la carpeta normativa/
    son la guía obligatoria; revisen en particular los conflictos normativos abiertos.

Quedamos atentos a cualquier duda durante el montaje. Con gusto agendamos una sesión
de acompañamiento si necesitan apoyo en el primer arranque.

Un saludo,

Camilo Tiria
Divergente
