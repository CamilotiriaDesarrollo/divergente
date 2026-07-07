'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const DEPT_ALIAS = { "BogotáD.C.": "Bogotá D.C." };
const BG = "#CDD1DA"; // fondo gris-azulado (mar + países vecinos)

function mapColor(count) {
  if (count === 0) return "#EAE5F2";
  if (count === 1) return "#C8B8E8";
  if (count <= 3) return "#A08CC8";
  if (count <= 7) return "#7055AA";
  return "#2D1658";
}

function buildByDept(data) {
  const m = {};
  data.forEach(d => {
    (d.departamentos || []).forEach(dept => { m[dept] = (m[dept] || 0) + 1; });
  });
  return m;
}

export default function MapaColombiaInner({ data, fDepts = [], onDeptClick }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);
  const dataRef      = useRef(data);
  const fDeptsRef    = useRef(fDepts);
  const onClickRef   = useRef(onDeptClick);

  dataRef.current  = data;
  fDeptsRef.current = fDepts;
  onClickRef.current = onDeptClick;

  function applyColors() {
    if (!layerRef.current) return;
    const byDept = buildByDept(dataRef.current);
    layerRef.current.eachLayer(lyr => {
      const raw      = lyr.feature.properties.NAME_1;
      const name     = DEPT_ALIAS[raw] || raw;
      const count    = byDept[name] || 0;
      const selected = fDeptsRef.current.includes(name);
      lyr.setStyle({
        fillColor:   mapColor(count),
        fillOpacity: selected ? 0.95 : 0.72,
        color:       selected ? '#1A0A3D' : '#FFFFFF',
        weight:      selected ? 2.5 : 0.8,
      });
      lyr.unbindTooltip();
      lyr.bindTooltip(
        `<strong>${name}</strong><br/>${count} investigación${count !== 1 ? 'es' : ''}`,
        { sticky: true, direction: 'top' }
      );
    });
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        zoomSnap: 0.25,
      });
      mapRef.current = map;

      // Fondo gris base
      map.getContainer().style.background = BG;

      // Tiles OSM muy suavizados: escala de grises + baja opacidad
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        opacity: 1,
      }).addTo(map);
      // Aplica el filtro al pane de tiles (no toca la capa GeoJSON)
      map.getPanes().tilePane.style.filter = 'grayscale(1) opacity(0.5)';

      const res     = await fetch('/colombia-depts.json');
      const geojson = await res.json();
      if (cancelled) return;

      const layer = L.geoJSON(geojson, {
        style: () => ({ fillColor: '#EAE5F2', fillOpacity: 0.72, color: '#FFF', weight: 0.8 }),
        onEachFeature: (feat, lyr) => {
          const raw  = feat.properties.NAME_1;
          const name = DEPT_ALIAS[raw] || raw;
          lyr.on({
            mouseover: e => {
              e.target.setStyle({ weight: 2, fillOpacity: 0.95, color: '#1A0A3D' });
              e.target.getElement().style.cursor = 'pointer';
            },
            mouseout: e => {
              const count    = buildByDept(dataRef.current)[name] || 0;
              const selected = fDeptsRef.current.includes(name);
              e.target.setStyle({
                fillColor:   mapColor(count),
                fillOpacity: selected ? 0.95 : 0.72,
                color:       selected ? '#1A0A3D' : '#FFF',
                weight:      selected ? 2.5 : 0.8,
              });
            },
            click: () => {
              if (onClickRef.current) onClickRef.current(name);
            },
          });
        },
      }).addTo(map);

      layerRef.current = layer;
      // Ajuste justo: Colombia llena el contenedor con mínimo padding
      map.fitBounds(layer.getBounds(), { padding: [6, 6] });
      applyColors();
    })().catch(console.error);

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; layerRef.current = null; }
    };
  }, []);

  useEffect(() => { applyColors(); }, [data, fDepts]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height: 480, width: '100%', borderRadius: 8, overflow: 'hidden', background: BG }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#AAA', marginRight: 4 }}>Investigaciones:</span>
        {[[0,'0'],[1,'1'],[2,'2–3'],[4,'4–7'],[8,'8+']].map(([cnt, label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#666' }}>
            <span style={{ width:10, height:10, borderRadius:2, background:mapColor(cnt), display:'inline-block', flexShrink:0 }} />
            {label}
          </div>
        ))}
        <span style={{ fontSize:10, color:'#AAA', marginLeft:4 }}>· Clic en departamento para filtrar</span>
      </div>
    </div>
  );
}
