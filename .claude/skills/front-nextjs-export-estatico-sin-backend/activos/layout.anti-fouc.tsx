import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import DevAgentation from '@/components/DevAgentation';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-sora',
});

export const metadata: Metadata = {
  title: 'Radar de Empleos — Camilo & Divergente AMC',
  description:
    'Portal privado de ofertas laborales y convocatorias con match de perfil (CT / DIV).',
};

// Aplica el tema guardado ANTES del primer paint (evita el parpadeo claro→oscuro).
const themeScript = `(function(){try{var t=localStorage.getItem('tema');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <DevAgentation />
      </body>
    </html>
  );
}
