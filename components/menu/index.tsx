"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, HelpCircle, Home as HomeIcon, Podium, ListSortAscending } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/profile", label: "Perfil", icon: CircleUserRound },
  { href: "/tier-lists", label: "Tier Lists", icon: ListSortAscending },
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/top-games", label: "Top Jogos", icon: Podium },
  { href: "/faq", label: "Dúvidas", icon: HelpCircle },
];

export function Menu() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const delta = scrollY - lastScrollY.current;
        if (scrollY <= 0 || Math.abs(delta) < 10) {
          if (scrollY <= 0) setVisible(true);
        } else {
          setVisible(delta < 0);
        }
        lastScrollY.current = scrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-40 mx-auto max-w-85 lg:hidden min-h-14 rounded-full grid grid-cols-5 items-center justify-items-center px-2 py-1",
        "border border-white/20 bg-white/10 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]",
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-[calc(100%+2rem)]"
      )}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-center size-11 max-w-full rounded-full text-zinc-400 transition-all duration-200",
              isActive && "scale-115 bg-zinc-300 text-zinc-800"
            )}
          >
            <Icon className="size-6" />
          </Link>
        );
      })}
    </nav>
  );
}
