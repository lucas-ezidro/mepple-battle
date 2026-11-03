'use client'

import logo from '@/public/logo3.png'
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export function Header({ children }: { children?: ReactNode }) {
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setIsScrollingDown(false);
      } else {
        setIsScrollingDown(currentScrollY > lastScrollY);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


  return (
    <header
      className={`
        w-full sticky top-0 shrink-0 p-4
        pt-[max(1rem,env(safe-area-inset-top))]
        bg-zinc-800 flex flex-wrap items-center gap-3 sm:gap-4
        transition-opacity duration-300 ease-in-out
        ${isScrollingDown ? "opacity-10 sm:opacity-50" : "opacity-100"}
      `}
    >
      <Link href="/" className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <Image className="h-12 sm:h-16 w-auto shrink-0" src={logo} alt="Logo" />

        <span className="min-w-0 flex flex-wrap items-baseline gap-x-1 select-none text-xl sm:text-2xl font-black italic tracking-tight">
          <span className="text-zinc-100 [text-shadow:2px_2px_0_rgba(0,0,0,0.5)]">
            Batalha
          </span>

          <span className="text-sm font-medium not-italic text-zinc-400">
            dos
          </span>

          <span className="bg-linear-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(251,146,60,0.45)]">
            Meeples
          </span>
        </span>
      </Link>

      {children}
    </header>
  )
}