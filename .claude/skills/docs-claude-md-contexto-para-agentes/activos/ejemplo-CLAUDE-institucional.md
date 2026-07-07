# Interfase Sistemas de Información — Ministerio de las Culturas

<!-- ORIGEN: copia literal de 002 Desarrollos/Interfase Sistemas/CLAUDE.md (idéntico al de Plataforma Conecta).
     Ejemplo de CLAUDE.md institucional de proyecto en fase temprana. Sin secretos. -->

## Qué es este proyecto

Portal de entrada (landing) para los sistemas de información del **Ministerio de las Culturas, las Artes y los Saberes** de Colombia. No es un sistema robusto: es una interfaz de aterrizaje donde el usuario llega, se orienta y navega hacia los diferentes sistemas institucionales mediante links/tarjetas.

Se construye de forma incremental. El diseño y los sistemas enlazados se irán añadiendo por fases.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Estilos | CSS puro por ahora (se definirá sistema de diseño) |
| Auth (futuro) | LDAP / Directorio Activo (estándar del Ministerio) |
| DB (futuro) | SQL Server (infraestructura ya licenciada en el Ministerio) |

---

## Estructura del proyecto

```
Interfase Sistemas/
├── client/                        # Frontend
│   ├── src/
│   │   ├── components/            # Componentes reutilizables
│   │   ├── pages/
│   │   │   └── Home.tsx           # Página principal
│   │   ├── types/
│   │   │   └── index.ts           # Tipos: Sistema, Usuario
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts             # Proxy /api → localhost:3000
│
├── server/                        # Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── sistemas.json      # Lista de sistemas (fuente de datos inicial)
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── index.ts               # Entry point — puerto 3000
│   └── .env.example
│
└── CLAUDE.md
```

---

## Cómo correr el proyecto

```bash
# Terminal 1 — servidor (puerto 3000)
cd server
npm install
cp .env.example .env
npm run dev

# Terminal 2 — cliente (puerto 5173)
cd client
npm install
npm run dev
```

---

## Contexto institucional del Ministerio

### Infraestructura tecnológica existente
- **Servidores**: Windows Server 2016+, Red Hat Enterprise Linux 7+
- **Base de datos**: Microsoft SQL Server 2016+
- **Servidores de aplicación**: IIS, Apache, Nginx, Tomcat
- **Autenticación**: LDAP integrado con Directorio Activo / Azure AD
- **Control de versiones**: GitLab interno (https://git.mincultura.gov.co)
- **Gestión de servicios TI**: Herramienta Magic

### Lineamientos técnicos obligatorios (DI-GSI-010)
- Accesibilidad **grado AA** según NTC 5854
- **Responsive Design** (móvil, tablet, escritorio)
- Certificados **SSL/TLS** en todo intercambio
- Protección contra **XSS** en todos los componentes
- Contraseñas siempre **encriptadas**
- Interoperabilidad vía **Web Services SOAP** o **API RESTful**
- Separación estricta de ambientes: desarrollo / pruebas / producción
- Toda app debe someterse a **Ethical Hacking** antes de producción
- Trazabilidad mínima de eventos: fecha/hora, IP origen, usuario, tipo de mensaje
- Documentación en español

### Documentos de referencia disponibles
| Código | Documento |
|--------|-----------|
| P-GSI-003 | Procedimiento Diseño, Desarrollo e Implementación de SI (V6) |
| DI-GSI-010 | Lineamientos para Recepción y Desarrollo de Servicios Tecnológicos |
| M-GSI-003 | Manual de Gestión de Cambios |
| M-GSI-005 | Manual de Políticas de Seguridad de la Información |

---

## Tipos base (client/src/types/index.ts)

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
```

---

## Estado actual

- [x] Estructura de carpetas creada
- [x] Configuración Vite + React + TypeScript (cliente)
- [x] Servidor Express base con ruta `/api/sistemas` y `/api/health`
- [x] Tipos base definidos
- [ ] Diseño visual (pendiente — se recibirán lineamientos gráficos del Ministerio)
- [ ] Autenticación LDAP
- [ ] Despliegue en infraestructura del Ministerio

---

## Convenciones del proyecto

- Español para nombres de variables de negocio, inglés para código técnico
- Sin comentarios obvios en el código
- Componentes en PascalCase, archivos en camelCase
- Sin librerías de UI externas hasta definir el sistema de diseño institucional
