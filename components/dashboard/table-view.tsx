"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Heart,
  MapPin,
  Edit2,
  Trash2,
  ExternalLink,
  Target,
  ArrowUpDown,
  Phone,
  MessageCircle,
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
          <p className="text-xs text-muted-foreground">
            Excel & Google Sheets style table for quick data entry, sorting, and status updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Target Reference Button */}
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
            All
          </Button>
          {propertyTypes.map((pt) => (
            <Button
              key={pt.id}
              variant={selectedCategory === pt.id ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2 capitalize"
              onClick={() => setSelectedCategory(pt.id)}
            >
              {pt.name}
            </Button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <Button
            variant={selectedStatus === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setSelectedStatus("all")}
          >
            All Status
          </Button>
          {pipelineStatuses.map((st) => (
            <Button
              key={st.id}
              variant={selectedStatus === st.id ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setSelectedStatus(st.id)}
            >
              <span
                className="size-1.5 rounded-full mr-1 inline-block"
                style={{ backgroundColor: st.color }}
              />
              {st.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Spreadsheet Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header */}
          <thead className="bg-muted/60 sticky top-0 z-10 border-b shadow-xs">
            <tr className="divide-x divide-border">
              <th className="p-2.5 w-10 text-center">★</th>
              <th className="p-2.5 w-16 text-center">Photo</th>
              <th className="p-2.5 min-w-[200px]">Property Name & Address</th>
              <th className="p-2.5 w-24">Type</th>
              <th className="p-2.5 w-36">Pipeline Status</th>
              <th className="p-2.5 w-28 text-right">Rent (฿/mo)</th>
              <th className="p-2.5 w-24 text-right">Deposit</th>
              <th className="p-2.5 w-20 text-right">Size</th>
              <th className="p-2.5 w-16 text-center">Floor</th>
              <th className="p-2.5 w-28">To Target</th>
              <th className="p-2.5 w-32">Amenities</th>
              <th className="p-2.5 w-28">Contact</th>
              <th className="p-2.5 w-24 text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border">
            {listings.length === 0 ? (
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
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                        {listing.address}
                      </div>
                      {listing.notes && (
                        <div className="text-[10px] text-muted-foreground italic truncate max-w-xs mt-0.5">
                          &ldquo;{listing.notes}&rdquo;
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="p-2.5">
                      <span className="capitalize font-medium text-muted-foreground">
                        {typeConfig?.name || listing.type}
                      </span>
                    </td>

                    {/* Pipeline Status (Interactive Dropdown) */}
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "w-full text-left px-2 py-1 rounded border text-[11px] font-medium flex items-center justify-between gap-1",
                              statusConfig?.badgeClass
                            )}
                          >
                            <span className="truncate">
                              {statusConfig?.name || listing.status}
                            </span>
                            <ArrowUpDown className="size-2.5 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          {pipelineStatuses.map((st) => (
                            <DropdownMenuItem
                              key={st.id}
                              onClick={() => handleStatusChange(listing.id, st.id)}
                              className="text-xs gap-2"
                            >
                              <span
                                className="size-2 rounded-full inline-block"
                                style={{ backgroundColor: st.color }}
                              />
                              <span>{st.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Rent */}
                    <td className="p-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                      ฿{rent.toLocaleString()}
                    </td>

                    {/* Deposit */}
                    <td className="p-2.5 text-right text-muted-foreground">
                      {deposit > 0 ? `฿${deposit.toLocaleString()}` : "-"}
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
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {listing.contact_phone && (
                          <a
                            href={`tel:${listing.contact_phone}`}
                            title={`Call ${listing.contact_phone}`}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="size-3.5" />
                          </a>
                        )}
                        {listing.contact_line && (
                          <a
                            href={`https://line.me/ti/p/~${listing.contact_line.replace("@", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`LINE: ${listing.contact_line}`}
                            className="p-1 rounded hover:bg-muted text-green-500 hover:text-green-600"
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
