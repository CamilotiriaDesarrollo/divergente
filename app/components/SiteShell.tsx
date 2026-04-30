"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const NAV_ITEMS = [
  { label: "Analítica", scheme: "hover-analitica", href: "/analitica" },
  { label: "Metodologías", scheme: "hover-metodologias", href: "/metodologias" },
  { label: "Creatividad", scheme: "hover-creatividad", href: "/creatividad" },
  { label: "Portafolio", scheme: "hover-portafolio", href: "/portafolio" },
  { label: "Blog", scheme: "hover-blog", href: "/blog" },
] as const;

const SCHEMES = NAV_ITEMS.map((n) => n.scheme);

const ROUTE_TO_INDEX: Record<string, number> = {
  "/analitica": 0,
  "/metodologias": 1,
  "/creatividad": 2,
  "/portafolio": 3,
  "/blog": 4,
};

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lockedIndex = ROUTE_TO_INDEX[pathname] ?? null;

  const bgRef = useRef<HTMLDivElement | null>(null);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const navAutoRef = useRef<{
    hover: (i: number) => void;
    leave: () => void;
  } | null>(null);

  useEffect(() => {
    const AUTO_SPEED_PX_PER_SEC = 10;
    const USER_MULTIPLIER = 0.6;

    let bgOffset = 0;
    let lastTime = performance.now();

    const apply = () => {
      bgRef.current?.style.setProperty("--bg-offset", `${-bgOffset}px`);
    };

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      bgOffset += AUTO_SPEED_PX_PER_SEC * dt;
      apply();
      rafId = requestAnimationFrame(tick);
    };
    let rafId = requestAnimationFrame(tick);

    const onWheel = (e: WheelEvent) => {
      bgOffset += e.deltaY * USER_MULTIPLIER;
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      bgOffset += dy * USER_MULTIPLIER;
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    const alignNav = () => {
      const wm = wordmarkRef.current;
      const nav = navRef.current;
      if (!wm || !nav) return;
      const range = document.createRange();
      range.selectNodeContents(wm);
      const textRect = range.getBoundingClientRect();
      const containerRect = wm.parentElement!.getBoundingClientRect();
      const leftPad = textRect.left - containerRect.left;
      const rightPad = containerRect.right - textRect.right;
      nav.style.paddingLeft = `${Math.max(0, leftPad + 12)}px`;
      nav.style.paddingRight = `${Math.max(0, rightPad)}px`;
    };
    document.fonts.ready.then(alignNav);
    window.addEventListener("resize", alignNav);
    return () => window.removeEventListener("resize", alignNav);
  }, []);

  useEffect(() => {
    const apply = (value: number | null) => {
      document.body.classList.remove(...SCHEMES);
      if (value !== null) document.body.classList.add(NAV_ITEMS[value].scheme);
      const links = navRef.current?.querySelectorAll<HTMLAnchorElement>(
        "a.nav-link"
      );
      links?.forEach((link, i) => {
        link.classList.toggle("is-active", value !== null && i === value);
      });
    };

    apply(lockedIndex);

    if (lockedIndex !== null) {
      // Subpage: lock scheme, no auto-cycle, no hover-driven scheme changes.
      return () => {
        document.body.classList.remove(...SCHEMES);
        navRef.current
          ?.querySelectorAll<HTMLAnchorElement>("a.nav-link")
          .forEach((link) => link.classList.remove("is-active"));
      };
    }

    // Homepage: auto-cycle + hover handlers.
    let current: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const randomDelay = () => 4000 + Math.random() * 3000;
    const POOL: (number | null)[] = [null, 0, 1, 2, 3, 4];

    const pickNext = (): number | null => {
      const candidates = POOL.filter((v) => v !== current);
      return candidates[Math.floor(Math.random() * candidates.length)];
    };

    const tick = () => {
      current = pickNext();
      apply(current);
      timeoutId = setTimeout(tick, randomDelay());
    };

    const startCycle = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(tick, randomDelay());
    };

    navAutoRef.current = {
      hover(i) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
        current = i;
        apply(i);
      },
      leave() {
        current = null;
        apply(null);
        startCycle();
      },
    };

    startCycle();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.body.classList.remove(...SCHEMES);
      navRef.current
        ?.querySelectorAll<HTMLAnchorElement>("a.nav-link")
        .forEach((link) => link.classList.remove("is-active"));
      navAutoRef.current = null;
    };
  }, [lockedIndex]);

  const isSubpage = lockedIndex !== null;

  const navLinks = NAV_ITEMS.map((item, i) => (
    <Link
      key={item.label}
      href={item.href}
      className="nav-link"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") navAutoRef.current?.hover(i);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") navAutoRef.current?.leave();
      }}
    >
      {item.label}
    </Link>
  ));

  return (
    <>
      {!isSubpage && (
        <div ref={bgRef} className="bg-layer" aria-hidden="true" />
      )}

      {isSubpage ? (
        <div className="flex min-h-screen flex-col">
          <header className="site-header">
            <Link href="/" className="logo-link" aria-label="Inicio Divergente">
              <Image
                src="/logo.png"
                alt=""
                width={64}
                height={64}
                className="logo-icon"
                priority
              />
              <span className="logo-text">DIVERGENTE</span>
            </Link>
            <nav
              ref={navRef}
              aria-label="Navegación principal"
              className="site-nav"
            >
              {navLinks}
            </nav>
          </header>

          <main className="site-main">{children}</main>
        </div>
      ) : (
        <div className="relative z-10 flex h-screen flex-col">
          {children}

          <div className="relative pb-2">
            <div className="flex items-stretch">
              <div ref={wordmarkRef} className="wordmark">
                DIVERGENTE
              </div>
              <span className="wordmark-vertical">DIVERGENTE</span>
            </div>

            <nav
              ref={navRef}
              aria-label="Navegación principal"
              className="flex items-center justify-between pt-4 pb-7 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-0 max-[700px]:px-4 max-[700px]:pl-6 max-[700px]:pb-6"
            >
              {navLinks}
            </nav>
          </div>
        </div>
      )}

      {!isSubpage && (
      <div className="social-circles">
        <a className="circle-link" data-brand="youtube" href="#" aria-label="YouTube">
          <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
          </svg>
          <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8z" fill="#FF0000" />
            <polygon points="9.6,15.6 15.9,12 9.6,8.4" fill="#FFFFFF" />
          </svg>
        </a>
        <a className="circle-link" data-brand="instagram" href="#" aria-label="Instagram">
          <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.1 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
          </svg>
          <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <radialGradient id="ig-grad" cx="0.3" cy="1" r="1.2">
                <stop offset="0%" stopColor="#FED576" />
                <stop offset="25%" stopColor="#F47133" />
                <stop offset="55%" stopColor="#BC3081" />
                <stop offset="85%" stopColor="#4C63D2" />
              </radialGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
            <rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.6" />
            <circle cx="17" cy="7" r="0.9" fill="#fff" />
          </svg>
        </a>
        <a className="circle-link" data-brand="linkedin" href="#" aria-label="LinkedIn">
          <svg className="icon-default" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.4 20.4h-3.4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.4H9.8V9h3.3v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3v6.3zM5.3 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1.7 13H3.6V9h3.4v11.4zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z" />
          </svg>
          <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="0" y="0" width="24" height="24" rx="4" fill="#0A66C2" />
            <path
              d="M20.4 20.4h-3.4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.4H9.8V9h3.3v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.3v6.3zM5.3 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1.7 13H3.6V9h3.4v11.4z"
              fill="#FFFFFF"
            />
          </svg>
        </a>
        <a className="circle-link" data-brand="whatsapp" href="#" aria-label="WhatsApp">
          <svg className="icon-default" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19.05 4.91A9.82 9.82 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.65.41 3.27 1.18 4.71L2.05 22l5.43-1.43A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.66-1.05-5.18-2.95-7.09z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M16.83 14.42c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.18-1.34-.81-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.61-1.46-.83-2-.22-.53-.45-.45-.61-.46-.16-.01-.34-.01-.52-.01-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.13.18 1.91 2.92 4.63 4.09.65.28 1.15.45 1.55.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31z"
              fill="currentColor"
            />
          </svg>
          <svg className="icon-hover" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19.05 4.91A9.82 9.82 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.65.41 3.27 1.18 4.71L2.05 22l5.43-1.43A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.66-1.05-5.18-2.95-7.09z"
              fill="none"
              stroke="#25D366"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M16.83 14.42c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.18-1.34-.81-.72-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.61-1.46-.83-2-.22-.53-.45-.45-.61-.46-.16-.01-.34-.01-.52-.01-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.13.18 1.91 2.92 4.63 4.09.65.28 1.15.45 1.55.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31z"
              fill="#25D366"
            />
          </svg>
        </a>
      </div>
      )}
    </>
  );
}
