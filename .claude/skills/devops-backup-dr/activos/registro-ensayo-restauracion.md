# Registro de Ensayo de Restauración — ${NOMBRE_PROYECTO}

> Evidencia auditable de que el backup **se probó** (no basta con tenerlo). Uno por ensayo. Archivar junto a la política.
> Cadencia mínima: trimestral (ver `politica-backup-dr.md` §5). Exigible ante auditoría estatal (M-GSI-002 / ISO 27001 A.8.13).

| Campo | Valor |
|---|---|
| Fecha y hora del ensayo | ${FECHA} |
| Ejecutado por | ${EJECUTOR} (`devops-plataforma`) |
| Sistema / BD | ${SISTEMA} |
| Backup probado (archivo + fecha de la copia) | ${ARCHIVO_BACKUP} |
| Tipo de ensayo | [ ] Verificación automática  [ ] Restauración completa  [ ] Simulacro DR |
| Ambiente de restauración | ${AMBIENTE} (pruebas — nunca producción sin cambio ITIL) |
| **RPO logrado** (antigüedad del último dato recuperable) | ${RPO_REAL} |
| **RTO medido** (inicio → servicio verificado) | ${RTO_REAL} |
| RTO/RPO comprometidos en la política | ${RTO_META} / ${RPO_META} |
| ¿Dentro de objetivo? | [ ] Sí  [ ] No → acción correctiva: ${ACCION} |
| Resultado `DBCC CHECKDB` / `pg_restore --list` | [ ] Sin errores  [ ] Errores: ${DETALLE} |
| Conteos de tablas clave verificados | ${CONTEOS} |
| Incidencias durante el ensayo | ${INCIDENCIAS} |
| Aprobación normativa | ${APROBADOR} (`cumplimiento-normativo`) — [ ] N/A |

**Conclusión:** ${CONCLUSION}
**Próximo ensayo programado:** ${PROXIMA_FECHA}
