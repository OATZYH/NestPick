"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Heart,
  Clock,
  Settings,
  ChevronsUpDown,
  Home,
  GraduationCap,
  Building,
  Table,
  Scale,
  MapPin,
  Target,
} from "lucide-react";
import { useMapsStore } from "@/store/maps-store";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";

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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-2.5 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 w-full hover:bg-sidebar-accent rounded-md p-1 -m-1 transition-colors shrink-0">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                <Building2 className="size-4" />
              </div>
              <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">Condo Hunting</span>
                <ChevronsUpDown className="size-3 text-muted-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/" className="flex items-center gap-2">
                <MapPin className="size-4" />
                <span>Map Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/table" className="flex items-center gap-2">
                <Table className="size-4" />
                <span>Table View</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/compare" className="flex items-center gap-2">
                <Scale className="size-4" />
                <span>Compare Listings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              <Settings className="size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                    <SidebarMenuButton asChild isActive={isActive} className="h-8">
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
        <SidebarGroup className="p-0 mt-4">
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
        <SidebarGroup className="p-0 mt-4">
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

          <p className="text-center text-[10px] text-muted-foreground">
            Condo Hunting Tracker • Next.js 16
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
