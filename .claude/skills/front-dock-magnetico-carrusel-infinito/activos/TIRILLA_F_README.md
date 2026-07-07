# TirillaF — Barra institucional de sistemas

Componente React de barra de logos institucionales con dos secciones:
una sección fija con efecto dock magnético (al estilo macOS) y un carrusel
con auto-scroll infinito. Incluye variante oscura y modo estático.

---

## Stack tecnológico

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Lenguaje   | TypeScript 5                        |
| UI         | React 18 (hooks funcionales)        |
| Estilos    | CSS puro (BEM), sin librerías UI    |
| Build      | Vite 5                              |
| Logos      | SVG inline (inyectado via `svgRaw`) |

---

## Archivos involucrados

```
client/src/
├── components/
│   └── tirillaF.tsx          ← Componente principal (toda la lógica)
├── data/
│   └── sistemasDemo.ts       ← Datos de los sistemas (logos SVG + metadatos)
└── index.css                 ← Estilos (buscar bloque "PROPUESTA F")
```

### `tirillaF.tsx`
Contiene toda la lógica React:
- Efecto dock magnético (sección fija)
- Auto-scroll infinito con `requestAnimationFrame`
- Pausa en hover y en touch (eventos `touchstart`/`touchend`)
- Modo estático (`staticMode`) sin animación

### `sistemasDemo.ts`
Array de objetos `SistemaDemo`:
```ts
interface SistemaDemo {
  id: string
  sigla: string       // texto fallback si no hay SVG
  descripcion: string // texto bajo el logo
  svgRaw?: string     // SVG como string (se inyecta inline)
}
```

### `index.css` — bloque relevante
Buscar el comentario `/* ─── PROPUESTA F — Magnetic dock */`.  
Todas las clases usan el prefijo `tirilla-f__` (metodología BEM).  
Los breakpoints responsive están al final del archivo, en el bloque
`/* RESPONSIVE — orden: 4K → 2K → xl → lg → tablet → mobile */`.

---

## Props del componente

```tsx
<TirillaF
  sistemas={sistemasDemo}         // requerido: array de SistemaDemo
  labelFixed="Explora la cultura" // título sección fija (default: 'Explora la cultura')
  labelCarousel="Aliados"         // título sección carrusel
  dark={false}                    // variante oscura (default: false)
  staticMode={false}              // sin auto-scroll, sin triplicado (default: false)
/>
```

---

## Cómo funciona el auto-scroll

El carrusel triiplica el array de items (`[...items, ...items, ...items]`)
para dar la ilusión de scroll infinito. Un loop de `requestAnimationFrame`
avanza `posRef.current` en `0.3px` por frame (~18px/s a 60fps).
Cuando llega al primer tercio del `scrollWidth`, resetea al inicio del
segundo tercio — el usuario nunca ve el salto.

```
[  copia A  |  copia B  |  copia C  ]
              ↑ zona visible         ↑ reset al llegar aquí
```

- **Pause on hover**: `mouseenter`/`mouseleave` en el contenedor.
- **Pause on touch**: `touchstart` pausa, `touchend` reanuda tras 1500ms.
- **Modo estático**: no hay RAF, los items se renderizan una sola vez,
  y en mobile se activa `scroll-snap-type: x proximity`.

---

## Efecto dock magnético (sección fija)

Se calcula la distancia euclidiana entre el cursor y el centro de cada logo.
Si la distancia es menor al radio de influencia (`INFLUENCE = 100px`),
se aplica una escala entre `1` y `MAX_SCALE = 1.9` con curva de potencia `^1.8`.

```ts
const scale = 1 + (MAX_SCALE - 1) * Math.pow(1 - dist / INFLUENCE, 1.8)
```

El logo más cercano al cursor es el "activo" y muestra su nombre.

---

## Responsive

| Breakpoint   | Ancho        | Comportamiento                                  |
|--------------|--------------|-------------------------------------------------|
| 4K           | ≥ 2560px     | logos y carrusel escalados al doble             |
| 2K           | 1920–2559px  | escala intermedia                               |
| Base         | 1440px       | diseño de referencia                            |
| xl           | 1280–1439px  | logos ligeramente reducidos                     |
| lg           | 1024–1279px  | logos más pequeños                              |
| Tablet       | 768–1023px   | logos compactos, nav se achica                  |
| Mobile       | ≤ 767px      | layout vertical: fija arriba, carrusel abajo    |
| Mobile M     | ≤ 375px      | logos y carousel más pequeños                   |
| Mobile S     | ≤ 320px      | versión mínima, todo compacto                   |

---

## Variante oscura (`dark`)

Activar con `dark={true}`. Cambia el fondo a `#0D0B1A` y aplica tonos
violeta `rgba(210, 180, 255, 0.72)` a logos, flechas y divisor.

---

## Constantes ajustables (al tope de `tirillaF.tsx`)

```ts
const FIXED_COUNT    = 4    // logos en la sección fija (izquierda)
const MAX_SCALE      = 1.9  // escala pico del dock magnético
const INFLUENCE      = 100  // radio de influencia en px
const CAROUSEL_SPEED = 0.3  // px por fotograma (~18px/s a 60fps)
```

---

## Añadir un nuevo sistema

1. Exportar el SVG del sistema como string y agregarlo en `sistemasDemo.ts`:

```ts
export const sistemasDemo: SistemaDemo[] = [
  {
    id: 'nuevo-sistema',
    sigla: 'NS',
    descripcion: 'Nombre del Sistema',
    svgRaw: `<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>`,
  },
  // ...
]
```

2. Los primeros `FIXED_COUNT` (4 por defecto) van a la sección fija.
   El resto va al carrusel automáticamente.

---

## Notas de accesibilidad

- Cada logo es un `<a>` con `title={descripcion}` para lectores de pantalla.
- El auto-scroll se pausa cuando el usuario interactúa (hover / touch).
- En modo estático, se recomienda usar `scroll-snap` (ya activado en mobile).
- Los SVGs inline tienen `fill="currentColor"` para heredar el color del contenedor.
