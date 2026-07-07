# Alias `@` → `src` (debe declararse en DOS lugares)

El alias `@` NO funciona si solo se declara en uno. Vite lo usa en runtime/build;
TypeScript (el `tsc` del build) lo necesita para resolver los imports sin error.
Si falta en tsconfig, `tsc && vite build` falla en Vercel aunque `vite dev` funcione.

## 1. `client/vite.config.ts`
```ts
import { resolve } from 'path'
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

## 2. `client/tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Uso: `import HomeLanding from '@/pages/HomeLanding'` en vez de `../../pages/...`.
Origen: Plataforma Conecta — client/vite.config.ts + client/tsconfig.json.
