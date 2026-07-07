# Cómo documentar la salida-a-WhatsApp como decisión TEMPORAL

Plantilla extraída de DivergenteWEB/METODOLOGIAS_SUPUESTOS.md (§3 filas 4 y 6, §6).
Copiar estas filas al entregable de supuestos del proyecto y al roadmap. La regla es:
un lead-por-WhatsApp-sin-backend NUNCA se entrega en silencio — se declara temporal
y su destino final queda como pendiente numerado del roadmap.

## En el entregable de supuestos (tabla)

| # | Supuesto | Cómo cambiarlo |
|---|----------|----------------|
| N | Leads del formulario **salen por WhatsApp** (`wa.me/<NUMERO>`) por ahora. | Definir correo/CRM (decisión X.Y del roadmap). |
| N+1 | CTAs "Hablemos"/"Escríbenos" → WhatsApp (mismo número que el form). | Cambiar `href` si hay otro canal. |

## En la lista de placeholders pendientes

- [ ] **Destino de leads** del formulario (correo/CRM) — hoy abre WhatsApp.

## En el propio código (comentario junto al form)

```tsx
{/* PLACEHOLDER: definir destino de leads (correo / CRM). Hoy abre WhatsApp. */}
```

> Sin esta triple anotación (código + supuestos + roadmap) el "sin backend" se lee
> como olvido en vez de decisión. La skill exige las tres.
