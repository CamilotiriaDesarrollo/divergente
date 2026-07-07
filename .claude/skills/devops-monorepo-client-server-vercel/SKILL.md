---
name: devops-monorepo-client-server-vercel
regimen: divergente
description: Estructura un monorepo client (Vite+React+TS) / server (Express+TS) con paquetes npm independientes y despliega SOLO el frontend en Vercel para demos sin infraestructura. Cárgala cuando haya que crear/desplegar un repo client-server, escribir vercel.json, configurar el proxy /api en vite.config.ts, o cuando el build falle en Vercel (Root Directory, "tsc && vite build", chunks >500 kB).
---

# DevOps — Monorepo client/server con despliegue frontend en Vercel

**Nivel actual:** N3 · **Dominio:** devops · **Agente(s):** `devops-plataforma`
**Proyectos fuente:** Portal ISI (`Interfase Pagina Inicial`), Interfase Sistemas, Plataforma Conecta

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Montar un repo con dos paquetes npm independientes —`client/` (Vite + React 18 + TS, `type: module`) y `server/` (Express 4 + TS, `type: commonjs`)— y publicar **solo el frontend estático en Vercel**, mientras el backend Node queda para infraestructura propia (IIS/Nginx) o PaaS (Railway/Render). Se apoya en el patrón **"backend durmiente"**: el frontend funciona 100 % autónomo con datos estáticos en TypeScript, y la API Express existe con el mismo contrato de tipos (`Sistema`) lista para conmutar a SQL Server sin reescribir el cliente. Esto permite demos desplegables sin pedir infraestructura al cliente.

Se carga cuando: se inicia un repo client/server, hay que escribir/arreglar `vercel.json`, configurar el proxy `/api` de desarrollo, o el despliegue en Vercel falla. La receta está **probada tras fallar 2 veces** antes de estabilizarse (ver bloque 4).

## 2. Procedimiento

1. **Estructura de paquetes independientes** (sin monorepo tooling: sin workspaces, sin Turborepo). Dos `package.json` separados:
   - `client/package.json` → `"type": "module"`, script `"build": "tsc && vite build"`.
   - `server/package.json` → `"type": "commonjs"`, `"dev": "ts-node-dev --respawn src/index.ts"`, `"build": "tsc"`, `"start": "node dist/index.js"`.
   Cada paquete tiene su propio `tsconfig.json` (el del server con `"module": "commonjs"` + `"resolveJsonModule": true`).

2. **Proxy de desarrollo en `client/vite.config.ts`** — para que el frontend **nunca hardcodee URLs**: `server.proxy['/api'].target` apunta al server local. **CRITERIO DE DECISIÓN CLAVE:** ese puerto DEBE ser idéntico al `PORT` del server (`server/src/index.ts` usa `3000` por defecto). Añadir también alias `'@' → resolve(__dirname, 'src')`.

3. **`server/src/index.ts` mínimo endurecido**: `helmet()`, `cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' })`, `express.json()`, router `/api/sistemas`, y `/api/health` que devuelve `{ status:'ok', timestamp: new Date().toISOString() }`. Patrón de capas `index → routes → controllers → config/*.json`; el JSON es la fuente de datos inicial, reemplazable por SQL Server sin tocar las rutas.

4. **`.env.example` versionado** (`PORT`, `CLIENT_URL`, `NODE_ENV`) y `.env` real ignorado en `.gitignore` (incluir `server/.env`, `dist/`, `client/dist/`).

5. **`vercel.json` en la RAÍZ del repo** (no en `client/`). Tres claves explícitas — **evitar la opción Root Directory de la UI de Vercel**, que fue la que falló:
   ```json
   {
     "installCommand": "cd client && npm install",
     "buildCommand": "cd client && npm run build",
     "outputDirectory": "client/dist"
   }
   ```

6. **Decisión frontend autónomo vs API real** (patrón backend durmiente):
   - Para **demo/vitrina** → datos estáticos tipados en `client/src/data/*.ts`; el backend no se despliega. Documentar en README que "el frontend funciona de forma autónoma".
   - Para **producción** → desplegar el server aparte (Railway/Render o `server/dist` con `npm run build && npm start` detrás de IIS/Nginx) y apuntar `CLIENT_URL` al dominio real del frontend. El contrato de tipos (`interface Sistema`) es el mismo en ambos lados, así que conmutar no reescribe el cliente.

7. **Optimización de bundle antes de desplegar** (si Vite avisa de chunk >500 kB): `manualChunks` en `rollupOptions.output` separando vendors (`react`/`react-router`, `leaflet`/`react-leaflet`) + `React.lazy`+`Suspense` para vistas pesadas con su dataset.

8. **Verificar** con `npm run build` en `client/` ANTES de subir: como el script es `tsc && vite build`, cualquier error de tipos aborta el build y por tanto el deploy en Vercel.

## 3. Activos copiables

Todos en `activos/` de esta skill (rutas verificadas contra los proyectos fuente):

