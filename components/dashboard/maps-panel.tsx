"use client";

import * as React from "react";
import {
  Search,
  ArrowUpDown,
  Building2,
  Building,
  GraduationCap,
  Home,
  Plus,
  Compass,
  Star,
  Calendar,
  X,
  PanelLeft,
  Target,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useMapsStore,
  SortBy,
  getLatestRent,
  getLatestDeposit,
} from "@/store/maps-store";
import {
  propertyTypes,
  pipelineStatuses,
} from "@/mock-data/condos";
import { Listing, PipelineStatus, PropertyType } from "@/types/hunting";
import { cn } from "@/lib/utils";

interface MapsPanelProps {
  mode?: "all" | "favorites" | "recents";
}

const MODE_CONFIG = {
  all: {
    title: "Bangkok Rentals",
    emptyIcon: Compass,
    emptyTitle: "No listings found",
    emptyDescription: "Try adjusting your filters or search query to find listings.",
    getSubtitle: (count: number) => `${count} places tracked`
  },
  favorites: {
    title: "Shortlisted & Favorites",
    emptyIcon: Star,
    emptyTitle: "No favorites yet",
    emptyDescription: "Star condo listings to add them to your priority shortlist.",
    getSubtitle: (count: number) => `${count} saved places`,
  },
  recents: {
    title: "Recent Pipeline Activity",
    emptyIcon: Calendar,
    emptyTitle: "No recent listings",
    emptyDescription: null,
    getSubtitle: (count: number) => `Latest ${count} places`,
  },
};

