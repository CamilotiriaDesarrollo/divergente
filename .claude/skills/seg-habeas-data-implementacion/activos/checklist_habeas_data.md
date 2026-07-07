# Checklist Habeas Data — Definition of Done citable (H1–H12)

Marco: Ley 1581 de 2012 · Decreto 1074 de 2015 (Título de Protección de Datos) · vigilancia SIC.
Amarres de gobierno: enmascaramiento M-GSI-002 · auditoría IP+hash DI-GSI-010 · cambios controlados ITIL M-GSI-003.
Citar como "cumple H_n" en el acta de compuerta. Lo legal (RNBD, textos de política) lo valida `cumplimiento-normativo`.

- [ ] **H1 — Doble DTO.** Todo endpoint público emite el DTO enmascarado; el DTO completo solo tras verificar rol en backend (403 aunque la UI lo permita).
- [ ] **H2 — Enmascaramiento centralizado.** El mapeo público vive en un único lugar (`Enmascaramiento`/`enmascarar.ts`); ningún controlador serializa la entidad cruda.
- [ ] **H3 — Consentimiento previo, expreso e informado.** Casilla NO pre-marcada, por finalidad, con enlace a la política vigente (SIC).
- [ ] **H4 — Evidencia de consentimiento.** Se persiste TitularId, finalidad, versión de política, canal, IP, UserAgent, hash y fecha (tabla `ConsentimientoTratamiento`).
- [ ] **H5 — Aviso/Política de tratamiento** publicada y versionada; la versión aceptada queda registrada con el consentimiento.
- [ ] **H6 — Derechos del titular** operativos (art. 8): consultar, actualizar/rectificar, revocar consentimiento y solicitar supresión (rutas ARCO), con canal de atención publicado.
- [ ] **H7 — Retención por finalidad.** Matriz `politica-retencion.yaml` definida; job de purga/anonimización probado en `@DryRun=1` antes de aplicar.
- [ ] **H8 — Supresión = anonimización**, salvo obligación legal de conservar (entonces bloqueo de tratamiento, no borrado).
- [ ] **H9 — Datos sensibles** (art. 5-6): consentimiento explícito, opcional, cifrado en reposo; prohibido tratar los de menores.
- [ ] **H10 — Auditoría** de accesos y ejercicios de derechos con fecha, IP y hash, en esquema separado (DI-GSI-010).
- [ ] **H11 — Datos de prueba anonimizados/ofuscados** (sin producción en dev/test sin autorización de Seguridad; DI-GSI-010).
- [ ] **H12 — RNBD.** Evaluado con `cumplimiento-normativo` si el responsable debe registrar la base de datos ante la SIC (umbrales del Decreto 1074/2015 y concordantes).
