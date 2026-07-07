'use client';

import { useEffect, useRef } from 'react';
import type { PerfilConfig } from '@/lib/types';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import styles from './AppShell.module.css';

export type Vista = 'oportunidades' | 'perfil' | 'reporte' | 'sugeridas';

interface Seccion {
  id: Vista;
  etiqueta: string;
  icono: string;
}

const SECCIONES: Seccion[] = [
  { id: 'oportunidades', etiqueta: 'Oportunidades', icono: '◧' },
  { id: 'sugeridas', etiqueta: 'Sugerencias tuyas', icono: '◍' },
  { id: 'perfil', etiqueta: 'Mi perfil', icono: '◔' },
  { id: 'reporte', etiqueta: 'Reporte', icono: '◇' },
];

interface Props {
  vista: Vista;
  onVista: (v: Vista) => void;
  fecha?: string;
  menuAbierto: boolean;
  onMenu: (abierto: boolean) => void;
  nuevas: number;
  perfiles: PerfilConfig[];
  perfilActivo: PerfilConfig;
  conteos: Record<string, number>;
  onSelectPerfil: (id: string) => void;
}

export default function AppShell({
  vista,
  onVista,
  fecha,
  menuAbierto,
  onMenu,
  nuevas,
  perfiles,
  perfilActivo,
  conteos,
  onSelectPerfil,
}: Props) {
  const hamburguesaRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const estuvoAbierto = useRef(false);

  // Escape + focus trap dentro del drawer
  useEffect(() => {
    if (!menuAbierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onMenu(false);
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const f = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (f.length === 0) return;
        const primero = f[0];
        const ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuAbierto, onMenu]);

  // Bloquear scroll + foco + inert
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    const drawer = drawerRef.current;
    if (menuAbierto) {
      drawer?.removeAttribute('inert');
      drawer?.querySelector<HTMLElement>('button, a[href]')?.focus();
    } else {
      drawer?.setAttribute('inert', '');
      if (estuvoAbierto.current) hamburguesaRef.current?.focus();
    }
    estuvoAbierto.current = menuAbierto;
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  function irA(v: Vista) {
    onVista(v);
    onMenu(false);
  }

  function seleccionarPerfil(id: string) {
    onSelectPerfil(id);
    onMenu(false);
  }

  return (
    <header className={styles.header}>
      <div className={styles.interno}>
        {/* Hamburguesa (solo móvil) */}
        <button
          ref={hamburguesaRef}
          type="button"
          className={styles.hamburguesa}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          onClick={() => onMenu(true)}
        >
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
        </button>

        <div className={styles.marca}>
          <Logo />
          <span className={styles.separador} aria-hidden />
          <span className={styles.titulo}>Radar de empleos</span>
        </div>

        <ThemeToggle />
      </div>

      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${menuAbierto ? styles.backdropVisible : ''}`}
        onClick={() => onMenu(false)}
        aria-hidden
      />

      {/* Drawer móvil */}
      <aside
        ref={drawerRef as React.RefObject<HTMLElement>}
        className={`${styles.drawer} ${menuAbierto ? styles.drawerAbierto : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className={styles.drawerCabecera}>
          <span className={styles.drawerTitulo}>Menú</span>
          <button
            type="button"
            className={styles.cerrar}
            aria-label="Cerrar menú"
            onClick={() => onMenu(false)}
          >
            ✕
          </button>
        </div>

        {/* Perfiles */}
        <div className={styles.drawerSeccionNav}>
          <span className={styles.drawerSeccionLabel}>Perfiles</span>
          {perfiles.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.drawerEnlace} ${p.id === perfilActivo.id ? styles.drawerEnlaceActivo : ''}`}
              onClick={() => seleccionarPerfil(p.id)}
            >
              <span
                className={styles.drawerAvatar}
                style={{ background: p.gradiente }}
                aria-hidden
              >
                {p.iniciales}
              </span>
              {p.nombre}
              <span className={styles.drawerConteo}>{conteos[p.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.drawerDivider} />

        {/* Secciones */}
        <div className={styles.drawerSeccionNav}>
          <span className={styles.drawerSeccionLabel}>Secciones</span>
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.drawerEnlace} ${vista === s.id ? styles.drawerEnlaceActivo : ''}`}
              onClick={() => irA(s.id)}
            >
              <span className={styles.drawerIcono} aria-hidden>
                {s.icono}
              </span>
              {s.etiqueta}
              {s.id === 'oportunidades' && nuevas > 0 && (
                <span className={styles.badge}>{nuevas}</span>
              )}
            </button>
          ))}
        </div>
      </aside>
    </header>
  );
}