export function MapsPanel({ mode = "all" }: MapsPanelProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isLoadingRoute, setIsLoadingRoute] = React.useState(false);

  // New inline Price History dialog state
  const [newOfferRent, setNewOfferRent] = React.useState("");
  const [newOfferNote, setNewOfferNote] = React.useState("");
  const [showAddOffer, setShowAddOffer] = React.useState(false);

  // New inline Viewing Log dialog state
  const [newViewingNotes, setNewViewingNotes] = React.useState("");
  const [newViewingRating, setNewViewingRating] = React.useState(4);
  const [showAddViewing, setShowAddViewing] = React.useState(false);

  const {
    isLoading,
    selectedListingId,
    searchQuery,
    sortBy,
    selectedCategory,
    selectedStatus,
    activeCenterPointId,
    centerPoints,
    compareListingIds,
    selectListing,
    toggleFavorite,
    setSearchQuery,
    setSortBy,
    setSelectedStatus,
    getFilteredListings,
    getFavoriteListings,
    getRecentListings,
    getDistanceToActiveCenterPoint,
    getActiveCenterPoint,
    routeDestinationId,
    setRouteDestination,
    clearRoute,
    isPanelVisible,
    setPanelVisible,
    deleteListing,
    addPriceHistory,
    addViewingLog,
    updateListing,
    toggleCompareListing,
    // Centralized Modal & Picking State
    isListingModalOpen,
    setIsListingModalOpen,
    isCenterPointModalOpen,
    setIsCenterPointModalOpen,
    openAddListing,
    openEditListing,
    openCenterPointModal,
  } = useMapsStore();

  const activeCenterPoint = getActiveCenterPoint();

  let listings: Listing[] = [];
  if (mode === "favorites") {
    listings = getFavoriteListings();
  } else if (mode === "recents") {
    listings = getRecentListings();
  } else {
    listings = getFilteredListings();
  }

  const config = MODE_CONFIG[mode];

  // Auto scroll to active listing card
  React.useEffect(() => {
    if (selectedListingId && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(
        `[data-listing-id="${selectedListingId}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedListingId]);

  const handleRouteClick = (e: React.MouseEvent, listing: Listing) => {
    e.stopPropagation();
    if (routeDestinationId === listing.id) {
      clearRoute();
      return;
    }
    setIsLoadingRoute(true);
    setRouteDestination(listing.id);
    setTimeout(() => setIsLoadingRoute(false), 500);
  };

  const handleStatusQuickChange = (
    e: React.MouseEvent,
    listingId: string,
    newStatus: PipelineStatus
  ) => {
    e.stopPropagation();
    updateListing(listingId, { status: newStatus });
  };

  const handleAddPriceSubmit = (e: React.FormEvent, listingId: string) => {
    e.preventDefault();
    if (!newOfferRent) return;

    addPriceHistory(listingId, {
      rent: Number(newOfferRent),
      deposit: 0,
      advance: 0,
      common_fee: 0,
      parking_fee: 0,
      internet_fee: 0,
      water_type: "metered",
      water_rate: "",
      electric_type: "government",
      electric_rate: "",
      note: newOfferNote || "Price counter-offer or update",
    });

    setNewOfferRent("");
    setNewOfferNote("");
    setShowAddOffer(false);
  };

  const handleAddViewingSubmit = (e: React.FormEvent, listingId: string) => {
    e.preventDefault();
    if (!newViewingNotes) return;

    addViewingLog(listingId, {
      scheduled_at: new Date().toISOString(),
      notes: newViewingNotes,
      rating: newViewingRating,
      completed: true,
    });

    setNewViewingNotes("");
    setNewViewingRating(4);
    setShowAddViewing(false);
  };

  // Toggle button if panel is hidden
  if (!isPanelVisible) {
    return (
      <div className="absolute top-4 left-4 z-30">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPanelVisible(true)}
          className="shadow-lg bg-background/95 backdrop-blur-md border gap-2 text-xs font-medium hover:bg-background"
        >
          <PanelLeft className="size-4" />
          <span>Show Listings ({listings.length})</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "absolute top-4 left-4 bottom-4 z-30 w-[420px] max-w-[calc(100vw-32px)] flex flex-col bg-background/95 backdrop-blur-md rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300"
        )}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b flex items-center justify-between gap-2">
          <div>
            <h1 className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
              <span>{config.title}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.getSubtitle(listings.length)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 cursor-pointer"
              asChild
            >
              <Link href="/table">
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Table</span>
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 cursor-pointer"
              onClick={() => {
                openAddListing();
              }}
            >
              <Plus className="size-3.5" />
              <span>Add</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setPanelVisible(false)}
              title="Minimize Panel"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Reference Target Center Point Selector */}
        <div className="px-3 py-2 bg-muted/30 border-b flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <Target className="size-3.5 text-pink-500 shrink-0" />
            <span className="text-muted-foreground">Target:</span>
            <button
              onClick={() => openCenterPointModal()}
              className="font-medium text-foreground hover:underline truncate max-w-[190px] cursor-pointer"
            >
              {activeCenterPoint?.name || "Set Reference Point"}
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2 text-primary cursor-pointer"
            onClick={() => openCenterPointModal()}
          >
            Change
          </Button>
        </div>

        {/* Search & Sort Controls */}
        <div className="p-2 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search condos, locations, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/40"
              />
            </div>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortBy)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <ArrowUpDown className="size-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearest">Nearest to Target</SelectItem>
                <SelectItem value="rent-asc">Rent: Low to High</SelectItem>
                <SelectItem value="rent-desc">Rent: High to Low</SelectItem>
                <SelectItem value="size-desc">Size: Largest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="date-newest">Recently Added</SelectItem>
                <SelectItem value="alpha-az">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick status filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs py-0.5">
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              className={cn(
                "px-2 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer",
                selectedStatus === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              All Status
            </button>
            {pipelineStatuses.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={cn(
                  "px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer",
                  selectedStatus === s.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <span
                  className="size-1.5 rounded-full inline-block"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Listings List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-2.5 divide-y divide-border/40"
        >
          {/* Active selection banner with quick deselect button */}
          {selectedListingId && (
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs animate-in fade-in duration-150 mb-1">
              <span className="font-medium text-primary flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span>1 condo selected</span>
              </span>
              <button
                type="button"
                onClick={() => selectListing(null)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded hover:bg-primary/15 transition-colors"
                title="Deselect condo (Esc)"
              >
                <X className="size-3.5" />
                <span>Deselect</span>
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Loading listings from database...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <config.emptyIcon className="size-6" />
              </div>
              <h3 className="font-semibold text-sm">{config.emptyTitle}</h3>
              {config.emptyDescription && (
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  {config.emptyDescription}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-4 text-xs gap-1.5 cursor-pointer"
                onClick={() => {
                  openAddListing();
                }}
              >
                <Plus className="size-3.5" />
                Add First Listing
              </Button>
            </div>
          ) : (
            listings.map((listing) => {
              const rent = getLatestRent(listing);
              const deposit = getLatestDeposit(listing);
              const distanceKm = getDistanceToActiveCenterPoint(listing);
              const isSelected = selectedListingId === listing.id;
              const isComparing = compareListingIds.includes(listing.id);
              const isRouteActive = routeDestinationId === listing.id;

              const statusConfig = pipelineStatuses.find(
                (s) => s.id === listing.status
              );

              return (
                <div
                  key={listing.id}
                  data-listing-id={listing.id}
                  onClick={() => selectListing(listing.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer space-y-2.5 pt-3 group relative",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                      : "hover:border-primary/50 hover:bg-accent/40 bg-card/60"
                  )}
                >
                  {/* Top line: Name, Type badge, Price & Favorite button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-semibold text-sm truncate tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {listing.name}
                        </h2>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                          {listing.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {listing.address}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-foreground">
                        ฿{rent.toLocaleString()}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      {deposit > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          Dep ฿{deposit.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges row: Pipeline status, distance from target, size, floor */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    {statusConfig && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-1 border",
                          statusConfig.badgeClass
                        )}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: statusConfig.color }}
                        />
                        {statusConfig.name}
                      </span>
                    )}

                    <span className="px-1.5 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 font-medium text-[10px]">
                      {distanceKm < 1
                        ? `${Math.round(distanceKm * 1000)}m`
                        : `${distanceKm.toFixed(1)}km`}{" "}
                      from {activeCenterPoint?.name ? activeCenterPoint.name.split(" ")[0] : "target"}
                    </span>

                    <span className="text-[11px] text-muted-foreground">
                      {listing.size_sqm} m² • Fl {listing.floor}
                    </span>

                    <button
                      type="button"
                      title={listing.is_favorite ? "Remove from shortlist" : "Add to shortlist"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(listing.id);
                      }}
                      className={cn(
                        "ml-auto p-1 rounded-md transition-colors cursor-pointer",
                        listing.is_favorite
                          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          : "text-muted-foreground/60 hover:text-red-500 hover:bg-muted"
                      )}
                    >
                      <Star
                        className={cn(
                          "size-3.5",
                          listing.is_favorite ? "fill-red-500" : ""
                        )}
                      />
                    </button>
                  </div>

                  {/* Actions / Utilities bar */}
                  <div className="pt-1.5 border-t border-dashed flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleRouteClick(e, listing)}
                        className={cn(
                          "hover:text-primary transition-colors flex items-center gap-1 cursor-pointer text-[11px]",
                          isRouteActive && "text-blue-600 font-semibold"
                        )}
                      >
                        <Compass className="size-3" />
                        <span>{isRouteActive ? "Routing active" : "Get route"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareListing(listing.id);
                        }}
                        className={cn(
                          "hover:text-primary transition-colors flex items-center gap-1 cursor-pointer text-[11px]",
                          isComparing && "text-purple-600 font-semibold"
                        )}
                      >
                        <span>{isComparing ? "Comparing ✓" : "Compare"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditListing(listing);
                        }}
                        className="hover:text-foreground p-1 rounded hover:bg-muted text-[11px] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${listing.name}?`)) {
                            deleteListing(listing.id);
                          }
                        }}
                        className="hover:text-destructive p-1 rounded hover:bg-destructive/10 text-[11px] cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
