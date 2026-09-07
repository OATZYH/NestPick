"use client";

import * as React from "react";
import Link from "next/link";
import {
  Scale,
  Plus,
  X,
  Trophy,
  Check,
  MapPin,
  Target,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useMapsStore,
  formatDistance,
  getLatestRent,
  getLatestDeposit,
} from "@/store/maps-store";
import { pipelineStatuses } from "@/mock-data/condos";
import { cn } from "@/lib/utils";

export function CompareView() {
  const {
    listings,
    compareListingIds,
    toggleCompareListing,
    clearCompareListings,
    getDistanceToActiveCenterPoint,
    getActiveCenterPoint,
    selectListing,
    openCenterPointModal,
  } = useMapsStore();

  // Weighted scoring weights (sum to 100)
  const [rentWeight, setRentWeight] = React.useState(40);
  const [distanceWeight, setDistanceWeight] = React.useState(30);
  const [sizeWeight, setSizeWeight] = React.useState(15);
  const [amenityWeight, setAmenityWeight] = React.useState(15);

  const activeCenterPoint = getActiveCenterPoint();

  const comparedListings = listings.filter((l) =>
    compareListingIds.includes(l.id)
  );

  // Compute weighted scores for compared listings
  const scores = React.useMemo(() => {
    if (comparedListings.length === 0) return {};

    const rents = comparedListings.map((l) => getLatestRent(l));
    const minRent = Math.min(...rents);
    const maxRent = Math.max(...rents) || 1;

    const dists = comparedListings.map((l) => getDistanceToActiveCenterPoint(l));
    const minDist = Math.min(...dists);
    const maxDist = Math.max(...dists) || 1;

    const sizes = comparedListings.map((l) => l.size_sqm);
    const maxSize = Math.max(...sizes) || 1;
    const minSize = Math.min(...sizes);

    const result: Record<string, number> = {};

    comparedListings.forEach((listing) => {
      const rent = getLatestRent(listing);
      const dist = getDistanceToActiveCenterPoint(listing);
      const size = listing.size_sqm;

      // Rent score: lower is better (0 to 1)
      const rentScore =
        maxRent === minRent ? 1 : 1 - (rent - minRent) / (maxRent - minRent);

      // Dist score: lower is better (0 to 1)
      const distScore =
        maxDist === minDist ? 1 : 1 - (dist - minDist) / (maxDist - minDist);

      // Size score: bigger is better (0 to 1)
      const sizeScore =
        maxSize === minSize ? 1 : (size - minSize) / (maxSize - minSize);

      // Amenities score: count active amenities (out of 6)
      const activeCount = Object.values(listing.amenities || {}).filter(Boolean).length;
      const amenityScore = activeCount / 6;

      const totalWeighted =
        rentScore * (rentWeight / 100) +
        distScore * (distanceWeight / 100) +
        sizeScore * (sizeWeight / 100) +
        amenityScore * (amenityWeight / 100);

      result[listing.id] = Math.round(totalWeighted * 100);
    });

    return result;
  }, [
    comparedListings,
    getDistanceToActiveCenterPoint,
    rentWeight,
    distanceWeight,
    sizeWeight,
    amenityWeight,
  ]);

  // Find the top score listing
  const bestListingId = React.useMemo(() => {
    let topId = "";
    let topScore = -1;
    Object.entries(scores).forEach(([id, score]) => {
      if (score > topScore) {
        topScore = score;
        topId = id;
      }
    });
    return topId;
  }, [scores]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b bg-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Scale className="size-5 text-blue-600" />
            <span>Side-by-Side Comparison Matrix</span>
            <Badge variant="outline" className="text-xs">
              {comparedListings.length} Selected
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            Compare rental pricing, distance, amenities, and compute weighted match scores.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer"
            onClick={() => openCenterPointModal()}
          >
            <Target className="size-3.5 text-pink-500" />
            <span>{activeCenterPoint?.name || "Target Point"}</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1 cursor-pointer">
            <Link href="/">
              <MapPin className="size-3.5" />
              <span>Map View</span>
            </Link>
          </Button>

          {comparedListings.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              onClick={clearCompareListings}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Available Place Selector Pills */}
      <div className="px-4 py-2 border-b bg-muted/20 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="font-semibold text-muted-foreground text-[11px] whitespace-nowrap">
          Add to compare:
        </span>
        {listings.map((l) => {
          const isSelected = compareListingIds.includes(l.id);
          return (
            <button
              key={l.id}
              onClick={() => toggleCompareListing(l.id)}
              className={cn(
                "px-2.5 py-1 rounded-full border text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary font-medium"
                  : "bg-background hover:bg-muted text-foreground"
              )}
            >
              <span>{isSelected ? "✓" : "+"}</span>
              <span>{l.name}</span>
            </button>
          );
        })}
      </div>

      {/* Weighted Priority Sliders Bar */}
      <div className="px-4 py-3 border-b bg-card text-xs flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-1.5 font-semibold text-muted-foreground shrink-0">
          <Sliders className="size-4 text-blue-500" />
          <span>Priority Weights:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">Rent ({rentWeight}%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={rentWeight}
            onChange={(e) => setRentWeight(Number(e.target.value))}
            className="w-20 accent-blue-600 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">Distance ({distanceWeight}%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={distanceWeight}
            onChange={(e) => setDistanceWeight(Number(e.target.value))}
            className="w-20 accent-pink-600 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">Size ({sizeWeight}%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={sizeWeight}
            onChange={(e) => setSizeWeight(Number(e.target.value))}
            className="w-20 accent-emerald-600 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">Amenities ({amenityWeight}%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={amenityWeight}
            onChange={(e) => setAmenityWeight(Number(e.target.value))}
            className="w-20 accent-purple-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex-1 overflow-auto p-4">
        {comparedListings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Scale className="size-12 text-muted-foreground mb-3 opacity-60" />
            <h3 className="font-semibold text-base mb-1">Select listings to compare</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">
              Click the pill buttons above or the scale icon on any listing card to compare them side-by-side.
            </p>
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                listings.slice(0, 3).forEach((l) => toggleCompareListing(l.id));
              }}
            >
              Compare Top 3 Places
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {comparedListings.map((listing) => {
              const rent = getLatestRent(listing);
              const deposit = getLatestDeposit(listing);
              const distanceKm = getDistanceToActiveCenterPoint(listing);
              const statusConfig = pipelineStatuses.find((s) => s.id === listing.status);
              const score = scores[listing.id] || 0;
              const isWinner = listing.id === bestListingId && comparedListings.length > 1;

              return (
                <div
                  key={listing.id}
                  className={cn(
                    "flex flex-col rounded-xl border bg-card overflow-hidden shadow-sm relative transition-all",
                    isWinner && "ring-2 ring-amber-500 shadow-md"
                  )}
                >
                  {/* Winner Trophy Badge */}
                  {isWinner && (
                    <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Trophy className="size-3" />
                      <span>Top Match #{score}</span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => toggleCompareListing(listing.id)}
                    className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 hover:bg-background shadow text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>

                  {/* Photo Header */}
                  <div className="h-36 w-full bg-muted overflow-hidden relative">
                    {listing.photos[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <Badge variant="outline" className={`text-[10px] ${statusConfig?.badgeClass}`}>
                        {statusConfig?.name || listing.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm line-clamp-1">{listing.name}</h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{listing.address}</p>

                      {/* Score Indicator */}
                      <div className="mt-2 p-2 rounded-lg bg-muted/40 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Sparkles className="size-3 text-amber-500" />
                          <span>Match Score</span>
                        </div>
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {score}/100
                        </span>
                      </div>
                    </div>

                    {/* Cost Specs */}
                    <div className="space-y-1.5 text-xs border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          ฿{rent.toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deposit</span>
                        <span>{deposit > 0 ? `฿${deposit.toLocaleString()}` : "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size / Price per m²</span>
                        <span>
                          {listing.size_sqm} m² (฿{Math.round(rent / (listing.size_sqm || 1))}/m²)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Floor / View</span>
                        <span>Fl. {listing.floor} • {listing.view || "Standard"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance to Target</span>
                        <span className="font-medium text-pink-600 dark:text-pink-400">
                          {formatDistance(distanceKm)}
                        </span>
                      </div>
                    </div>

                    {/* Amenities Checklist */}
                    <div className="space-y-1 text-xs border-t pt-2">
                      <span className="font-semibold text-[10px] uppercase text-muted-foreground block">
                        Amenities
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {[
                          { name: "Gym", val: listing.amenities?.gym },
                          { name: "Pool", val: listing.amenities?.pool },
                          { name: "Parking", val: listing.amenities?.parking },
                          { name: "Elevator", val: listing.amenities?.elevator },
                          { name: "CCTV", val: listing.amenities?.cctv },
                          { name: "Keycard", val: listing.amenities?.keycard },
                        ].map((item) => (
                          <div
                            key={item.name}
                            className={cn(
                              "flex items-center gap-1",
                              item.val ? "text-foreground font-medium" : "text-muted-foreground/40 line-through"
                            )}
                          >
                            <span>{item.val ? "✓" : "✗"}</span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contract Details */}
                    {listing.contract && (
                      <div className="space-y-1 text-xs border-t pt-2">
                        <span className="font-semibold text-[10px] uppercase text-muted-foreground block">
                          Contract & Rules
                        </span>
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <div>Duration: {listing.contract.duration_months} months</div>
                          <div>Pets: {listing.contract.pet_allowed ? "🐾 Yes" : "No"}</div>
                          <div>Smoking: {listing.contract.smoking_allowed ? "Yes" : "No"}</div>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-1 mt-2 cursor-pointer"
                      onClick={() => selectListing(listing.id)}
                    >
                      <Link href="/">
                        <MapPin className="size-3" />
                        <span>View on Map</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
