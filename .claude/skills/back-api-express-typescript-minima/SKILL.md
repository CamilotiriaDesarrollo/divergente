---
name: back-api-express-typescript-minima
regimen: divergente
description: Levanta una API Express 4 + TypeScript mínima con higiene de producción (helmet, CORS por env, /api/health, patrón routes→controllers→JSON) lista para conmutar de JSON estático a SQL Server sin tocar rutas. Cargar cuando haya que crear el backend inicial de un proyecto client/server, montar un endpoint REST de solo lectura, configurar el esqueleto server/ de un monorepo Vite+Express, o preparar el patrón "backend durmiente" para demos sin base de datos.
---

# API Express + TypeScript mínima

**Nivel actual:** N3 · **Dominio:** Backend · **Agente(s):** `back-node-api`
**Proyectos fuente:** Portal ISI (`002 Desarrollos/Interfase Pagina Inicial`), Interfase Sistemas (`002 Desarrollos/Interfase Sistemas`), Plataforma Conecta (`002 Desarrollos/Plataforma Conecta`)

> Criterio de ascenso a N1: los 5 bloques completos, con activos copiables de ruta real y gotchas verificados (no genéricos). A N2: ≥1 uso real aceptado por el Dueño. A N3: ≥3 usos exitosos en ≥2 proyectos + checklist propio.

## 1. Propósito

Arrancar el backend de un proyecto client/server **sin esperar la base de datos ni permisos de infraestructura**: una API Express 4 + TypeScript de solo lectura que sirve datos desde un JSON en `config/`, con seguridad base (helmet, CORS restringido por variable de entorno) y un endpoint de salud para monitoreo. El mismo esqueleto se usó idéntico en los 3 proyectos fuente (verificado por diff byte a byte de `routes/`, `controllers/` y `tsconfig.json`).

El patrón clave es el **"backend durmiente"**: el frontend funciona 100 % autónomo con datos estáticos (demo desplegable en Vercel sin servidor), pero la API ya existe con el mismo contrato de tipos (`interface Sistema`), de modo que conmutar a SQL Server después solo cambia el controller — nunca las rutas ni el cliente.

Se carga cuando: se inicia el `server/` de un monorepo client/server, se necesita un endpoint REST provisional con datos de configuración, o se pide preparar la migración JSON→DB sin romper el contrato.

## 2. Procedimiento

1. **Crear la estructura** `server/` como paquete npm independiente del cliente (sin workspaces ni monorepo tooling):
   ```
   server/
   ├── src/
   │   ├── config/<recurso>.json       # fuente de datos provisional
   │   ├── controllers/<recurso>Controller.ts
   │   ├── routes/<recurso>.ts
   │   ├── middleware/                 # placeholder vacío (existe en los 3 fuente)
   │   └── index.ts                    # entry point — puerto 3000
   ├── .env / .env.example
   ├── package.json                    # "type": "commonjs"
   └── tsconfig.json                   # "module": "commonjs"
   ```
2. **Sistemas de módulos separados**: el server va en **CommonJS** (`"type": "commonjs"` en package.json + `"module": "commonjs"` en tsconfig) y el client en **ESM** (`"type": "module"`), cada uno con su propio tsconfig. Verificado en los 3 proyectos; no mezclar — `ts-node-dev` corre el server como CJS mientras Vite exige ESM en el cliente.
3. **Entry point** (`src/index.ts`, 25 líneas — no crecerlo con lógica): orden exacto de middlewares `helmet() → cors() → express.json() → routers → /api/health`:
   ```typescript
   dotenv.config()
   const app = express()
   const PORT = process.env.PORT || 3000

   app.use(helmet())
   app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
   app.use(express.json())
   app.use('/api/sistemas', sistemasRouter)
   app.get('/api/health', (_req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() })
   })
   ```
   Criterios: CORS **restringido a un solo origin** leído de `CLIENT_URL` (nunca `cors()` abierto); todo endpoint bajo prefijo `/api/*` (así el proxy de Vite y el rewrite de IIS/Nginx son una sola regla); `/api/health` devuelve timestamp ISO para monitoreo.
