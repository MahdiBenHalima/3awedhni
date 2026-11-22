import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Search, UserRound } from "lucide-react";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CareStoreProvider, useCareStore } from "@/lib/care-store";
import { followUpQueue } from "@/lib/events";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <CareStoreProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1 px-4 py-6 sm:px-8">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </CareStoreProvider>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const { events } = useCareStore();
  const pending = followUpQueue(events).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-8">
      <SidebarTrigger className="rounded-xl" />
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un patient (ex. PT-4821)"
          className="h-10 rounded-full bg-card pl-9"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Suivis à examiner"
        >
          <Bell />
          {pending > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[0.6rem] font-bold text-destructive-foreground">
              {pending}
            </span>
          )}
        </Button>
        <div className="hidden items-center gap-2.5 rounded-full bg-card py-1 pl-1 pr-4 shadow-soft sm:flex">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              <UserRound className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">Espace médecin</div>
            <div className="text-[0.7rem] text-muted-foreground">Compte médecin</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Se déconnecter"
          onClick={() => navigate({ to: "/", replace: true })}
        >
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
