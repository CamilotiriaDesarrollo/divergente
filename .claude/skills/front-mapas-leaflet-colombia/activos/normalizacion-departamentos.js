/**
 * Normalización de nombres de departamento de Colombia para casar GeoJSON ↔ datos propios.
 * Extracto literal de código en producción — NO inventado.
 *
 * Orígenes:
 *  - normalizeDepartmentName + DEPARTMENT_NAME_ALIASES + buildScaledFeature:
 *    "Plan Nacional de Musica SIMUS/Entorno_Virtual_PNMC/pnmc-web/src/features/map/domain/mapDomain.js"
 *    (líneas 63-76, 286-297, 449-466)
 *  - normDept + DEPT_MAP + resolverDept:
 *    "Plataforma Conecta/client/src/pages/MapaCirculacion.tsx" (líneas 30-49)
 *
 * Por qué existe: cada GeoJSON de Colombia nombra los departamentos distinto
 * (NOMBRE_DPT en mayúsculas, NAME_1 estilo GADM, "Bogotá D.C." pegado, "Archipiélago de
 * San Andrés, Providencia y Santa Catalina"...). Sin normalización + diccionario de alias,
 * el coroplético muestra departamentos en 0 aunque haya datos.
 */

// ── Variante PNMC (la más completa: mayúsculas + alias + typo real del GeoJSON) ──
const DEPARTMENT_NAME_ALIASES = {
  'ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA': 'SAN ANDRES Y PROVIDENCIA',
  'SAN ANDRES PROVIDENCIA Y SANTA CATALINA': 'SAN ANDRES Y PROVIDENCIA',
  'SAN ANDRES Y PROVIDENCIA Y SANTA CATALINA': 'SAN ANDRES Y PROVIDENCIA',
  'SANTAFE DE BOGOTA': 'BOGOTA',
  'BOGOTA D C': 'BOGOTA',
  'BOGOTA D.C': 'BOGOTA',
  'BOGOTA, D.C.': 'BOGOTA',
  'DISTRITO CAPITAL DE BOGOTA': 'BOGOTA',
  'CUNDINAMRCA': 'CUNDINAMARCA', // typo real presente en una fuente de datos
};

export const normalizeDepartmentName = (str) => {
  const normalized = str?.toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes (diacríticos combinantes)
    .replace(/\./g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+D\s+C\s*/g, ' ')    // "BOGOTA D C" → "BOGOTA"
    .replace(/\s+/g, ' ')
    .trim() || '';

  return DEPARTMENT_NAME_ALIASES[normalized] || normalized;
};

// ── Variante Conecta (minúsculas, TypeScript-friendly, mapeo a dataset propio) ──
export function normDept(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\./g, '').trim();
}

// Nombres del GeoJSON → nombres del dataset propio (casos especiales)
export const DEPT_MAP = {
  bogota: 'Cundinamarca',
  'bogota dc': 'Cundinamarca',
  'distrito capital': 'Cundinamarca',
  'archipielago de san andres': 'San Andrés y Providencia',
  'san andres providencia y santa catalina': 'San Andrés y Providencia',
};

export function resolverDept(rawName, deptsConDatos) {
  const norm = normDept(rawName);
  const mapped = DEPT_MAP[norm];
  if (mapped) return mapped;
  return [...deptsConDatos].find(d => normDept(d) === norm) ?? null;
}

// ── Escalado visual de San Andrés (PNMC): el archipiélago es tan pequeño que
// resulta inclickeable; se re-proyectan sus coordenadas alrededor de su centroide ──
const ARCHIPELAGO_VISUAL_SCALE = 8.5;

export const buildScaledFeature = (feature, scale = ARCHIPELAGO_VISUAL_SCALE, helpers) => {
  const { getCoordinatesBounds, mapCoordinatesDeep } = helpers; // ver mapDomain.js del PNMC
  if (!feature?.geometry?.coordinates) return null;

  const bounds = getCoordinatesBounds(feature.geometry.coordinates);
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: mapCoordinatesDeep(feature.geometry.coordinates, ([lng, lat]) => ([
        centerLng + (lng - centerLng) * scale,
        centerLat + (lat - centerLat) * scale,
      ])),
    },
  };
};