4. **Capa de rutas** (`routes/<recurso>.ts`): solo `Router()` + binding de verbos a funciones del controller. Cero lógica. Así la ruta sobrevive intacta al cambio de fuente de datos.
5. **Capa de controller** (`controllers/<recurso>Controller.ts`): funciones nombradas exportadas (`getSistemas`), tipadas con `Request`/`Response` de Express, `_req` con guion bajo si no se usa (la regla eslint `argsIgnorePattern: '^_'` lo permite — ver `activos/eslint.config.mjs`). La fuente inicial es un import directo del JSON:
   ```typescript
   import sistemas from '../config/sistemas.json'
   export function getSistemas(_req: Request, res: Response) {
     res.json(sistemas)
   }
   ```
   **Conmutación futura a SQL Server**: se reemplaza solo el cuerpo de esta función (query en vez de import); rutas y frontend no se tocan porque el JSON ya respeta el contrato `Sistema`.
6. **Contrato de tipos compartido conceptualmente**: el JSON de `config/` debe tener exactamente los campos de la `interface Sistema` del cliente (`client/src/types/index.ts`): `id, nombre, descripcion, url, icono?, categoria, activo`. Nombres de negocio en español, código técnico en inglés (convención de los 3 CLAUDE.md fuente).
7. **Variables de entorno**: `.env` con `PORT`, `CLIENT_URL`, `NODE_ENV`; **`.env.example` versionado** con valores de desarrollo y `.env` en `.gitignore` (los 3 proyectos lo excluyen en la línea `server/.env`).
8. **Scripts npm** (ver `activos/package.json`): dev con `ts-node-dev --respawn src/index.ts` (reinicio en caliente), build con `tsc` a `dist/`, prod con `node dist/index.js`. Si el proyecto usa el kit de calidad, añadir los scripts espejo `lint`/`lint:fix`/`format`/`format:check` como en Plataforma Conecta.
9. **Cablear el cliente**: proxy `/api → http://localhost:3000` en `client/vite.config.ts` con `changeOrigin: true`, para que el frontend nunca hardcodee URLs. **Verificar que el puerto del proxy coincide con `PORT`** (ver gotcha 1).
10. **Despliegue**: el server NO va a Vercel (allí solo se despliega `client/dist`). El server se compila con `tsc` y se sirve aparte — Railway, Render o infraestructura propia (IIS/Nginx en el caso MinCulturas), apuntando `CLIENT_URL` al dominio real del frontend.

## 3. Activos copiables

Copiados desde `Plataforma Conecta/server/` (idéntico a los otros 2 fuente, verificado por diff):

| Activo | Qué es | Qué adaptar al copiar |
|---|---|---|
| `activos/server-src/` | Esqueleto completo: `index.ts` + `routes/sistemas.ts` + `controllers/sistemasController.ts` + `config/sistemas.json` | Renombrar recurso `sistemas` al del dominio; mensaje del `console.log` (dice "Servidor ISI"); campos del JSON según el contrato del proyecto |
| `activos/env.example` | Plantilla de variables (`PORT=3000`, `CLIENT_URL=http://localhost:5173`, `NODE_ENV=development`) | Renombrar a `.env.example`; en prod cambiar `CLIENT_URL` al dominio real del frontend |
| `activos/package.json` | package.json del server: `"type": "commonjs"`, scripts dev/build/start + lint/format, deps exactas (express ^4.19.2, helmet ^7.1.0, cors ^2.8.5, dotenv ^16.4.5, ts-node-dev ^2.0.0) | `name` del paquete; quitar los scripts lint/format si el proyecto no monta el kit ESLint 9 |
| `activos/tsconfig.json` | tsconfig CommonJS del server: ES2020, `outDir: dist`, `strict: true`, `resolveJsonModule: true` | Nada — copiarlo tal cual (ver gotcha 3) |
| `activos/eslint.config.mjs` | ESLint 9 flat config para el server (typescript-eslint + prettier al final, `globals.node`, `argsIgnorePattern: '^_'`) | Nada; requiere las devDependencies del package.json de Conecta |

Originales en los proyectos fuente: `Plataforma Conecta/server/src/`, `Interfase Sistemas/server/src/`, `Interfase Pagina Inicial/server/src/`. Complemento del lado cliente: `Plataforma Conecta/client/vite.config.ts` (proxy + alias `@`).

## 4. Gotchas verificados

