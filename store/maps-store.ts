import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Listing,
  CenterPoint,
  PriceHistory,
  Contract,
  ViewingLog,
  PropertyType,
  PipelineStatus,
} from "@/types/hunting";
import {
  initialListings,
  initialCenterPoints,
} from "@/mock-data/condos";

export type ViewMode = "map" | "table" | "compare";
export type SortBy =
  | "nearest"
  | "rent-asc"
  | "rent-desc"
  | "size-desc"
  | "rating"
  | "date-newest"
  | "alpha-az";
export type MapStyle = "default" | "streets" | "outdoors" | "satellite";

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export function getLatestRent(listing: Listing): number {
  if (listing.price_history && listing.price_history.length > 0) {
    return listing.price_history[listing.price_history.length - 1].rent;
  }
  return 0;
}

export function getLatestDeposit(listing: Listing): number {
  if (listing.price_history && listing.price_history.length > 0) {
    return listing.price_history[listing.price_history.length - 1].deposit;
  }
  return 0;
}

interface MapsState {
  listings: Listing[];
  centerPoints: CenterPoint[];
  activeCenterPointId: string;
  selectedCategory: string; // "all" or PropertyType
  selectedStatus: string; // "all" or PipelineStatus
  searchQuery: string;
  viewMode: ViewMode;
  sortBy: SortBy;
  selectedListingId: string | null;
  compareListingIds: string[];
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  mapStyle: MapStyle;
  userLocation: { lat: number; lng: number } | null;
  routeDestinationId: string | null;
  isPanelVisible: boolean;

  // Actions
  setSelectedCategory: (category: string) => void;
  setSelectedStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortBy) => void;
  toggleFavorite: (listingId: string) => void;
  selectListing: (listingId: string | null) => void;
  setActiveCenterPoint: (centerPointId: string) => void;
  addCenterPoint: (centerPoint: Omit<CenterPoint, "id">) => void;
  deleteCenterPoint: (centerPointId: string) => void;
  addListing: (listingData: Omit<Listing, "id" | "created_at">) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  addPriceHistory: (
    listingId: string,
    entry: Omit<PriceHistory, "id" | "listing_id" | "recorded_at"> & { recorded_at?: string }
  ) => void;
  addViewingLog: (
    listingId: string,
    log: Omit<ViewingLog, "id" | "listing_id">
  ) => void;
  updateContract: (
    listingId: string,
    contract: Omit<Contract, "id" | "listing_id">
  ) => void;
  toggleCompareListing: (listingId: string) => void;
  clearCompareListings: () => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setMapStyle: (style: MapStyle) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setRouteDestination: (listingId: string | null) => void;
  clearRoute: () => void;
  setPanelVisible: (visible: boolean) => void;

  // Selectors
  getActiveCenterPoint: () => CenterPoint | undefined;
  getDistanceToActiveCenterPoint: (listing: Listing) => number;
  getFilteredListings: () => Listing[];
  getFavoriteListings: () => Listing[];
  getRecentListings: () => Listing[];
  getAverageRating: (listing: Listing) => number;
}

