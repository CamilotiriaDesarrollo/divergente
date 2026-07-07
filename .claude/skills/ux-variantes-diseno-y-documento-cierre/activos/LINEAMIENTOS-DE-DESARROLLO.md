# Lineamientos de desarrollo

Políticas técnicas, convenciones y contexto institucional bajo los cuales se
construye este portal. Lectura obligatoria para cualquier persona que vaya a
contribuir al proyecto.

Proyecto desarrollado para el **Ministerio de las Culturas, las Artes y los
Saberes** de Colombia.

---

## 1. Qué es este proyecto

Portal de entrada (*landing*) para los sistemas de información del Ministerio.
No es un sistema transaccional robusto: es una interfaz de aterrizaje donde el
usuario llega, se orienta y navega hacia los diferentes sistemas institucionales
mediante tarjetas y barras de logos (tirillas).

Se construye de forma **incremental**: el diseño y los sistemas enlazados se van
añadiendo por fases.

---

## 2. Stack tecnológico

| Capa        | Tecnología                              |
|-------------|-----------------------------------------|
| Lenguaje    | TypeScript 5                            |
| Frontend    | React 18 (hooks funcionales) + Vite 5   |
| Backend     | Node.js + Express + TypeScript          |
| Estilos     | CSS puro, metodología BEM               |
| Logos       | SVG inline                              |
| Auth (futuro) | LDAP / Directorio Activo (estándar del Ministerio) |
| DB (futuro) | Microsoft SQL Server                    |

**Sin librerías de UI externas** (sin Tailwind, sin Bootstrap, sin Material UI)
hasta que se defina el sistema de diseño institucional.

---

## 3. Lineamientos técnicos obligatorios (DI-GSI-010)

Todo desarrollo entregable al Ministerio debe cumplir:

- **Accesibilidad grado AA** según norma NTC 5854.
- **Responsive Design** completo: móvil, tablet y escritorio.
- Certificados **SSL/TLS** en todo intercambio de información.
- Protección contra **XSS** en todos los componentes.
- Contraseñas siempre **encriptadas** (nunca en texto plano).
- Interoperabilidad vía **Web Services SOAP** o **API RESTful**.
- **Separación estricta de ambientes**: desarrollo / pruebas / producción.
- Toda aplicación debe someterse a **Ethical Hacking** antes de pasar a producción.
- **Trazabilidad** mínima de eventos: fecha/hora, IP de origen, usuario y tipo de mensaje.
- **Documentación en español.**

---

## 4. Lineamientos de seguridad

- Inicio de sesión único (**SSO**) vía LDAP integrado con Directorio Activo / Azure AD.
- Administración de **roles, perfiles y niveles de acceso**.
- Los servicios en nube deben cumplir la **Ley 1581** (protección de datos personales)
  y la **Ley 1712** (transparencia y acceso a la información pública).

---

## 5. Convenciones de código

- **Idioma**: español para los nombres de variables de negocio; inglés para el
  código técnico (frameworks, utilidades, tipos genéricos).
- **Sin comentarios obvios**: el código debe explicarse por sí mismo; comentar
  solo lo que no es evidente.
- **Componentes** en `PascalCase`; **archivos** en `camelCase`.
- **CSS** con metodología **BEM** (`bloque__elemento--modificador`).
- No introducir dependencias de UI externas sin aprobación.

### Tipos base

```typescript
interface Sistema {
  id: string
  nombre: string
  descripcion: string
  url: string
  icono?: string
  categoria: string
  activo: boolean
}

interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: 'admin' | 'usuario'
}
```

---

## 6. Infraestructura tecnológica del Ministerio

El despliegue final debe ser compatible con la infraestructura existente:

| Componente             | Tecnología                                          |
|------------------------|-----------------------------------------------------|
| Servidores             | Windows Server 2016+, Red Hat Enterprise Linux 7+   |
| Hipervisores           | VMware ESXi 6.5 / 6.7                                |
| Base de datos          | Microsoft SQL Server 2016+                          |
| Servidores de aplicación | IIS, Apache, Nginx, Tomcat                        |
| Autenticación          | LDAP + Directorio Activo de Microsoft / Azure AD    |
| Ofimática              | Office 365 + Microsoft Teams                        |
| Control de versiones   | GitLab interno (https://git.mincultura.gov.co)      |
| Gestión de servicios TI | Herramienta Magic                                  |

---

## 7. Documentos de referencia institucionales

| Código     | Documento                                                              |
|------------|------------------------------------------------------------------------|
| P-GSI-003  | Procedimiento Diseño, Desarrollo e Implementación de SI (V6)           |
| DI-GSI-010 | Lineamientos para Recepción y Desarrollo de Servicios Tecnológicos     |
| M-GSI-003  | Manual de Gestión de Cambios                                           |
| M-GSI-005  | Manual de Políticas de Seguridad de la Información                     |

---

## 8. Estado actual y roadmap

- [x] Estructura de carpetas (cliente + servidor)
- [x] Configuración Vite + React + TypeScript (cliente)
- [x] Servidor Express base con rutas `/api/sistemas` y `/api/health`
- [x] Tipos base definidos
- [x] Componentes institucionales: header, footer, barra de accesibilidad
- [x] Componente `TirillaF` (dock magnético + carrusel infinito, claro/oscuro, responsive)
- [ ] Sistema de diseño visual definitivo (pendiente de lineamientos gráficos del Ministerio)
- [ ] Autenticación LDAP / SSO
- [ ] Despliegue en infraestructura del Ministerio
