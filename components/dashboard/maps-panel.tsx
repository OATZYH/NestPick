"use client";

import * as React from "react";
import {
  MapPin,
  Heart,
  Star,
  Search,
  X,
  Route,
  Loader2,
  Navigation,
  ArrowUpDown,
  ArrowDownAZ,
  CalendarArrowDown,
  TrendingDown,
  TrendingUp,
  Maximize2,
  Check,
  Plus,
  Building2,
  Phone,
  MessageCircle,
  ExternalLink,
  Calendar,
  FileText,
  DollarSign,
  Target,
  Edit2,
  Trash2,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMapsStore, formatDistance, getLatestRent, getLatestDeposit } from "@/store/maps-store";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";
import { Listing, PipelineStatus } from "@/types/hunting";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "usehooks-ts";
import { ListingModal } from "./listing-modal";
import { CenterPointModal } from "./center-point-modal";

type PanelMode = "all" | "favorites" | "recents";

interface MapsPanelProps {
  mode?: PanelMode;
}

const panelConfig = {
  all: {
    title: "NestPick",
    emptyIcon: Building2,
    emptyTitle: "No listings found",
    emptyDescription: "Try adjusting your search or filters, or add a new place.",
    getSubtitle: (count: number) => `${count} tracked place${count !== 1 ? "s" : ""}`,
  },
  favorites: {
    title: "Starred Condos",
    emptyIcon: Heart,
    emptyTitle: "No favorites saved",
    emptyDescription: "Click the heart icon on any listing to save it to your favorites.",
    getSubtitle: (count: number) => `${count} favorite${count !== 1 ? "s" : ""}`,
  },
  recents: {
    title: "Recently Added",
    emptyIcon: Calendar,
    emptyTitle: "No recent listings",
    emptyDescription: null,
    getSubtitle: (count: number) => `Latest ${count} places`,
  },
};

