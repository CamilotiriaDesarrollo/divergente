# Acuerdo de confidencialidad (NDA) mutuo — subcontratista/freelancer (plantilla N0)

> **No es asesoría legal.** Plantilla ligera de **derecho privado** para vincular a un
> freelancer/subcontratista de Divergente. Sustituye al acuerdo de 11 cláusulas transcrito de un
> procedimiento estatal (que llevaba marco legal público, habeas data y cláusulas intocables).
> Antes de usarla en firme, pásala por un abogado. Cambia solo los campos `<...>`.
>
> **Importante:** un NDA protege *secretos de negocio*, **no** habilita a tratar datos personales.
> Si el subcontratista va a tratar datos de usuarios → añade un **DPA** y aplica
> `seg-habeas-data-implementacion` (Ley 1581/2012, que aplica a empresas privadas).

---

**ACUERDO DE CONFIDENCIALIDAD MUTUO**

Entre **`<Divergente / razón social>`**, NIT `<...>` ("la Empresa"), y **`<nombre del contratista>`**,
identificado con `<C.C./NIT> <...>` ("el Colaborador"), se celebra este acuerdo:

**PRIMERA — Objeto.** Ambas partes intercambiarán **Información Confidencial** con ocasión de
`<descripción del encargo: p. ej. desarrollo de módulo X>`. Este acuerdo la protege.

**SEGUNDA — Definición.** Es Información Confidencial todo dato técnico, de producto, código fuente,
credenciales, arquitectura, datos de clientes, métricas, planes comerciales y cualquier material
marcado como confidencial o que por su naturaleza deba entenderse como tal.

**TERCERA — Obligaciones.** El Colaborador se obliga a: (a) usar la Información solo para el encargo;
(b) no divulgarla a terceros; (c) protegerla con diligencia razonable (equipo con disco cifrado,
gestor de contraseñas, MFA); (d) no copiarla fuera de los entornos autorizados por la Empresa.

**CUARTA — Exclusiones.** No es confidencial la información que sea pública sin culpa del Colaborador,
que ya poseyera legítimamente, o que deba revelar por orden de autoridad competente (avisando antes si es posible).

**QUINTA — Propiedad intelectual.** Todo entregable, código y material creado para el encargo es
**propiedad de la Empresa** (obra por encargo / cesión de derechos patrimoniales). El Colaborador
cede los derechos patrimoniales sobre lo producido.

**SEXTA — Datos personales.** Si el encargo implica **tratar datos personales** de usuarios de la Empresa,
este NDA **no basta**: se suscribirá un **Acuerdo de Tratamiento de Datos (DPA)** separado y el Colaborador
actuará como **Encargado** bajo instrucciones de la Empresa, conforme a la Ley 1581/2012 y demás normas
aplicables. `<Marcar: aplica DPA sí/no>`.

**SÉPTIMA — Devolución.** Al terminar el encargo, el Colaborador devuelve o destruye la Información y
**la Empresa revoca todos sus accesos** (repos, entornos, cuentas) y **rota** los secretos que hubiera conocido.

**OCTAVA — Vigencia.** Las obligaciones de confidencialidad subsisten `<3>` años tras terminar la relación.

**NOVENA — Incumplimiento.** El incumplimiento faculta a la parte afectada a exigir la indemnización de
perjuicios, sin perjuicio de otras acciones legales.

**DÉCIMA — Ley y jurisdicción.** Se rige por las leyes de la República de Colombia; controversias ante
`<jurisdicción / mecanismo de resolución>`.

Firman en `<ciudad>`, el `<fecha>`.

`<Firma Empresa>`  ·  `<Firma Colaborador>`

---

## Nota de uso
- Cambia solo los campos `<...>`.
- **CLÁUSULA SEXTA:** si hay datos personales, NO la borres — adjunta el DPA y remite a `seg-habeas-data-implementacion`.
- La cesión de PI (QUINTA) y la revocación+rotación de accesos (SÉPTIMA) son las dos que más se olvidan; no las quites.
