"use client";
import { useEffect, useState } from "react";

/** True cuando el viewport es de teléfono (< bp, default 640px = breakpoint `sm`).
 *  Mobile-first + estándar de la industria (Tailwind sm/md). SSR-safe. */
export function useIsMobile(bp = 640): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const on = () => setM(window.innerWidth < bp);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}

/** True para tablet o menos (< 768px = breakpoint `md`). */
export function useIsTablet(): boolean {
  return useIsMobile(768);
}
