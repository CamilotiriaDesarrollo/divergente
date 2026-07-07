# <Nombre del proyecto> — <Cliente / entidad>

<!-- PLANTILLA en blanco. Rellena cada sección con datos VERIFICADOS del repo.
     Borra las secciones que no apliquen. Todo en español (exigencia DI-GSI-010 en gobierno).
     Síntesis de los CLAUDE.md reales del portafolio (Interfase Sistemas, Plataforma Conecta, PNMC). -->

## Qué es este proyecto
<Una o dos frases: qué es, qué NO es, y si se construye por fases.>

## Stack tecnológico
| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | <p.ej. React 18 + TS + Vite> | <marca versiones post-cutoff aquí> |
| Backend | <p.ej. Node/Express o .NET N capas> | |
| Estilos | <CSS puro / Tailwind vX> | |
| Auth | <LDAP/AD, cookie, OIDC> | |
| DB | <SQL Server / Postgres> | única fuente de verdad |

## Estructura del proyecto
```
<árbol anotado: solo carpetas/archivos clave, con un comentario por cada uno>
```

## Cómo correr el proyecto
```bash
# Shell: <PowerShell en Windows / bash>. Comandos EXACTOS por pieza:
<comando install>
<comando dev — con puerto real>
<comando test — cómo correr UN solo test>
<comando build>
```
- URLs locales verificadas: <front :5173, api :8080/swagger, health…>

## Contexto institucional  <!-- solo proyectos de gobierno; heredable a agentes -->
- Infraestructura destino: <Windows Server, SQL Server 2016+, IIS, LDAP/AD, GitLab interno>
- Lineamientos obligatorios (DI-GSI-010): accesibilidad AA NTC 5854, responsive, SSL/TLS,
  anti-XSS, separación dev/pruebas/prod, ethical hacking pre-producción, trazabilidad, docs en español.
- Documentos de referencia: P-GSI-003, DI-GSI-010, M-GSI-003, M-GSI-005.

## Tipos base
```typescript
<las 1-3 interfaces/DTO centrales del dominio, copiadas del código real>
```

## Reglas de negocio inviolables  <!-- lo que un agente NUNCA debe romper -->
- <regla 1 con su porqué — p.ej. "no normalizar estado X a Y", "la autorización vive en backend">
- <regla 2…>

## Frameworks post-cutoff (anti-alucinación)  <!-- si aplica -->
- <Framework vN> difiere de tu memoria: LEE `node_modules/<pkg>/dist/docs/` antes de tocarlo.

## Estado actual
- [x] <hecho — verificado en demo/código, no en docs heredadas>
- [ ] <pendiente>

## Riesgos y pendientes conocidos
- <riesgo → impacto → acción, con puntero a docs/backlog/…>

## Convenciones
- Español para negocio, inglés para código técnico.
- Componentes PascalCase, archivos camelCase; sin comentarios obvios.
- Commits convencionales (feat/fix/docs) en español.

<!-- HIGIENE REPO PÚBLICO: si el repo se publica, añade CLAUDE.md, .claude/ y .env al .gitignore. -->
