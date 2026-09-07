"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Building2,
  Heart,
  Clock,
  Home,
  GraduationCap,
  Building,
  Table,
  Scale,
  MapPin,
  Target,
  LogOut,
  User,
} from "lucide-react";
import { useMapsStore } from "@/store/maps-store";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "map", title: "Map View", icon: MapPin, href: "/" },
  { id: "table", title: "Spreadsheet Table", icon: Table, href: "/table" },
  { id: "compare", title: "Compare Places", icon: Scale, href: "/compare" },
  { id: "favorites", title: "Favorites", icon: Heart, href: "/favorites" },
  { id: "recents", title: "Recent Added", icon: Clock, href: "/recents" },
];

const typeIconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  "building-2": Building2,
  home: Home,
  "graduation-cap": GraduationCap,
  building: Building,
};

export function LocationsSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const {
    listings,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    activeCenterPointId,
    centerPoints,
    compareListingIds,
  } = useMapsStore();

  const favoriteCount = listings.filter((l) => l.is_favorite).length;
  const compareCount = compareListingIds.length;
  const activeCp = centerPoints.find((cp) => cp.id === activeCenterPointId);

  const getTypeCount = (typeId: string) => {
    if (typeId === "all") return listings.length;
    return listings.filter((l) => l.type === typeId).length;
  };

  const getStatusCount = (statusId: string) => {
    return listings.filter((l) => l.status === statusId).length;
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-3 py-3 border-b">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
              <Building2 className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight truncate">
              NestPick
            </span>
          </Link>
          <SidebarTrigger className="size-7 shrink-0 text-muted-foreground hover:text-foreground" />
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
          <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2.5">
        {/* Main Navigation Views */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                let badge: number | undefined;
                if (item.id === "favorites") badge = favoriteCount;
                if (item.id === "map") badge = listings.length;
                if (item.id === "compare") badge = compareCount;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="h-8">
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge !== undefined && badge > 0 && (
                      <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Property Types */}
        <SidebarGroup className="p-0 mt-4 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="px-0 h-6">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Property Types
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                  className="h-7"
                >
                  <Building2 className="size-3.5" />
                  <span className="text-xs">All Types</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>{getTypeCount("all")}</SidebarMenuBadge>
              </SidebarMenuItem>
              {propertyTypes.map((category) => {
                const Icon = typeIconMap[category.icon] || Building2;
                const count = getTypeCount(category.id);

                return (
                  <SidebarMenuItem key={category.id}>
                    <SidebarMenuButton
                      isActive={selectedCategory === category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="h-7"
                    >
                      <Icon
                        className="size-3.5"
                        style={{ color: category.color }}
                      />
                      <span className="text-xs">{category.name}</span>
                    </SidebarMenuButton>
                    {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pipeline Tracking Status */}
        <SidebarGroup className="p-0 mt-4 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="px-0 h-6">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Pipeline Stage
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedStatus === "all"}
                  onClick={() => setSelectedStatus("all")}
                  className="h-7"
                >
                  <span className="size-2 rounded-full bg-foreground inline-block mr-1"></span>
                  <span className="text-xs">All Pipeline</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {pipelineStatuses.map((st) => {
                const count = getStatusCount(st.id);
                return (
                  <SidebarMenuItem key={st.id}>
                    <SidebarMenuButton
                      isActive={selectedStatus === st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className="h-7"
                    >
                      <span
                        className="size-2 rounded-full inline-block mr-1"
                        style={{ backgroundColor: st.color }}
                      />
                      <span className="text-xs">{st.name}</span>
                    </SidebarMenuButton>
                    {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2.5 pb-3">
        {/* Expanded Footer */}
        <div className="group-data-[collapsible=icon]:hidden space-y-2">
          {/* Active Target Info Card */}
          <div className="rounded-lg border p-2.5 text-xs bg-muted/40">
            <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-semibold mb-1">
              <Target className="size-3.5" />
              <span>Target Reference</span>
            </div>
            <p className="text-foreground font-medium truncate">
              {activeCp?.name || "Workplace"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Distances calculated automatically
            </p>
          </div>

          {/* User Session & Logout */}
          <div className="flex items-center justify-between rounded-lg border bg-background/50 px-2.5 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
                <User className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Authenticated
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleSignOut}
              title="Sign Out"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-3.5" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            NestPick • Condo Tracker
          </p>
        </div>

        {/* Collapsed Icon Mode Footer */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSignOut}
            title={`Sign out (${session?.user?.name || "Admin"})`}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-3.5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
