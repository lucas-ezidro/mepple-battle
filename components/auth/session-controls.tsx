import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { Menu } from "@/components/menu";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "./logout-button";

export async function SessionMenu() {
  return await getCurrentSession() ? <Menu /> : null;
}

export async function SessionActions() {
  if (!await getCurrentSession()) return null;
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>Meu perfil</Link>
      <LogoutButton />
    </div>
  );
}

export async function HomeActions() {
  const session = await getCurrentSession();
  return (
    <Link href={session ? "/top-games" : "/login"} className={buttonVariants({ size: "lg" })}>
      {session ? "Acessar meus tops" : "Entrar ou criar conta"}
    </Link>
  );
}