export const useMapsStore = create<MapsState>()(
  persist(
    (set, get) => ({
      listings: initialListings,
      centerPoints: initialCenterPoints,
      activeCenterPointId: "cp-workplace",
      selectedCategory: "all",
      selectedStatus: "all",
      searchQuery: "",
      viewMode: "map",
      sortBy: "nearest",
      selectedListingId: null,
      compareListingIds: ["condo-1", "condo-2"],
      mapCenter: { lat: 13.745, lng: 100.54 }, // Bangkok City Center
      mapZoom: 12.5,
      mapStyle: "default",
      userLocation: null,
      routeDestinationId: null,
      isPanelVisible: true,

      setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId });
      },

      setSelectedStatus: (statusId) => {
        set({ selectedStatus: statusId });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setSortBy: (sort) => set({ sortBy: sort }),

      toggleFavorite: (listingId) =>
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === listingId ? { ...l, is_favorite: !l.is_favorite } : l
          ),
        })),

      selectListing: (listingId) => {
        const state = get();
        if (listingId) {
          const item = state.listings.find((l) => l.id === listingId);
          if (item) {
            set({
              selectedListingId: listingId,
              mapCenter: { lat: item.lat, lng: item.lng },
            });
            return;
          }
        }
        set({ selectedListingId: listingId });
      },

      setActiveCenterPoint: (centerPointId) => {
        const state = get();
        const cp = state.centerPoints.find((p) => p.id === centerPointId);
        if (cp) {
          set({
            activeCenterPointId: centerPointId,
            mapCenter: { lat: cp.lat, lng: cp.lng },
          });
        } else {
          set({ activeCenterPointId: centerPointId });
        }
      },

      addCenterPoint: (cpData) =>
        set((state) => {
          const newCp: CenterPoint = {
            ...cpData,
            id: `cp-${Date.now()}`,
          };
          return {
            centerPoints: [...state.centerPoints, newCp],
            activeCenterPointId: newCp.id,
          };
        }),

      deleteCenterPoint: (id) =>
        set((state) => {
          const remaining = state.centerPoints.filter((c) => c.id !== id);
          return {
            centerPoints: remaining,
            activeCenterPointId:
              state.activeCenterPointId === id
                ? remaining[0]?.id || ""
                : state.activeCenterPointId,
          };
        }),

      addListing: (data) =>
        set((state) => {
          const newListing: Listing = {
            ...data,
            id: `listing-${Date.now()}`,
            created_at: new Date().toISOString(),
          };
          return {
            listings: [newListing, ...state.listings],
            selectedListingId: newListing.id,
            mapCenter: { lat: newListing.lat, lng: newListing.lng },
          };
        }),

      updateListing: (id, updates) =>
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),

      deleteListing: (id) =>
        set((state) => ({
          listings: state.listings.filter((l) => l.id !== id),
          selectedListingId:
            state.selectedListingId === id ? null : state.selectedListingId,
          compareListingIds: state.compareListingIds.filter((cid) => cid !== id),
          routeDestinationId:
            state.routeDestinationId === id ? null : state.routeDestinationId,
        })),

      addPriceHistory: (listingId, entry) =>
        set((state) => {
          const newEntry: PriceHistory = {
            ...entry,
            id: `ph-${Date.now()}`,
            listing_id: listingId,
            recorded_at: entry.recorded_at || new Date().toISOString(),
          };
          return {
            listings: state.listings.map((l) => {
              if (l.id !== listingId) return l;
              return {
                ...l,
                price_history: [...l.price_history, newEntry],
              };
            }),
          };
        }),

      addViewingLog: (listingId, log) =>
        set((state) => {
          const newLog: ViewingLog = {
            ...log,
            id: `vl-${Date.now()}`,
            listing_id: listingId,
          };
          return {
            listings: state.listings.map((l) => {
              if (l.id !== listingId) return l;
              return {
                ...l,
                viewing_logs: [newLog, ...l.viewing_logs],
              };
            }),
          };
        }),

      updateContract: (listingId, contractData) =>
        set((state) => {
          const updatedContract: Contract = {
            ...contractData,
            id: `ct-${listingId}`,
            listing_id: listingId,
          };
          return {
            listings: state.listings.map((l) => {
              if (l.id !== listingId) return l;
              return {
                ...l,
                contract: updatedContract,
              };
            }),
          };
        }),

      toggleCompareListing: (listingId) =>
        set((state) => {
          const exists = state.compareListingIds.includes(listingId);
          if (exists) {
            return {
              compareListingIds: state.compareListingIds.filter(
                (id) => id !== listingId
              ),
            };
          }
          if (state.compareListingIds.length >= 4) {
            // max 4 side-by-side
            return {
              compareListingIds: [...state.compareListingIds.slice(1), listingId],
            };
          }
          return {
            compareListingIds: [...state.compareListingIds, listingId],
          };
        }),

      clearCompareListings: () => set({ compareListingIds: [] }),

      setMapCenter: (center) => set({ mapCenter: center }),

      setMapZoom: (zoom) => set({ mapZoom: zoom }),

      setMapStyle: (style) => set({ mapStyle: style }),

      setUserLocation: (location) => set({ userLocation: location }),

      setRouteDestination: (destinationId) =>
        set({ routeDestinationId: destinationId }),

      clearRoute: () => set({ routeDestinationId: null }),

      setPanelVisible: (visible) => set({ isPanelVisible: visible }),

      // Selectors
      getActiveCenterPoint: () => {
        const state = get();
        return (
          state.centerPoints.find((cp) => cp.id === state.activeCenterPointId) ||
          state.centerPoints[0]
        );
      },

      getDistanceToActiveCenterPoint: (listing: Listing) => {
        const centerPoint = get().getActiveCenterPoint();
        if (!centerPoint) return 0;
        return calculateDistance(
          centerPoint.lat,
          centerPoint.lng,
          listing.lat,
          listing.lng
        );
      },

      getAverageRating: (listing: Listing) => {
        if (!listing.viewing_logs || listing.viewing_logs.length === 0) return 0;
        const total = listing.viewing_logs.reduce((sum, log) => sum + log.rating, 0);
        return Number((total / listing.viewing_logs.length).toFixed(1));
      },

      getFilteredListings: () => {
        const state = get();
        let list = [...state.listings];

        if (state.selectedCategory !== "all") {
          list = list.filter((l) => l.type === state.selectedCategory);
        }

        if (state.selectedStatus !== "all") {
          list = list.filter((l) => l.status === state.selectedStatus);
        }

        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase();
          list = list.filter(
            (l) =>
              l.name.toLowerCase().includes(q) ||
              l.address.toLowerCase().includes(q) ||
              l.notes.toLowerCase().includes(q) ||
              l.type.toLowerCase().includes(q) ||
              l.status.toLowerCase().includes(q)
          );
        }

        const activeCp = state.getActiveCenterPoint();

        switch (state.sortBy) {
          case "nearest":
            if (activeCp) {
              list.sort((a, b) => {
                const distA = calculateDistance(
                  activeCp.lat,
                  activeCp.lng,
                  a.lat,
                  a.lng
                );
                const distB = calculateDistance(
                  activeCp.lat,
                  activeCp.lng,
                  b.lat,
                  b.lng
                );
                return distA - distB;
              });
            }
            break;
          case "rent-asc":
            list.sort((a, b) => getLatestRent(a) - getLatestRent(b));
            break;
          case "rent-desc":
            list.sort((a, b) => getLatestRent(b) - getLatestRent(a));
            break;
          case "size-desc":
            list.sort((a, b) => b.size_sqm - a.size_sqm);
            break;
          case "rating":
            list.sort((a, b) => state.getAverageRating(b) - state.getAverageRating(a));
            break;
          case "date-newest":
            list.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
            break;
          case "alpha-az":
            list.sort((a, b) => a.name.localeCompare(b.name));
            break;
        }

        return list;
      },

      getFavoriteListings: () => {
        const state = get();
        let list = state.listings.filter((l) => l.is_favorite);

        if (state.selectedCategory !== "all") {
          list = list.filter((l) => l.type === state.selectedCategory);
        }

        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase();
          list = list.filter(
            (l) =>
              l.name.toLowerCase().includes(q) ||
              l.address.toLowerCase().includes(q)
          );
        }

        return list;
      },

      getRecentListings: () => {
        const state = get();
        return [...state.listings]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 20);
      },
    }),
    {
      name: "condo-hunting-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        listings: state.listings,
        centerPoints: state.centerPoints,
        activeCenterPointId: state.activeCenterPointId,
        compareListingIds: state.compareListingIds,
        mapStyle: state.mapStyle,
      }),
    }
  )
);
