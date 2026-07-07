# Evaluación de proveedor cloud / subprocesador (plantilla N0)

> Reemplaza el checklist estatal de nube (ubicación SIC, Ley 1712, aval de la Oficina de TI, ANS público)
> por su equivalente privado: se evalúa por **contrato (DPA) + higiene técnica**, no por norma pública.
> Aplícalo antes de contratar o dar acceso a: Vercel, Neon/Supabase/Vercel Postgres, proveedor de
> email transaccional, analytics, error tracking, LLM/API de terceros, etc.

Proveedor: `<nombre>` · Servicio: `<qué hace>` · ¿Trata datos personales de usuarios?: `<sí/no>` · Fecha: `<AAAA-MM-DD>`

## 1. Contrato y datos
- [ ] **DPA (Data Processing Agreement)** firmado/aceptado si el proveedor trata datos personales por nosotros.
- [ ] Lista de **subprocesadores** del proveedor conocida y aceptable.
- [ ] **Región / residencia de datos** declarada y elegida a conciencia (latencia + expectativa del cliente).
- [ ] **Propiedad de los datos**: son nuestros; se pueden exportar y se borran al terminar el contrato.
- [ ] Cláusula de **notificación de brechas** con plazo (para poder cumplir nuestros propios deberes de Ley 1581).

## 2. Higiene técnica
- [ ] **Cifrado** en tránsito (TLS) y en reposo activo.
- [ ] **Backups + PITR** disponibles en el plan contratado y **probados** con una restauración real
      (no basta que "existan"; ver `devops-backup-dr`).
- [ ] **SLA / uptime** publicado y aceptable para el producto.
- [ ] Certificaciones del proveedor (SOC 2 / ISO 27001) revisadas si están disponibles — como *evidencia*, no como requisito legal.
- [ ] **RLS / aislamiento** verificado donde aplique (Supabase: RLS on por tabla; claves con mínimo privilegio).

## 3. Cuentas y acceso
- [ ] **MFA activo** en la cuenta del proveedor de todo el equipo (Vercel, GitHub, Neon/Supabase, registrador de dominio).
- [ ] **Mínimo privilegio**: claves de servicio con el menor scope posible; nada de usar la clave `service_role`/admin en el cliente.
- [ ] **Rotación** de claves posible y documentada; se rota al salir alguien del equipo (ver `seg-gestion-secretos-keyvault`).
- [ ] Acceso por miembro nombrado (no una cuenta compartida con contraseña única).

## 4. Salida
- [ ] Plan de exportación/portabilidad si hay que migrar de proveedor.
- [ ] Proceso de borrado verificable al cerrar la cuenta.

## Veredicto
`aprobado` / `aprobado con condiciones (<cuáles>)` / `rechazado (<por qué>)` — lo firma `seguridad-appsec`.
Toda condición pendiente va a la tabla de decisiones abiertas del blueprint.