export function MapsPanel({ mode = "all" }: MapsPanelProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isLoadingRoute, setIsLoadingRoute] = React.useState(false);
  const [isListingModalOpen, setIsListingModalOpen] = React.useState(false);
  const [isCenterPointModalOpen, setIsCenterPointModalOpen] = React.useState(false);
  const [editingListing, setEditingListing] = React.useState<Listing | null>(null);

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
  } = useMapsStore();

  const isDesktop = useMediaQuery("(min-width: 640px)");

  React.useEffect(() => {
    if (isDesktop && !isPanelVisible) {
      setPanelVisible(true);
    }
  }, [isDesktop, isPanelVisible, setPanelVisible]);

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

  const rawListings = getListings();
  const listings = React.useMemo(() => {
    if (!selectedListingId) return rawListings;
    const selected = rawListings.find((l) => l.id === selectedListingId);
    if (!selected) return rawListings;
    return [selected, ...rawListings.filter((l) => l.id !== selectedListingId)];
  }, [rawListings, selectedListingId]);

  const config = panelConfig[mode];
  const EmptyIcon = config.emptyIcon;

  React.useEffect(() => {
    if (selectedListingId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedListingId]);

  const handleListingClick = (listing: Listing) => {
    if (selectedListingId === listing.id) {
      selectListing(null);
    } else {
      selectListing(listing.id);
      setShowAddOffer(false);
      setShowAddViewing(false);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectListing(null);
    clearRoute();
  };

  const handleGetDirections = (e: React.MouseEvent, listing: Listing) => {
    e.stopPropagation();
    if (routeDestinationId === listing.id) {
      clearRoute();
      return;
    }
    setIsLoadingRoute(true);
    setRouteDestination(listing.id);
    setTimeout(() => {
      setIsLoadingRoute(false);
    }, 1000);
  };

  const handleAddOfferSubmit = (listingId: string) => {
    if (!newOfferRent) return;
    const rentNum = Number(newOfferRent);
    addPriceHistory(listingId, {
      rent: rentNum,
      deposit: rentNum * 2,
      advance: rentNum,
      common_fee: 0,
      parking_fee: 0,
      internet_fee: 0,
      water_type: "metered",
      water_rate: "18 ฿/unit",
      electric_type: "government",
      electric_rate: "MEA Official Rate",
      note: newOfferNote || "Negotiated counter-offer",
    });
    setNewOfferRent("");
    setNewOfferNote("");
    setShowAddOffer(false);
  };

  const handleAddViewingSubmit = (listingId: string) => {
    if (!newViewingNotes.trim()) return;
    addViewingLog(listingId, {
      scheduled_at: new Date().toISOString(),
      notes: newViewingNotes,
      rating: newViewingRating,
      completed: true,
    });
    setNewViewingNotes("");
    setShowAddViewing(false);
  };

  if (!isPanelVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-4 z-20 sm:hidden size-10 bg-background! shadow-xl"
        onClick={() => setPanelVisible(true)}
      >
        <Building2 className="size-5" />
      </Button>
    );
  }

  return (
    <>
      <div className="absolute left-4 top-4 bottom-4 z-20 flex flex-col bg-background rounded-xl shadow-xl border overflow-hidden w-84 sm:w-[420px]">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
              {config.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {config.getSubtitle(listings.length)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => {
                setEditingListing(null);
                setIsListingModalOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              <span>Add</span>
            </Button>
            <SidebarTrigger className="size-7" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:hidden"
              onClick={() => setPanelVisible(false)}
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
              onClick={() => setIsCenterPointModalOpen(true)}
              className="font-medium text-foreground hover:underline truncate max-w-[190px]"
            >
              {activeCenterPoint?.name || "Set Reference Point"}
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2 text-primary"
            onClick={() => setIsCenterPointModalOpen(true)}
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
                placeholder="Search condos, BTS, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-8 h-8 text-xs", searchQuery && "pr-8")}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8 shrink-0">
                  <ArrowUpDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setSortBy("nearest")} className="gap-2 text-xs">
                  <Navigation className="size-3.5 text-pink-500" />
                  <span className="flex-1">Nearest to Target</span>
                  {sortBy === "nearest" && <Check className="size-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rent-asc")} className="gap-2 text-xs">
                  <TrendingDown className="size-3.5 text-emerald-500" />
                  <span className="flex-1">Rent: Low to High</span>
                  {sortBy === "rent-asc" && <Check className="size-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rent-desc")} className="gap-2 text-xs">
                  <TrendingUp className="size-3.5 text-amber-500" />
                  <span className="flex-1">Rent: High to Low</span>
                  {sortBy === "rent-desc" && <Check className="size-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("size-desc")} className="gap-2 text-xs">
                  <Maximize2 className="size-3.5 text-blue-500" />
                  <span className="flex-1">Room Size: Largest</span>
                  {sortBy === "size-desc" && <Check className="size-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rating")} className="gap-2 text-xs">
                  <Star className="size-3.5 text-yellow-500" />
                  <span className="flex-1">Best Inspection Rating</span>
                  {sortBy === "rating" && <Check className="size-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date-newest")} className="gap-2 text-xs">
                  <CalendarArrowDown className="size-3.5" />
                  <span className="flex-1">Newest Added</span>
                  {sortBy === "date-newest" && <Check className="size-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("alpha-az")} className="gap-2 text-xs">
                  <ArrowDownAZ className="size-3.5" />
                  <span className="flex-1">Name A to Z</span>
                  {sortBy === "alpha-az" && <Check className="size-3.5" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick Pipeline Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                selectedStatus === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All Statuses
            </button>
            {pipelineStatuses.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                  selectedStatus === st.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Scroll Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <EmptyIcon className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{config.emptyTitle}</p>
              {config.emptyDescription && (
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {config.emptyDescription}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-4 text-xs gap-1.5"
                onClick={() => {
                  setEditingListing(null);
                  setIsListingModalOpen(true);
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
              const isRouteActive = routeDestinationId === listing.id;
              const isCompared = compareListingIds.includes(listing.id);
              const statusConfig = pipelineStatuses.find((s) => s.id === listing.status);
              const typeConfig = propertyTypes.find((t) => t.id === listing.type);

              // Selected detailed view
              if (isSelected) {
                return (
                  <div
                    key={listing.id}
                    className="flex flex-col rounded-xl border-2 border-primary bg-card overflow-hidden shadow-md"
                  >
                    {/* Photos Carousel / Main Image */}
                    {listing.photos.length > 0 && (
                      <div className="relative w-full h-44 bg-muted overflow-hidden">
                        <img
                          src={listing.photos[0]}
                          alt={listing.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 rounded-full bg-background/80 backdrop-blur-xs shadow"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(listing.id);
                            }}
                          >
                            <Heart
                              className={cn(
                                "size-3.5",
                                listing.is_favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                              )}
                            />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 rounded-full bg-background/80 backdrop-blur-xs shadow"
                            onClick={handleClose}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] ${statusConfig?.badgeClass}`}>
                            {statusConfig?.name || listing.status}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {typeConfig?.name || listing.type}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 space-y-3">
                      {/* Title & Price Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base leading-snug">{listing.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{listing.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                            ฿{rent.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                          </div>
                          {deposit > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              Dep: ฿{deposit.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y text-xs text-center">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">Size</span>
                          <span className="font-semibold">{listing.size_sqm} m²</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">Floor</span>
                          <span className="font-semibold">Fl. {listing.floor}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">To Target</span>
                          <span className="font-semibold text-pink-600 dark:text-pink-400">
                            {formatDistance(distanceKm)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Contacts */}
                      <div className="flex items-center gap-1.5">
                        {listing.contact_phone && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1 gap-1"
                          >
                            <a href={`tel:${listing.contact_phone}`}>
                              <Phone className="size-3" />
                              <span>{listing.contact_phone}</span>
                            </a>
                          </Button>
                        )}
                        {listing.contact_line && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1 gap-1"
                          >
                            <a
                              href={`https://line.me/ti/p/~${listing.contact_line.replace("@", "")}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="size-3 text-green-500" />
                              <span>LINE</span>
                            </a>
                          </Button>
                        )}
                        {listing.source_url && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                          >
                            <a href={listing.source_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="size-3.5 text-muted-foreground" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Tabbed Specs: Overview, Price History, Contract, Viewing Logs */}
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full grid grid-cols-4 h-8 p-0.5">
                          <TabsTrigger value="overview" className="text-[11px] px-1 py-1">
                            Specs
                          </TabsTrigger>
                          <TabsTrigger value="prices" className="text-[11px] px-1 py-1">
                            Pricing ({listing.price_history.length})
                          </TabsTrigger>
                          <TabsTrigger value="contract" className="text-[11px] px-1 py-1">
                            Contract
                          </TabsTrigger>
                          <TabsTrigger value="viewings" className="text-[11px] px-1 py-1">
                            Visits ({listing.viewing_logs.length})
                          </TabsTrigger>
                        </TabsList>

                        {/* Specs & Amenities Content */}
                        <TabsContent value="overview" className="space-y-2.5 pt-2 text-xs">
                          {listing.notes && (
                            <div className="bg-muted/40 p-2 rounded-lg text-xs">
                              <span className="font-semibold block text-[10px] uppercase text-muted-foreground mb-0.5">
                                Notes & Pros/Cons
                              </span>
                              <p className="text-muted-foreground">{listing.notes}</p>
                            </div>
                          )}

                          <div>
                            <span className="font-semibold block text-[10px] uppercase text-muted-foreground mb-1">
                              Amenities
                            </span>
                            <div className="grid grid-cols-3 gap-1 text-[11px]">
                              {Object.entries(listing.amenities).map(([key, val]) => (
                                <div
                                  key={key}
                                  className={`flex items-center gap-1 p-1 rounded ${
                                    val ? "text-foreground font-medium" : "text-muted-foreground/40 line-through"
                                  }`}
                                >
                                  <span>{val ? "✓" : "✗"}</span>
                                  <span className="capitalize">{key}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-[11px] text-muted-foreground">
                            <span>View: {listing.view || "Standard"}</span>
                          </div>
                        </TabsContent>

                        {/* Price History Log Content */}
                        <TabsContent value="prices" className="space-y-2 pt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[11px] text-muted-foreground">
                              Price Negotiation Log
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2 gap-1"
                              onClick={() => setShowAddOffer(!showAddOffer)}
                            >
                              <Plus className="size-3" />
                              Offer
                            </Button>
                          </div>

                          {showAddOffer && (
                            <div className="p-2 border rounded-lg bg-muted/40 space-y-1.5">
                              <Input
                                placeholder="New Offer Rent (฿)"
                                type="number"
                                className="h-7 text-xs"
                                value={newOfferRent}
                                onChange={(e) => setNewOfferRent(e.target.value)}
                              />
                              <Input
                                placeholder="Note (e.g. Counter offer, 1yr agreement)"
                                className="h-7 text-xs"
                                value={newOfferNote}
                                onChange={(e) => setNewOfferNote(e.target.value)}
                              />
                              <div className="flex justify-end gap-1 pt-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={() => setShowAddOffer(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => handleAddOfferSubmit(listing.id)}
                                >
                                  Save Offer
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {listing.price_history.map((ph, idx) => (
                              <div
                                key={ph.id || idx}
                                className="p-2 rounded-lg border bg-card text-xs flex items-start justify-between"
                              >
                                <div>
                                  <div className="font-bold text-blue-600 dark:text-blue-400">
                                    ฿{ph.rent.toLocaleString()}/mo
                                  </div>
                                  {ph.note && (
                                    <div className="text-muted-foreground text-[11px]">{ph.note}</div>
                                  )}
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(ph.recorded_at).toLocaleDateString()} • Water: {ph.water_rate} • Elec: {ph.electric_rate}
                                  </div>
                                </div>
                                {idx === listing.price_history.length - 1 && (
                                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                                    Current
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        {/* Contract Content */}
                        <TabsContent value="contract" className="space-y-2 pt-2 text-xs">
                          {listing.contract ? (
                            <div className="space-y-2 p-2 rounded-lg border bg-muted/20">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block">Duration</span>
                                  <span className="font-medium">{listing.contract.duration_months} Months</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block">Dates</span>
                                  <span className="font-medium">
                                    {listing.contract.start_date} ~ {listing.contract.end_date}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                <Badge variant={listing.contract.pet_allowed ? "default" : "outline"} className="text-[10px]">
                                  {listing.contract.pet_allowed ? "🐾 Pets Allowed" : "No Pets"}
                                </Badge>
                                <Badge variant={listing.contract.smoking_allowed ? "default" : "outline"} className="text-[10px]">
                                  {listing.contract.smoking_allowed ? "Smoking Allowed" : "No Smoking"}
                                </Badge>
                                <Badge variant={listing.contract.guest_allowed ? "default" : "outline"} className="text-[10px]">
                                  {listing.contract.guest_allowed ? "Guests Allowed" : "No Overnight Guests"}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                <strong className="text-foreground">Deposit Refund: </strong>
                                {listing.contract.deposit_refund_terms}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                <strong className="text-foreground">Termination: </strong>
                                {listing.contract.early_termination_penalty}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              No contract signed yet. Advance to negotiating/decided stage to record lease agreement.
                            </div>
                          )}
                        </TabsContent>

                        {/* Viewing Logs Content */}
                        <TabsContent value="viewings" className="space-y-2 pt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[11px] text-muted-foreground">
                              Visit Inspection Logs
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2 gap-1"
                              onClick={() => setShowAddViewing(!showAddViewing)}
                            >
                              <Plus className="size-3" />
                              Log Visit
                            </Button>
                          </div>

                          {showAddViewing && (
                            <div className="p-2 border rounded-lg bg-muted/40 space-y-1.5">
                              <textarea
                                rows={2}
                                placeholder="Viewing notes (noise, water pressure, sun, smell...)"
                                className="w-full text-xs rounded border bg-background p-1.5"
                                value={newViewingNotes}
                                onChange={(e) => setNewViewingNotes(e.target.value)}
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs">
                                  <span>Rating:</span>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setNewViewingRating(star)}
                                      className="text-yellow-400 hover:scale-125 transition-transform"
                                    >
                                      {star <= newViewingRating ? "★" : "☆"}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => setShowAddViewing(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => handleAddViewingSubmit(listing.id)}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {listing.viewing_logs.length === 0 ? (
                            <div className="text-center py-3 text-muted-foreground text-xs">
                              No visits logged yet. Schedule viewing and write down remarks!
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {listing.viewing_logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-2 rounded-lg border bg-card text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(log.scheduled_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center text-yellow-500 font-bold text-xs">
                                      {"★".repeat(Math.floor(log.rating))}
                                      <span className="text-muted-foreground font-normal ml-1">
                                        ({log.rating})
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-foreground">{log.notes}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      {/* Bottom action controls */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={() => {
                            setEditingListing(listing);
                            setIsListingModalOpen(true);
                          }}
                        >
                          <Edit2 className="size-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className={cn(
                            "flex-1 h-8 text-xs gap-1.5",
                            isRouteActive ? "bg-emerald-600 hover:bg-emerald-700" : ""
                          )}
                          onClick={(e) => handleGetDirections(e, listing)}
                          disabled={isLoadingRoute}
                        >
                          {isLoadingRoute ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Route className="size-3" />
                          )}
                          {isRouteActive ? "Clear Route" : "Directions"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${listing.name}?`)) {
                              deleteListing(listing.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Normal compact card view
              return (
                <div
                  key={listing.id}
                  className={cn(
                    "group flex flex-col gap-2 rounded-xl border p-3 cursor-pointer transition-all duration-150 hover:bg-accent/40",
                    isRouteActive && "border-emerald-500 bg-emerald-500/10",
                    isCompared && "ring-1 ring-blue-500"
                  )}
                  onClick={() => handleListingClick(listing)}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="relative size-14 rounded-lg bg-muted overflow-hidden shrink-0">
                      {listing.photos[0] ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Building2 className="w-full h-full p-3 text-muted-foreground" />
                      )}
                    </div>

                    {/* Main Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{listing.name}</h3>
                        <span className="font-bold text-xs text-blue-600 dark:text-blue-400 shrink-0">
                          ฿{rent.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mb-1">
                        {listing.address}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{listing.size_sqm} m²</span>
                        <span>•</span>
                        <span>Fl. {listing.floor}</span>
                        <span>•</span>
                        <span className="text-pink-600 dark:text-pink-400 font-medium">
                          {formatDistance(distanceKm)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges and actions row */}
                  <div className="flex items-center justify-between border-t pt-2 mt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] py-0 h-5 ${statusConfig?.badgeClass}`}>
                        {statusConfig?.name || listing.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {typeConfig?.name || listing.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Compare toggle */}
                      <Button
                        variant={isCompared ? "default" : "ghost"}
                        size="icon"
                        className="size-6 text-xs"
                        title={isCompared ? "Remove from comparison" : "Add to comparison"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareListing(listing.id);
                        }}
                      >
                        <Scale className="size-3" />
                      </Button>

                      {/* Favorite toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(listing.id);
                        }}
                      >
                        <Heart
                          className={cn(
                            "size-3",
                            listing.is_favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          )}
                        />
                      </Button>

                      {/* Direction route */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-6",
                          isRouteActive && "text-emerald-500"
                        )}
                        onClick={(e) => handleGetDirections(e, listing)}
                      >
                        <Route className="size-3" />
                      </Button>
                    </div>
                  </div>
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
