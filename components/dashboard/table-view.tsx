"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ExternalLink,
  Phone,
  MessageCircle,
  Plus,
  Target,
  Edit2,
  Trash2,
  MapPin,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Building,
  GraduationCap,
  Home,
  Check,
  Dumbbell,
  Waves,
  Car,
  ShieldCheck,
  KeyRound,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMapsStore,
  formatDistance,
  getLatestRent,
  getLatestDeposit,
} from "@/store/maps-store";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";
import { Listing, PipelineStatus } from "@/types/hunting";
import { ListingModal } from "./listing-modal";
import { CenterPointModal } from "./center-point-modal";
import { cn } from "@/lib/utils";

export function TableView() {
  const router = useRouter();
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    getFilteredListings,
    toggleFavorite,
    deleteListing,
    updateListing,
    selectListing,
    getDistanceToActiveCenterPoint,
    getActiveCenterPoint,
  } = useMapsStore();

  const [isListingModalOpen, setIsListingModalOpen] = React.useState(false);
  const [isCenterPointModalOpen, setIsCenterPointModalOpen] = React.useState(false);
  const [editingListing, setEditingListing] = React.useState<Listing | null>(null);

  const activeCenterPoint = getActiveCenterPoint();
  const listings = getFilteredListings();

  const handleStatusChange = (listingId: string, newStatus: PipelineStatus) => {
    updateListing(listingId, { status: newStatus });
  };

  const handleOpenOnMap = (listingId: string) => {
    selectListing(listingId);
    router.push("/");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="p-4 border-b bg-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span>Spreadsheet Tracking Table</span>
            <Badge variant="outline" className="text-xs">
              {listings.length} places
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare all properties in a dense, sortable matrix view.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Target Center Point Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setIsCenterPointModalOpen(true)}
          >
            <Target className="size-3.5 text-pink-500" />
            <span className="max-w-[140px] truncate">
              {activeCenterPoint?.name || "Target Point"}
            </span>
          </Button>

          {/* Back to Map button */}
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Link href="/">
              <MapPin className="size-3.5" />
              <span>Map View</span>
            </Link>
          </Button>

          {/* Add Listing Button */}
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              setEditingListing(null);
              setIsListingModalOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            <span>New Listing</span>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-2 border-b bg-muted/20 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter by name, road, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1">
          <Button
            variant={selectedCategory === "all" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setSelectedCategory("all")}
          >
            All Types
          </Button>
          {propertyTypes.map((t) => (
            <Button
              key={t.id}
              variant={selectedCategory === t.id ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setSelectedCategory(t.id)}
            >
              {t.name}
            </Button>
          ))}
        </div>

        {/* Pipeline Status Filter */}
        <div className="flex items-center gap-1 border-l pl-3">
          <Button
            variant={selectedStatus === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setSelectedStatus("all")}
          >
            All Statuses
          </Button>
          {pipelineStatuses.slice(0, 4).map((s) => (
            <Button
              key={s.id}
              variant={selectedStatus === s.id ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setSelectedStatus(s.id)}
            >
              <span
                className="size-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          {/* Table Header */}
          <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10 border-b font-semibold text-muted-foreground text-left">
            <tr className="divide-x divide-border">
              <th className="p-2 w-10 text-center">Fav</th>
              <th className="p-2 w-14 text-center">Photo</th>
              <th className="p-2.5 min-w-44">Name & Address</th>
              <th className="p-2.5 w-24">Type</th>
              <th className="p-2.5 w-32">Status</th>
              <th className="p-2.5 w-24 text-right">Rent / Mo</th>
              <th className="p-2.5 w-24 text-right">Deposit</th>
              <th className="p-2.5 w-20 text-right">Size</th>
              <th className="p-2.5 w-16 text-center">Floor</th>
              <th className="p-2.5 w-24">Distance</th>
              <th className="p-2.5 w-32">Amenities</th>
              <th className="p-2.5 w-28">Contact</th>
              <th className="p-2.5 w-24 text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={13} className="p-12 text-center text-muted-foreground">
                  <div className="inline-flex items-center gap-2 text-xs">
                    <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading listings from database...</span>
                  </div>
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-8 text-center text-muted-foreground">
                  No listings found matching the criteria.
                </td>
              </tr>
            ) : (
              listings.map((listing, idx) => {
                const rent = getLatestRent(listing);
                const deposit = getLatestDeposit(listing);
                const distanceKm = getDistanceToActiveCenterPoint(listing);
                const statusConfig = pipelineStatuses.find((s) => s.id === listing.status);
                const typeConfig = propertyTypes.find((t) => t.id === listing.type);

                return (
                  <tr
                    key={listing.id}
                    className={cn(
                      "divide-x divide-border hover:bg-muted/30 transition-colors group",
                      idx % 2 === 1 && "bg-muted/10"
                    )}
                  >
                    {/* Favorite */}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => toggleFavorite(listing.id)}
                        className="hover:scale-125 transition-transform"
                      >
                        <Heart
                          className={cn(
                            "size-3.5 mx-auto",
                            listing.is_favorite
                              ? "fill-red-500 text-red-500"
                              : "text-muted-foreground/50 hover:text-red-400"
                          )}
                        />
                      </button>
                    </td>

                    {/* Photo */}
                    <td className="p-1 text-center">
                      <div className="size-10 rounded overflow-hidden bg-muted mx-auto">
                        {listing.photos[0] ? (
                          <img
                            src={listing.photos[0]}
                            alt={listing.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-[10px] text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & Address */}
                    <td className="p-2.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span
                          className="hover:text-primary cursor-pointer hover:underline"
                          onClick={() => handleOpenOnMap(listing.id)}
                        >
                          {listing.name}
                        </span>
                        {listing.source_url && (
                          <a
                            href={listing.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                        {listing.address}
                      </div>
                      {listing.notes && (
                        <div className="text-[10px] text-muted-foreground/80 line-clamp-1 italic mt-0.5">
                          "{listing.notes}"
                        </div>
                      )}
                    </td>

                    {/* Property Type */}
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {typeConfig?.name || listing.type}
                      </Badge>
                    </td>

                    {/* Pipeline Status with Dropdown */}
                    <td className="p-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] hover:bg-muted font-medium cursor-pointer">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: statusConfig?.color || "#94a3b8" }}
                            />
                            <span className="truncate">{statusConfig?.name || listing.status}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="text-xs">
                          {pipelineStatuses.map((st) => (
                            <DropdownMenuItem
                              key={st.id}
                              onClick={() => handleStatusChange(listing.id, st.id)}
                              className="gap-2 text-xs"
                            >
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: st.color }}
                              />
                              <span>{st.name}</span>
                              {listing.status === st.id && <Check className="size-3 ml-auto" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Rent / Mo */}
                    <td className="p-2.5 text-right font-bold text-foreground">
                      ฿{rent.toLocaleString()}
                    </td>

                    {/* Deposit */}
                    <td className="p-2.5 text-right text-muted-foreground">
                      ฿{deposit.toLocaleString()}
                    </td>

                    {/* Size */}
                    <td className="p-2.5 text-right font-medium">
                      {listing.size_sqm} m²
                    </td>

                    {/* Floor */}
                    <td className="p-2.5 text-center text-muted-foreground">
                      {listing.floor}
                    </td>

                    {/* Distance */}
                    <td className="p-2.5 font-medium text-pink-600 dark:text-pink-400">
                      {formatDistance(distanceKm)}
                    </td>

                    {/* Amenities Icons */}
                    <td className="p-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span
                          title={listing.amenities.gym ? "Gym available" : "No gym"}
                          className={listing.amenities.gym ? "text-foreground" : "opacity-20"}
                        >
                          <Dumbbell className="size-3.5" />
                        </span>
                        <span
                          title={listing.amenities.pool ? "Pool available" : "No pool"}
                          className={listing.amenities.pool ? "text-foreground" : "opacity-20"}
                        >
                          <Waves className="size-3.5" />
                        </span>
                        <span
                          title={listing.amenities.parking ? "Parking available" : "No parking"}
                          className={listing.amenities.parking ? "text-foreground" : "opacity-20"}
                        >
                          <Car className="size-3.5" />
                        </span>
                        <span
                          title={listing.amenities.cctv ? "24h CCTV" : "No CCTV"}
                          className={listing.amenities.cctv ? "text-foreground" : "opacity-20"}
                        >
                          <ShieldCheck className="size-3.5" />
                        </span>
                        <span
                          title={listing.amenities.keycard ? "Keycard Access" : "No Keycard"}
                          className={listing.amenities.keycard ? "text-foreground" : "opacity-20"}
                        >
                          <KeyRound className="size-3.5" />
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        {listing.contact_phone && (
                          <a
                            href={`tel:${listing.contact_phone}`}
                            title={listing.contact_phone}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="size-3.5" />
                          </a>
                        )}
                        {listing.contact_line && (
                          <a
                            href={`https://line.me/ti/p/~${listing.contact_line}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`LINE: ${listing.contact_line}`}
                            className="p-1 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-600"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="View on Map"
                          onClick={() => handleOpenOnMap(listing.id)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </button>
                        <button
                          title="Edit details"
                          onClick={() => {
                            setEditingListing(listing);
                            setIsListingModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete ${listing.name}?`)) {
                              deleteListing(listing.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Listing Create/Edit Modal */}
      <ListingModal
        open={isListingModalOpen}
        onOpenChange={setIsListingModalOpen}
        initialListing={editingListing}
      />

      {/* Reference Center Point Modal */}
      <CenterPointModal
        open={isCenterPointModalOpen}
        onOpenChange={setIsCenterPointModalOpen}
      />
    </div>
  );
}
