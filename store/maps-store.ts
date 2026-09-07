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
  isLoading: boolean;

  // Interactive Map Placement & Modals
  isPickingOnMap: boolean;
  pickingTarget: "listing" | "center-point" | null;
  pendingCoordinates: { lat: number; lng: number } | null;
  isListingModalOpen: boolean;
  editingListing: Listing | null;
  isCenterPointModalOpen: boolean;

  // Data Loading & Sync
  fetchInitialData: () => Promise<void>;

  // Actions
  setSelectedCategory: (category: string) => void;
  setSelectedStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortBy) => void;
  toggleFavorite: (listingId: string) => Promise<void>;
  selectListing: (listingId: string | null) => void;
  setActiveCenterPoint: (centerPointId: string) => void;
  addCenterPoint: (centerPoint: Omit<CenterPoint, "id">) => Promise<void>;
  deleteCenterPoint: (centerPointId: string) => Promise<void>;
  addListing: (listingData: Omit<Listing, "id" | "created_at">) => Promise<void>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  addPriceHistory: (
    listingId: string,
    entry: Omit<PriceHistory, "id" | "listing_id" | "recorded_at"> & { recorded_at?: string }
  ) => Promise<void>;
  deletePriceHistory: (listingId: string, historyId: string) => Promise<void>;
  addViewingLog: (
    listingId: string,
    log: Omit<ViewingLog, "id" | "listing_id">
  ) => Promise<void>;
  updateViewingLog: (
    listingId: string,
    viewingId: string,
    updates: Partial<ViewingLog>
  ) => Promise<void>;
  deleteViewingLog: (listingId: string, viewingId: string) => Promise<void>;
  updateContract: (
    listingId: string,
    contract: Omit<Contract, "id" | "listing_id">
  ) => Promise<void>;
  deleteContract: (listingId: string) => Promise<void>;
  toggleCompareListing: (listingId: string) => void;
  clearCompareListings: () => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setMapStyle: (style: MapStyle) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setRouteDestination: (listingId: string | null) => void;
  clearRoute: () => void;
  setPanelVisible: (visible: boolean) => void;
  togglePanelVisible: () => void;

  // Modal & Map Picking Actions
  openAddListing: (coords?: { lat: number; lng: number }) => void;
  openEditListing: (listing: Listing) => void;
  closeListingModal: () => void;
  setIsListingModalOpen: (open: boolean) => void;
  openCenterPointModal: (coords?: { lat: number; lng: number }) => void;
  closeCenterPointModal: () => void;
  setIsCenterPointModalOpen: (open: boolean) => void;
  startMapPicking: (target: "listing" | "center-point") => void;
  finishMapPicking: (coords: { lat: number; lng: number }) => void;
  cancelMapPicking: () => void;
  setPendingCoordinates: (coords: { lat: number; lng: number } | null) => void;

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
      listings: [],
      centerPoints: [],
      activeCenterPointId: "",
      selectedCategory: "all",
      selectedStatus: "all",
      searchQuery: "",
      viewMode: "map",
      sortBy: "nearest",
      selectedListingId: null,
      compareListingIds: [],
      mapCenter: { lat: 13.745, lng: 100.54 }, // Bangkok City Center
      mapZoom: 12.5,
      mapStyle: "default",
      userLocation: null,
      routeDestinationId: null,
      isPanelVisible: true,
      isLoading: true,

      // Ephemeral picking & modal states
      isPickingOnMap: false,
      pickingTarget: null,
      pendingCoordinates: null,
      isListingModalOpen: false,
      editingListing: null,
      isCenterPointModalOpen: false,

      fetchInitialData: async () => {
        set({ isLoading: true });
        try {
          const [resListings, resCenterPoints] = await Promise.all([
            fetch("/api/listings"),
            fetch("/api/center-points"),
          ]);

          let listings: Listing[] = [];
          let centerPoints: CenterPoint[] = [];

          if (resListings.ok) {
            listings = await resListings.json();
          }
          if (resCenterPoints.ok) {
            centerPoints = await resCenterPoints.json();
          }

          set((state) => {
            const activeId =
              state.activeCenterPointId &&
              centerPoints.some((c) => c.id === state.activeCenterPointId)
                ? state.activeCenterPointId
                : centerPoints[0]?.id || "";

            return {
              listings,
              centerPoints,
              activeCenterPointId: activeId,
              isLoading: false,
            };
          });
        } catch (err) {
          console.error("Failed to fetch listings or center points:", err);
          set({ isLoading: false });
        }
      },

      setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId });
      },

      setSelectedStatus: (statusId) => {
        set({ selectedStatus: statusId });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setSortBy: (sort) => set({ sortBy: sort }),

      toggleFavorite: async (listingId) => {
        const listing = get().listings.find((l) => l.id === listingId);
        if (!listing) return;
        const nextFavorite = !listing.is_favorite;

        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === listingId ? { ...l, is_favorite: nextFavorite } : l
          ),
        }));

        try {
          await fetch(`/api/listings/${listingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_favorite: nextFavorite }),
          });
        } catch (e) {
          console.error("Failed to sync toggleFavorite:", e);
        }
      },

      selectListing: (listingId) => {
        const state = get();
        if (!listingId || state.selectedListingId === listingId) {
          set({ selectedListingId: null, routeDestinationId: null });
          return;
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

      addCenterPoint: async (cpData) => {
        const tempId = `cp-${Date.now()}`;
        const newCp: CenterPoint = {
          ...cpData,
          id: tempId,
        };

        set((state) => ({
          centerPoints: [...state.centerPoints, newCp],
          activeCenterPointId: newCp.id,
        }));

        try {
          const res = await fetch("/api/center-points", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCp),
          });
          if (res.ok) {
            const saved: CenterPoint = await res.json();
            set((state) => ({
              centerPoints: state.centerPoints.map((c) =>
                c.id === tempId ? saved : c
              ),
              activeCenterPointId:
                state.activeCenterPointId === tempId ? saved.id : state.activeCenterPointId,
            }));
          }
        } catch (e) {
          console.error("Failed to persist center point:", e);
        }
      },

      deleteCenterPoint: async (id) => {
        set((state) => {
          const remaining = state.centerPoints.filter((c) => c.id !== id);
          return {
            centerPoints: remaining,
            activeCenterPointId:
              state.activeCenterPointId === id
                ? remaining[0]?.id || ""
                : state.activeCenterPointId,
          };
        });

        try {
          await fetch(`/api/center-points/${id}`, { method: "DELETE" });
        } catch (e) {
          console.error("Failed to delete center point:", e);
        }
      },

      addListing: async (data) => {
        const tempId = `condo-${Date.now()}`;
        const newListing: Listing = {
          ...data,
          id: tempId,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          listings: [newListing, ...state.listings],
          selectedListingId: newListing.id,
          mapCenter: { lat: newListing.lat, lng: newListing.lng },
        }));

        try {
          const res = await fetch("/api/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newListing),
          });
          if (res.ok) {
            const saved: Listing = await res.json();
            set((state) => ({
              listings: state.listings.map((l) =>
                l.id === tempId ? saved : l
              ),
              selectedListingId:
                state.selectedListingId === tempId ? saved.id : state.selectedListingId,
            }));
          }
        } catch (e) {
          console.error("Failed to persist listing:", e);
        }
      },

      updateListing: async (id, updates) => {
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));

        try {
          const res = await fetch(`/api/listings/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          if (res.ok) {
            const saved: Listing = await res.json();
            set((state) => ({
              listings: state.listings.map((l) => (l.id === id ? saved : l)),
            }));
          }
        } catch (e) {
          console.error("Failed to update listing:", e);
        }
      },

      deleteListing: async (id) => {
        set((state) => ({
          listings: state.listings.filter((l) => l.id !== id),
          selectedListingId:
            state.selectedListingId === id ? null : state.selectedListingId,
          compareListingIds: state.compareListingIds.filter((cid) => cid !== id),
          routeDestinationId:
            state.routeDestinationId === id ? null : state.routeDestinationId,
        }));

        try {
          await fetch(`/api/listings/${id}`, { method: "DELETE" });
        } catch (e) {
          console.error("Failed to delete listing:", e);
        }
      },

      addPriceHistory: async (listingId, entry) => {
        const tempId = `ph-${Date.now()}`;
        const newEntry: PriceHistory = {
          ...entry,
          id: tempId,
          listing_id: listingId,
          recorded_at: entry.recorded_at || new Date().toISOString(),
        };

        set((state) => ({
          listings: state.listings.map((l) => {
            if (l.id !== listingId) return l;
            return {
              ...l,
              price_history: [...(l.price_history || []), newEntry],
            };
          }),
        }));

        try {
          const res = await fetch(`/api/listings/${listingId}/price-history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEntry),
          });
          if (res.ok) {
            const saved: PriceHistory = await res.json();
            set((state) => ({
              listings: state.listings.map((l) => {
                if (l.id !== listingId) return l;
                return {
                  ...l,
                  price_history: (l.price_history || []).map((p) =>
                    p.id === tempId ? saved : p
                  ),
                };
              }),
            }));
          }
        } catch (e) {
          console.error("Failed to persist price history:", e);
        }
      },

      deletePriceHistory: async (listingId, historyId) => {
        set((state) => ({
          listings: state.listings.map((l) => {
            if (l.id !== listingId) return l;
            return {
              ...l,
              price_history: (l.price_history || []).filter((p) => p.id !== historyId),
            };
          }),
        }));

        try {
          await fetch(`/api/listings/${listingId}/price-history/${historyId}`, {
            method: "DELETE",
          });
        } catch (e) {
          console.error("Failed to delete price history:", e);
        }
      },

      addViewingLog: async (listingId, log) => {
        const tempId = `vl-${Date.now()}`;
        const newLog: ViewingLog = {
          ...log,
          id: tempId,
          listing_id: listingId,
        };

        set((state) => ({
          listings: state.listings.map((l) => {
            if (l.id !== listingId) return l;
            return {
              ...l,
              viewing_logs: [...(l.viewing_logs || []), newLog],
            };
          }),
        }));

        try {
          const res = await fetch(`/api/listings/${listingId}/viewings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newLog),
          });
          if (res.ok) {
            const saved: ViewingLog = await res.json();
            set((state) => ({
              listings: state.listings.map((l) => {
                if (l.id !== listingId) return l;
                return {
                  ...l,
                  viewing_logs: (l.viewing_logs || []).map((v) =>
                    v.id === tempId ? saved : v
                  ),
                };
              }),
            }));
          }
        } catch (e) {
          console.error("Failed to persist viewing log:", e);
        }
      },

      updateViewingLog: async (listingId, viewingId, updates) => {
        set((state) => ({
          listings: state.listings.map((l) => {
            if (l.id !== listingId) return l;
            return {
              ...l,
              viewing_logs: (l.viewing_logs || []).map((v) =>
                v.id === viewingId ? { ...v, ...updates } : v
              ),
            };
          }),
        }));

        try {
          const res = await fetch(`/api/listings/${listingId}/viewings/${viewingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          if (res.ok) {
            const saved: ViewingLog = await res.json();
            set((state) => ({
              listings: state.listings.map((l) => {
                if (l.id !== listingId) return l;
                return {
                  ...l,
                  viewing_logs: (l.viewing_logs || []).map((v) =>
                    v.id === viewingId ? saved : v
                  ),
                };
              }),
            }));
          }
        } catch (e) {
          console.error("Failed to update viewing log:", e);
        }
      },

      deleteViewingLog: async (listingId, viewingId) => {
        set((state) => ({
          listings: state.listings.map((l) => {
            if (l.id !== listingId) return l;
            return {
              ...l,
              viewing_logs: (l.viewing_logs || []).filter((v) => v.id !== viewingId),
            };
          }),
        }));

        try {
          await fetch(`/api/listings/${listingId}/viewings/${viewingId}`, {
            method: "DELETE",
          });
        } catch (e) {
          console.error("Failed to delete viewing log:", e);
        }
      },

      updateContract: async (listingId, contract) => {
        const newContract: Contract = {
          ...contract,
          id: `contract-${listingId}`,
          listing_id: listingId,
        };

        set((state) => ({
          listings: state.listings.map((l) => {
            if (l.id !== listingId) return l;
            return {
              ...l,
              contract: newContract,
            };
          }),
        }));

        try {
          const res = await fetch(`/api/listings/${listingId}/contract`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newContract),
          });
          if (res.ok) {
            const saved: Contract = await res.json();
            set((state) => ({
              listings: state.listings.map((l) =>
                l.id === listingId ? { ...l, contract: saved } : l
              ),
            }));
          }
        } catch (e) {
          console.error("Failed to persist contract:", e);
        }
      },

      deleteContract: async (listingId) => {
        set((state) => ({
          listings: state.listings.map((l) => {
            if (l.id !== listingId) return l;
            return {
              ...l,
              contract: undefined,
            };
          }),
        }));

        try {
          await fetch(`/api/listings/${listingId}/contract`, {
            method: "DELETE",
          });
        } catch (e) {
          console.error("Failed to delete contract:", e);
        }
      },

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

      setRouteDestination: (listingId) => set({ routeDestinationId: listingId }),

      clearRoute: () => set({ routeDestinationId: null }),

      setPanelVisible: (visible) => set({ isPanelVisible: visible }),

      togglePanelVisible: () =>
        set((state) => ({ isPanelVisible: !state.isPanelVisible })),

      // Interactive Map Picking & Modal Actions
      openAddListing: (coords) =>
        set({
          isListingModalOpen: true,
          editingListing: null,
          pendingCoordinates: coords || null,
        }),

      openEditListing: (listing) =>
        set({
          isListingModalOpen: true,
          editingListing: listing,
          pendingCoordinates: null,
        }),

      closeListingModal: () =>
        set({
          isListingModalOpen: false,
          editingListing: null,
          pendingCoordinates: null,
        }),

      setIsListingModalOpen: (open) => {
        if (!open) {
          set({
            isListingModalOpen: false,
            editingListing: null,
            pendingCoordinates: null,
          });
        } else {
          set({ isListingModalOpen: true });
        }
      },

      openCenterPointModal: (coords) =>
        set({
          isCenterPointModalOpen: true,
          pendingCoordinates: coords || null,
        }),

      closeCenterPointModal: () =>
        set({
          isCenterPointModalOpen: false,
          pendingCoordinates: null,
        }),

      setIsCenterPointModalOpen: (open) => {
        if (!open) {
          set({
            isCenterPointModalOpen: false,
            pendingCoordinates: null,
          });
        } else {
          set({ isCenterPointModalOpen: true });
        }
      },

      startMapPicking: (target) =>
        set({
          isPickingOnMap: true,
          pickingTarget: target,
          isListingModalOpen: false,
          isCenterPointModalOpen: false,
        }),

      finishMapPicking: (coords) => {
        const state = get();
        const target = state.pickingTarget;
        set({
          isPickingOnMap: false,
          pickingTarget: null,
          pendingCoordinates: coords,
          isListingModalOpen: target === "listing",
          isCenterPointModalOpen: target === "center-point",
          mapCenter: coords,
        });
      },

      cancelMapPicking: () => {
        const state = get();
        const target = state.pickingTarget;
        set({
          isPickingOnMap: false,
          pickingTarget: null,
          isListingModalOpen: target === "listing",
          isCenterPointModalOpen: target === "center-point",
        });
      },

      setPendingCoordinates: (coords) => set({ pendingCoordinates: coords }),

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
      name: "nestpick-store-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeCenterPointId: state.activeCenterPointId,
        compareListingIds: state.compareListingIds,
        mapStyle: state.mapStyle,
      }),
    }
  )
);
