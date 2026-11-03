import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { Menu } from "@/components/menu";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "./logout-button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu";

export async function SessionMenu() {
  return await getCurrentSession() ? <Menu /> : null;
}

export async function SessionActions() {
  if (!await getCurrentSession()) return null;

  function ListItem({
    title,
    children,
    href,
    ...props
  }: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
    return (
      <li {...props}>
        <NavigationMenuLink render={<Link href={href}><div className="flex flex-col gap-1 text-sm">
          <div className="leading-none font-medium">{title}</div>
          <div className="line-clamp-2 text-muted-foreground">{children}</div>
        </div></Link>} />
      </li>
    )
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
      <div className="hidden sm:block">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul>
                  <ListItem href="/profile" title="Perfil">
                    Ver meu perfil
                  </ListItem>
                  <ListItem href="/tier-lists" title="Tier Lists">
                    Ver minhas Tier Lists
                  </ListItem>
                  <ListItem href="/top-games" title="Top Games">
                    Ver meus Top Games
                  </ListItem>
                  <ListItem href="/faq" title="FAQ">
                    Ver as perguntas frequentes
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
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