- **`activos/vercel.json`** — receta de despliegue en raíz (origen: `Plataforma Conecta/vercel.json`, idéntico en `Interfase Pagina Inicial/vercel.json`). Copiar tal cual a la raíz del repo; no requiere adaptación salvo que el cliente no esté en `client/`.
- **`activos/vite.config.ts`** — proxy `/api → :3000`, alias `@ → src` y `manualChunks` de vendors (origen: `Plataforma Conecta/client/vite.config.ts`). **Adaptar:** alinear `proxy.target` con el `PORT` real del server; quitar `leaflet` de `manualChunks` si el proyecto no lo usa.
- **`activos/server-skeleton/`** — esqueleto Express+TS completo y ejecutable (origen: `Plataforma Conecta/server/`): `src/index.ts` (+ `routes/sistemas.ts`, `controllers/sistemasController.ts`, `config/sistemas.json`), `.env.example`, `tsconfig.json` (commonjs), `package.json`. Copiar a `server/`, `npm install`, `cp .env.example .env`, `npm run dev`. **Adaptar:** renombrar el recurso `sistemas` al dominio real y reemplazar el JSON por la fuente de datos definitiva.

Fuera de esta skill, en los proyectos fuente, hay plantillas complementarias reutilizables: sección "Despliegue" del `README.md` de `Plataforma Conecta` (documenta el vercel.json y la ruta IIS/Nginx) y `docs/CONTEXTO-INSTITUCIONAL.md`.

## 4. Gotchas verificados

1. **Root Directory de Vercel rompe el build de un frontend en subcarpeta.** Configurar `client/` como Root Directory en la UI falló el build. Solución: `vercel.json` en la raíz con rutas explícitas `cd client && …` y `outputDirectory: "client/dist"`, **sin** usar `rootDirectory`. Costó 2 iteraciones. Evidencia: Portal ISI commit `94e9185` ("fix: vercel.json — build desde subdirectorio client sin rootDirectory"); Plataforma Conecta commits `06e8f61` y `77bc0a8`.

2. **`tsc && vite build` convierte cualquier error de TypeScript en un bloqueo de despliegue.** El build del cliente corre `tsc` primero; un tipo mal puesto aborta el deploy entero en Vercel. Solución: `npm run build` local en verde antes de push; tratar el tipado como gate de despliegue. Evidencia: `client/package.json` (script `build`) + Plataforma Conecta commit `65d5ddd`.

3. **Proxy `/api` desalineado con el puerto del server → todas las llamadas fallan en dev.** En Portal ISI, `client/vite.config.ts` proxya `/api` a `http://localhost:3001` pero `server/src/index.ts` escucha en `3000` por defecto (y el README documenta 3000); si se levanta la API local, el proxy no conecta. Solución: `proxy.target` debe ser exactamente el `PORT` del server. Evidencia: `Interfase Pagina Inicial/client/vite.config.ts` (línea 16, `:3001`) vs `Interfase Pagina Inicial/server/src/index.ts` (línea 10, `3000`). El activo `activos/vite.config.ts` ya usa `:3000` (versión correcta de Plataforma Conecta) con un comentario de aviso.

4. **Warning de Vite por chunk > 500 kB.** Bundle único demasiado grande. Solución: `React.lazy`+`Suspense` para diferir vistas pesadas junto con su dataset (~48 kB en `InternacionalizacionPage`) + `manualChunks` separando `react` y `leaflet` en chunks cacheables. Evidencia: Plataforma Conecta commit `2c54d2a`, `client/vite.config.ts` (`build.rollupOptions.output.manualChunks`).

5. **Intentar desplegar el Express en Vercel es el camino equivocado para estas demos.** El server no se publica en Vercel; el frontend se sirve estático y autónomo con datos en TS, y el backend va a Railway/Render o infra propia (IIS/Nginx sirviendo `server/dist`). Evidencia: sección "Despliegue en Vercel" de `Interfase Pagina Inicial/README.md` (líneas 388-398) y "Despliegue" de `Plataforma Conecta/README.md` (líneas 225-237).

## 5. Criterios de done

- [ ] `vercel.json` está en la **raíz** del repo con `installCommand`/`buildCommand` en formato `cd client && …` y `outputDirectory: "client/dist"`; NO se usa Root Directory en la UI.
- [ ] `npm run build` en `client/` pasa en verde localmente (tsc sin errores) antes del push.
- [ ] `client/vite.config.ts` proxya `/api` al **mismo puerto** que `PORT` en `server/src/index.ts`.
- [ ] El frontend renderiza y navega con el server apagado (datos estáticos): demo autónoma verificada.
- [ ] `server/.env` está en `.gitignore` y solo se versiona `.env.example` (sin secretos).
- [ ] El deploy en Vercel termina en verde y la URL sirve el contenido de `client/dist`.
- [ ] No hay warning de chunk >500 kB (o está justificado); vendors pesados en `manualChunks`.
- [ ] `GET /api/health` responde `{ status:'ok', timestamp }` cuando el server sí se levanta.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
