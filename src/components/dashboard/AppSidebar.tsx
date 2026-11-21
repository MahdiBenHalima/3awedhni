import { Link, useRouterState } from "@tanstack/react-router";
import { FileAudio, LayoutDashboard, MessagesSquare, ScrollText, ShieldCheck } from "lucide-react";

import { Logo, LogoMark } from "@/components/brand/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Consultations & consignes", url: "/consultations", icon: FileAudio },
  { title: "Simulateur patient", url: "/simulateur", icon: MessagesSquare },
  { title: "Journal d'audit", url: "/journal", icon: ScrollText },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        {collapsed ? <LogoMark className="mx-auto h-8 w-8" /> : <Logo />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Espace médecin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-10 rounded-xl data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="rounded-2xl bg-gradient-deep p-4 text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
            <p className="mt-2 text-sm font-semibold">Prototype de démonstration</p>
            <p className="mt-1 text-xs opacity-85">
              Données fictives. Ni diagnostic, ni prescription par l'IA.
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
