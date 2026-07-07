import dynamic from 'next/dynamic';

const MapaColombia = dynamic(() => import('./MapaColombiaInner'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 300, background: '#F0EDF8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9080B8', fontSize: 13 }}>
      Cargando mapa…
    </div>
  ),
});

export default MapaColombia;
