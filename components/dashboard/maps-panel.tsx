"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Compass,
  Star,
  Clock,
  ArrowUpDown,
  DollarSign,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  Phone,
  MessageCircle,
  FileText,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Eye,
  Sparkles,
  ShieldCheck,
  Target,
  Waves,
  Dumbbell,
  Car,
  KeyRound,
  Layers,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListingModal } from "./listing-modal";
import { CenterPointModal } from "./center-point-modal";
import {
  useMapsStore,
  formatDistance,
  getLatestRent,
  getLatestDeposit,
  SortBy,
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
    getSubtitle: (count: number) => `${count} places tracked`,
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
    editingListing,
    openAddListing,
    openEditListing,
    openCenterPointModal,
  } = useMapsStore();

  const activeCenterPoint = getActiveCenterPoint();

  const getListings = () => {
    switch (mode) {
      case "favorites":
        return getFavoriteListings();
      case "recents":
        return getRecentListings();
      default:
        return getFilteredListings();
    }
  };

  const listings = getListings();
  const config = MODE_CONFIG[mode];

  // Auto-scroll selected item into view
  React.useEffect(() => {
    if (!selectedListingId || !scrollContainerRef.current) return;
    const activeElement = scrollContainerRef.current.querySelector(
      `[data-listing-id="${selectedListingId}"]`
    );
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedListingId]);

  const handleGetDirections = (e: React.MouseEvent, listing: Listing) => {
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
            <p className="text-xs text-muted-foreground">
              {config.getSubtitle(listings.length)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1 px-2 cursor-pointer"
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
              className="size-7 cursor-pointer"
              onClick={() => setPanelVisible(false)}
              title="Hide panel"
            >
              <PanelLeftClose className="size-4" />
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
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => setSelectedStatus("all")}
              className={cn(
                "px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer",
                selectedStatus === "all"
                  ? "bg-foreground text-background font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All ({listings.length})
            </button>
            {pipelineStatuses.map((s) => (
              <button
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

          {listings.length === 0 ? (
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
              const statusConfig = pipelineStatuses.find((s) => s.id === listing.status);
              const typeConfig = propertyTypes.find((t) => t.id === listing.type);

              // Calculate price change if history > 1
              const priceHistory = listing.price_history || [];
              const hasPriceChange = priceHistory.length > 1;
              const priceDiff = hasPriceChange
                ? priceHistory[priceHistory.length - 1].rent - priceHistory[0].rent
                : 0;

              return (
                <div
                  key={listing.id}
                  data-listing-id={listing.id}
                  onClick={() => selectListing(listing.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer group pt-3.5 relative",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
                      : "border-border/60 hover:border-border hover:bg-muted/30"
                  )}
                >
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1",
                            statusConfig?.badgeClass || "bg-muted text-foreground"
                          )}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: statusConfig?.color || "#3b82f6" }}
                          />
                          {statusConfig?.name || listing.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          • {typeConfig?.name || listing.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-foreground truncate mt-1">
                        {listing.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {listing.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectListing(null);
                          }}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                          title="Deselect condo (Esc)"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(listing.id);
                        }}
                        className="p-1 rounded-md text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                        title={listing.is_favorite ? "Remove favorite" : "Add to favorites"}
                      >
                        <Star
                          className={cn(
                            "size-4",
                            listing.is_favorite
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/60 hover:text-amber-400"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail and quick stats grid */}
                  <div className="flex gap-2.5 mb-2.5">
                    {listing.photos && listing.photos[0] ? (
                      <div className="size-20 rounded-lg overflow-hidden shrink-0 bg-muted border relative">
                        <img
                          src={listing.photos[0]}
                          alt={listing.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {listing.photos.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded font-medium">
                            +{listing.photos.length - 1}
                          </span>
                        )}
                      </div>
                    ) : null}

                    <div className="flex-1 grid grid-cols-2 gap-1.5 text-xs">
                      <div className="p-1.5 rounded-lg bg-muted/40 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground">Rent</span>
                        <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                          ฿{rent.toLocaleString()}
                          <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-muted/40 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground">To Target</span>
                        <span className="font-semibold text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1">
                          <Target className="size-3 shrink-0" />
                          <span className="truncate">{formatDistance(distanceKm)}</span>
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-muted/30 flex items-center justify-between text-[11px] col-span-2 text-muted-foreground">
                        <span>📐 {listing.size_sqm} m²</span>
                        <span>🏢 Fl. {listing.floor}</span>
                        <span>👀 {listing.view || "Unspecified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Icons */}
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground text-[11px]">
                    {listing.amenities.gym && (
                      <span className="flex items-center gap-0.5" title="Fitness Gym">
                        <Dumbbell className="size-3 text-emerald-500" /> Gym
                      </span>
                    )}
                    {listing.amenities.pool && (
                      <span className="flex items-center gap-0.5" title="Swimming Pool">
                        <Waves className="size-3 text-blue-500" /> Pool
                      </span>
                    )}
                    {listing.amenities.parking && (
                      <span className="flex items-center gap-0.5" title="Car Parking">
                        <Car className="size-3 text-indigo-500" /> Parking
                      </span>
                    )}
                    {listing.amenities.keycard && (
                      <span className="flex items-center gap-0.5" title="Keycard Access">
                        <KeyRound className="size-3 text-amber-500" /> Keycard
                      </span>
                    )}
                  </div>

                  {/* Selected Card Deep Details Panel */}
                  {isSelected && (
                    <div
                      className="mt-3 pt-3 border-t border-border/80 space-y-3 text-xs animate-in fade-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Deep Info Tabs */}
                      <Tabs defaultValue="pricing" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 h-7 text-[10px] p-0.5">
                          <TabsTrigger value="pricing" className="text-[10px] px-1">
                            Pricing
                          </TabsTrigger>
                          <TabsTrigger value="contract" className="text-[10px] px-1">
                            Contract
                          </TabsTrigger>
                          <TabsTrigger value="viewings" className="text-[10px] px-1">
                            Logs ({listing.viewing_logs?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="notes" className="text-[10px] px-1">
                            Notes
                          </TabsTrigger>
                        </TabsList>

                        {/* Pricing Tab */}
                        <TabsContent value="pricing" className="pt-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg border bg-background">
                              <div className="text-muted-foreground">Deposit / Advance</div>
                              <div className="font-semibold">
                                ฿{deposit.toLocaleString()} / ฿
                                {listing.price_history?.[0]?.advance.toLocaleString() || 0}
                              </div>
                            </div>
                            <div className="p-2 rounded-lg border bg-background">
                              <div className="text-muted-foreground">Common Fee</div>
                              <div className="font-semibold">
                                {listing.price_history?.[0]?.common_fee
                                  ? `฿${listing.price_history[0].common_fee}/mo`
                                  : "Included"}
                              </div>
                            </div>
                            <div className="p-2 rounded-lg border bg-background">
                              <div className="text-muted-foreground">Water Billing</div>
                              <div className="font-semibold truncate">
                                {listing.price_history?.[0]?.water_rate || "Gov / Normal"}
                              </div>
                            </div>
                            <div className="p-2 rounded-lg border bg-background">
                              <div className="text-muted-foreground">Electricity Billing</div>
                              <div className="font-semibold truncate">
                                {listing.price_history?.[0]?.electric_rate || "Gov Rate"}
                              </div>
                            </div>
                          </div>

                          {/* Negotiation Price Timeline */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Price Negotiation History
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 text-[10px] px-1.5 text-primary"
                                onClick={() => setShowAddOffer(!showAddOffer)}
                              >
                                + Add Offer
                              </Button>
                            </div>

                            {showAddOffer && (
                              <form
                                onSubmit={(e) => handleAddPriceSubmit(e, listing.id)}
                                className="p-2 rounded-lg border bg-muted/40 space-y-2 mb-2"
                              >
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Offered Rent (฿)"
                                    value={newOfferRent}
                                    onChange={(e) => setNewOfferRent(e.target.value)}
                                    className="h-7 text-xs bg-background"
                                    required
                                  />
                                  <Input
                                    placeholder="Note / Condition"
                                    value={newOfferNote}
                                    onChange={(e) => setNewOfferNote(e.target.value)}
                                    className="h-7 text-xs bg-background"
                                  />
                                </div>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[11px]"
                                    onClick={() => setShowAddOffer(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" size="sm" className="h-6 text-[11px]">
                                    Save
                                  </Button>
                                </div>
                              </form>
                            )}

                            <div className="space-y-1">
                              {priceHistory.map((ph, idx) => (
                                <div
                                  key={ph.id || idx}
                                  className="flex items-center justify-between text-[11px] p-1.5 rounded-md bg-muted/20 border text-muted-foreground"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-foreground">
                                      ฿{ph.rent.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] truncate max-w-[140px]">
                                      {ph.note || "Logged rent"}
                                    </span>
                                  </div>
                                  <span className="text-[10px]">
                                    {new Date(ph.recorded_at).toLocaleDateString("en-GB", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        {/* Contract Tab */}
                        <TabsContent value="contract" className="pt-2 space-y-2">
                          {listing.contract ? (
                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                <span className="text-muted-foreground">Contract Term</span>
                                <span className="font-medium">
                                  {listing.contract.duration_months} Months
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                <span className="text-muted-foreground">Pet Policy</span>
                                <span className="font-medium capitalize">
                                  {listing.contract.pet_allowed ? "Allowed" : "Not allowed"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                <span className="text-muted-foreground">Guests</span>
                                <span className="font-medium">
                                  {listing.contract.guest_allowed ? "Allowed" : "Restricted"}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg border bg-background">
                                <span className="text-muted-foreground block mb-0.5">
                                  Deposit Refund Terms
                                </span>
                                <p className="text-foreground">
                                  {listing.contract.deposit_refund_terms || "Standard inspection terms."}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <FileText className="size-6 mx-auto mb-1 opacity-50" />
                              <p className="text-xs">No contract terms recorded yet</p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Viewing Logs Tab */}
                        <TabsContent value="viewings" className="pt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Site Visit & Field Notes
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 text-[10px] px-1.5 text-primary"
                              onClick={() => setShowAddViewing(!showAddViewing)}
                            >
                              + Log Viewing
                            </Button>
                          </div>

                          {showAddViewing && (
                            <form
                              onSubmit={(e) => handleAddViewingSubmit(e, listing.id)}
                              className="p-2 rounded-lg border bg-muted/40 space-y-2 mb-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">Rating:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setNewViewingRating(star)}
                                      className="text-amber-400 text-sm"
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea
                                placeholder="Smell, noise, afternoon heat, elevator speed, water pressure..."
                                value={newViewingNotes}
                                onChange={(e) => setNewViewingNotes(e.target.value)}
                                rows={2}
                                className="w-full text-xs p-1.5 rounded-md border bg-background"
                                required
                              />
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[11px]"
                                  onClick={() => setShowAddViewing(false)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" size="sm" className="h-6 text-[11px]">
                                  Save Log
                                </Button>
                              </div>
                            </form>
                          )}

                          {listing.viewing_logs && listing.viewing_logs.length > 0 ? (
                            <div className="space-y-1.5">
                              {listing.viewing_logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-2 rounded-lg border bg-background space-y-1"
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                                      <span>{"★".repeat(log.rating)}</span>
                                      <span className="text-muted-foreground font-normal">
                                        ({log.rating}/5)
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(log.scheduled_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-foreground leading-relaxed">
                                    {log.notes}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <Eye className="size-6 mx-auto mb-1 opacity-50" />
                              <p className="text-xs">No viewings logged yet</p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Notes & Contacts Tab */}
                        <TabsContent value="notes" className="pt-2 space-y-2">
                          {listing.notes && (
                            <div className="p-2.5 rounded-lg border bg-background text-[11px] leading-relaxed">
                              {listing.notes}
                            </div>
                          )}
                          <div className="flex flex-col gap-1 text-[11px]">
                            {listing.contact_phone && (
                              <a
                                href={`tel:${listing.contact_phone}`}
                                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted text-primary"
                              >
                                <Phone className="size-3.5" />
                                <span>{listing.contact_phone}</span>
                              </a>
                            )}
                            {listing.contact_line && (
                              <div className="flex items-center gap-2 p-1.5 rounded-md text-emerald-600 dark:text-emerald-400">
                                <MessageCircle className="size-3.5" />
                                <span>LINE: {listing.contact_line}</span>
                              </div>
                            )}
                            {listing.source_url && (
                              <a
                                href={listing.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted text-blue-600 dark:text-blue-400 truncate"
                              >
                                <ExternalLink className="size-3.5 shrink-0" />
                                <span className="truncate">View Original Source Listing</span>
                              </a>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Bottom action controls */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={() => selectListing(null)}
                          title="Deselect condo (Esc)"
                        >
                          <X className="size-3.5" />
                          <span>Close</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5 cursor-pointer"
                          onClick={() => {
                            openEditListing(listing);
                          }}
                        >
                          <Edit2 className="size-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className={cn(
                            "flex-1 h-8 text-xs gap-1.5 cursor-pointer",
                            isRouteActive ? "bg-emerald-600 hover:bg-emerald-700" : ""
                          )}
                          onClick={(e) => handleGetDirections(e, listing)}
                          disabled={isLoadingRoute}
                        >
                          <Compass className="size-3" />
                          <span>{isRouteActive ? "Clear Route" : "Directions"}</span>
                        </Button>
                        <Button
                          variant={isComparing ? "secondary" : "ghost"}
                          size="icon"
                          className={cn(
                            "size-8 shrink-0 cursor-pointer",
                            isComparing ? "border border-primary text-primary" : ""
                          )}
                          title="Compare side-by-side"
                          onClick={() => toggleCompareListing(listing.id)}
                        >
                          <Layers className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Delete listing"
                          onClick={() => deleteListing(listing.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Listing Create / Edit Modal */}
      <ListingModal
        open={isListingModalOpen}
        onOpenChange={setIsListingModalOpen}
        initialListing={editingListing}
      />

      {/* Center Reference Points Modal */}
      <CenterPointModal
        open={isCenterPointModalOpen}
        onOpenChange={setIsCenterPointModalOpen}
      />
    </>
  );
}
