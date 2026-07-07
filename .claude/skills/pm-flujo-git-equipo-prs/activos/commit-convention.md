# Convención de commits y ramas de la fábrica

Basada en **Conventional Commits 1.0.0**. La usa `pm-changelog-estimacion-esfuerzo` para generar el changelog
automáticamente, y el título del PR (que se vuelve el mensaje del commit squash) DEBE seguirla.

## Formato de commit / título de PR
```
<tipo>(<ámbito>)!: <resumen imperativo, minúscula, sin punto final>

<cuerpo opcional: qué y por qué>

Refs: <ID-misión>            # ej. F4-C3
Co-authored-by: <agente> (IA) <noreply@fabrica.local>
```
- **tipos:** `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`
- **ámbito:** módulo/componente real (`mapa`, `wizard`, `auth`, `openapi`, `sqlserver`).
- **`!`** o footer `BREAKING CHANGE:` para cambios incompatibles.

Ejemplos válidos:
- `feat(mapa): coropleta por departamento con Leaflet`
- `fix(auth): valida expiración de token OIDC contra Azure AD`
- `chore(ci): fija actions/checkout a v4`

## Ramas (short-lived, trunk-based)
```
<tipo>/<fase>-<slug-corto>
```
- `feat/f4-mapa-leaflet`  ·  `fix/g5-owasp-a01`  ·  `chore/f3-branch-protection`
- Vida corta (horas–pocos días). Rebase sobre `main` antes de pedir review. Se borra al mergear.

## Releases
- Etiquetas anotadas SemVer: `v1.2.0`. `git tag -a v1.2.0 -m "..."` + `git push --tags`.
- **Línea gobierno:** el tag de producción NO despliega solo; el despliegue va por ITIL **M-GSI-003**
  (SDC F-GSI-037, comité del jueves) y **nunca** dentro del congelamiento 15dic–15ene.