1. **Proxy de Vite desalineado con el puerto del server** — En Portal ISI, `client/vite.config.ts` proxya `/api` a `http://localhost:3001` pero el server escucha en `3000` (`server/src/index.ts` línea 10 y README, "puerto 3000"): cualquier llamada a la API local falla en silencio hasta alinear los puertos. Inconsistencia aún presente en el working tree de `Interfase Pagina Inicial`. **Solución**: al copiar el esqueleto, verificar la pareja proxy↔`PORT` como paso explícito (los otros 2 proyectos la tienen bien: `target: 'http://localhost:3000'`).
2. **El server no se despliega en Vercel** — Los intentos de desplegar el monorepo fallaron hasta aceptar que Vercel solo construye el cliente: `vercel.json` en la raíz con `buildCommand`/`installCommand` haciendo `cd client` y `outputDirectory: 'client/dist'`, sin `rootDirectory` (costó 2 iteraciones en Conecta, commits `06e8f61` y `77bc0a8`; en Portal ISI el commit `94e9185`). El server Express se sirve aparte (Railway/Render/IIS). Evidencia: `Interfase Pagina Inicial/README.md` sección "Despliegue en Vercel" ("el servidor Express no se despliega en Vercel") y `vercel.json` en la raíz de ambos proyectos.
3. **Importar JSON en TypeScript exige `resolveJsonModule`** — El patrón `import sistemas from '../config/sistemas.json'` del controller solo compila porque el tsconfig del server trae `"resolveJsonModule": true` (verificado en `Plataforma Conecta/server/tsconfig.json` línea 11, idéntico en los 3). Si se copia el controller con un tsconfig propio sin esa opción, `tsc` falla. Copiar el tsconfig del activo tal cual.
4. **TypeScript como gate de despliegue** — En Conecta los errores de tipos bloquearon el build hasta corregirlos (commit `65d5ddd`): el build es `tsc` (server) y `tsc && vite build` (client), sin `skipLibCheck` de escape en el código propio. No degradar tipos a `any` para "pasar el build"; en Conecta se reemplazaron los `any` por tipos de dominio (commit `df71bfb`).
5. **`.env` versionado por accidente** — Los 3 proyectos previenen esto igual: `.gitignore` de raíz con `​.env`, `.env.local`, `.env.*.local` y `server/.env` explícito (líneas 12-15 en los 3), más `.env.example` versionado como documentación de las variables. Al crear un proyecto nuevo, esas 4 líneas van en el primer commit — el `.env` real existe en los 3 working trees y nunca entró al repo.

## 5. Criterios de done

- [ ] `cd server && npm install && npm run dev` levanta el server sin errores y loguea la URL con el puerto.
- [ ] `GET http://localhost:3000/api/health` responde `{ "status": "ok", "timestamp": "<ISO 8601>" }`.
- [ ] `GET http://localhost:3000/api/<recurso>` devuelve el contenido del JSON de `config/` y sus campos coinciden 1:1 con la interface del cliente (`client/src/types/index.ts`).
- [ ] CORS restringido: `origin` sale de `process.env.CLIENT_URL`, no hay `cors()` sin opciones.
- [ ] El puerto del proxy en `client/vite.config.ts` == `PORT` del server, y el frontend consume `/api/...` por rutas relativas (cero URLs absolutas hardcodeadas en el cliente).
- [ ] `npm run build` (tsc) compila a `dist/` sin errores y `npm start` sirve la API compilada.
- [ ] `.env.example` versionado con `PORT`, `CLIENT_URL`, `NODE_ENV`; `.env` presente en `.gitignore` (incluida la entrada `server/.env`).
- [ ] `routes/` sin lógica de negocio y `controllers/` sin definición de rutas (la conmutación a DB debe poder hacerse tocando solo el controller).
- [ ] Si el proyecto usa el kit de calidad: `npm run lint` y `npm run format:check` en verde.

**Dudas / límites de la evidencia**: (a) la conmutación JSON→SQL Server nunca se ejecutó en los proyectos fuente — quedó como hoja de ruta explícita, así que el paso 5 describe el plan de diseño, no una migración verificada; (b) ningún server fuente tiene tests automatizados ni middleware propio (la carpeta `middleware/` existe vacía en los 3); (c) la API fuente es de solo lectura (un único GET) — no hay evidencia propia de POST/PUT, validación de body ni manejo de errores centralizado.

## Registro de uso
| Fecha | Proyecto | Tarea | Resultado | Lección |
|---|---|---|---|---|
| histórico | Portal ISI | uso original (fuente de esta skill) | ok | - |
| histórico | Interfase Sistemas | uso original (fuente de esta skill) | ok | - |
| histórico | Plataforma Conecta | uso original (fuente de esta skill) | ok | - |
