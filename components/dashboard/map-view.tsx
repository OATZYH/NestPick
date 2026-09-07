"use client";

import * as React from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useMapsStore, formatDistance, calculateDistance, getLatestRent } from "@/store/maps-store";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";
import { isValidCoordinates } from "@/lib/utils";

// High-resolution satellite style with overlay road networks and boundaries/labels (100% free, no API key required)
const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
    "esri-transportation": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    "esri-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: "esri-transportation-layer",
      type: "raster",
      source: "esri-transportation",
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: "esri-labels-layer",
      type: "raster",
      source: "esri-labels",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// Detailed topographic / outdoors style with terrain shading and contours (100% free, no API key required)
const OUTDOORS_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-topo": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, HERE, Garmin, Intermap, USGS, METI/NASA, EPA",
    },
  },
  layers: [
    {
      id: "esri-topo-layer",
      type: "raster",
      source: "esri-topo",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const MAP_STYLES: Record<string, string | StyleSpecification> = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  outdoors: OUTDOORS_STYLE,
  satellite: SATELLITE_STYLE,
};

export function MapView() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<Map<string, maplibregl.Marker>>(new Map());
  const centerPointMarkersRef = React.useRef<Map<string, maplibregl.Marker>>(new Map());
  const tempPinMarkerRef = React.useRef<maplibregl.Marker | null>(null);
  const userLocationMarkerRef = React.useRef<maplibregl.Marker | null>(null);
  const popupRef = React.useRef<maplibregl.Popup | null>(null);
  const clickActionPopupRef = React.useRef<maplibregl.Popup | null>(null);
  const isAnimatingRef = React.useRef(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isHoveringPopupRef = React.useRef(false);
  const userClickedMarkerRef = React.useRef(false);
  const lastCenterRef = React.useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const lastZoomRef = React.useRef<number>(12);
  const routeDataRef = React.useRef<{
    coordinates: [number, number][];
    bounds: maplibregl.LngLatBounds;
  } | null>(null);
  const { resolvedTheme } = useTheme();

  const {
    mapCenter,
    mapZoom,
    mapStyle,
    setMapCenter,
    setMapZoom,
    selectListing,
    selectedListingId,
    centerPoints,
    activeCenterPointId,
    routeDestinationId,
    getFilteredListings,
    listings: allListings,
    selectedCategory,
    selectedStatus,
    searchQuery,
    sortBy,
    isPickingOnMap,
    pickingTarget,
    pendingCoordinates,
    openAddListing,
    openCenterPointModal,
    finishMapPicking,
    cancelMapPicking,
    userLocation,
  } = useMapsStore();

  const isPickingOnMapRef = React.useRef(isPickingOnMap);
  React.useEffect(() => {
    isPickingOnMapRef.current = isPickingOnMap;
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = isPickingOnMap ? "crosshair" : "";
    }
  }, [isPickingOnMap]);

  // Keyboard shortcut to cancel picking on map or deselect listing
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPickingOnMapRef.current) {
          cancelMapPicking();
        } else if (useMapsStore.getState().selectedListingId) {
          useMapsStore.getState().selectListing(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cancelMapPicking]);

  const activeCenterPoint = centerPoints.find((cp) => cp.id === activeCenterPointId) || centerPoints[0];

  const getMapStyle = React.useCallback((): string | StyleSpecification => {
    if (mapStyle === "default") {
      return resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
    }
    return MAP_STYLES[mapStyle] || MAP_STYLES.light;
  }, [mapStyle, resolvedTheme]);

  const listings = React.useMemo(() => {
    return getFilteredListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allListings, selectedCategory, selectedStatus, searchQuery, sortBy, activeCenterPointId]);

  const closePopup = React.useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringPopupRef.current && popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    }, 150);
  }, []);

  // Route drawing function
  const drawRoute = React.useCallback(
    (map: maplibregl.Map, coordinates: [number, number][]) => {
      const clearRouteLayers = () => {
        if (map.getLayer("route-line")) map.removeLayer("route-line");
        if (map.getLayer("route-line-outline")) map.removeLayer("route-line-outline");
        if (map.getSource("route")) map.removeSource("route");
      };

      clearRouteLayers();

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      });

      map.addLayer({
        id: "route-line-outline",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1d4ed8",
          "line-width": 8,
          "line-opacity": 0.3,
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 1,
        },
      });
    },
    []
  );

  // Initialize Map
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    lastCenterRef.current = { lat: mapCenter.lat, lng: mapCenter.lng };
    lastZoomRef.current = mapZoom;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(),
      center: [mapCenter.lng, mapCenter.lat],
      zoom: mapZoom,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("moveend", () => {
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        return;
      }
      const center = map.getCenter();
      const zoom = map.getZoom();
      setMapCenter({ lat: center.lat, lng: center.lng });
      setMapZoom(zoom);
    });

    // Map Click Listener (Option A: Picking on Map; Option B: Quick Action Menu; Option C: Deselect active listing)
    map.on("click", (e) => {
      const originalTarget = e.originalEvent?.target as HTMLElement | null;
      if (
        originalTarget &&
        (originalTarget.closest(".listing-marker-container") ||
          originalTarget.closest(".center-point-marker") ||
          originalTarget.closest(".user-location-marker") ||
          originalTarget.closest(".maplibregl-popup-content") ||
          originalTarget.closest(".maplibregl-ctrl"))
      ) {
        return;
      }

      const clickedLngLat = e.lngLat;
      const lat = Number(clickedLngLat.lat.toFixed(6));
      const lng = Number(clickedLngLat.lng.toFixed(6));

      // Case 1: Active "Pick on Map" mode
      if (isPickingOnMapRef.current) {
        finishMapPicking({ lat, lng });
        return;
      }

      // Case 2: Deselect currently selected listing if one is active
      const currentSelectedId = useMapsStore.getState().selectedListingId;
      if (currentSelectedId) {
        useMapsStore.getState().selectListing(null);
        if (clickActionPopupRef.current) {
          clickActionPopupRef.current.remove();
          clickActionPopupRef.current = null;
        }
        return;
      }

      // Case 3: Normal map click -> Show quick action popup
      if (clickActionPopupRef.current) {
        clickActionPopupRef.current.remove();
        clickActionPopupRef.current = null;
      }

      const popupDiv = document.createElement("div");
      popupDiv.className = "p-3 space-y-2.5 min-w-[210px] text-xs select-none";
      popupDiv.innerHTML = `
        <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-border/80">
          <span class="font-semibold text-foreground flex items-center gap-1">
            <span>📍</span>
            <span>Picked Location</span>
          </span>
          <span class="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
            ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </span>
        </div>
        <div class="flex flex-col gap-1.5 pt-0.5">
          <button id="map-action-add-listing" class="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95">
            <span>➕</span>
            <span>Add Listing Here</span>
          </button>
          <button id="map-action-add-center" class="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all border border-border cursor-pointer active:scale-95">
            <span>🎯</span>
            <span>Set Reference Point</span>
          </button>
        </div>
      `;

      popupDiv.querySelector("#map-action-add-listing")?.addEventListener("click", () => {
        clickActionPopupRef.current?.remove();
        clickActionPopupRef.current = null;
        openAddListing({ lat, lng });
      });

      popupDiv.querySelector("#map-action-add-center")?.addEventListener("click", () => {
        clickActionPopupRef.current?.remove();
        clickActionPopupRef.current = null;
        openCenterPointModal({ lat, lng });
      });

      const actionPopup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: "click-action-map-popup",
        maxWidth: "280px",
      })
        .setLngLat([lng, lat])
        .setDOMContent(popupDiv)
        .addTo(map);

      clickActionPopupRef.current = actionPopup;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map style when theme or mapStyle changes
  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(getMapStyle());
  }, [getMapStyle]);

  // Style reload re-draw routes
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleStyleLoad = () => {
      if (routeDataRef.current && routeDestinationId) {
        drawRoute(map, routeDataRef.current.coordinates);
      }
    };

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [drawRoute, routeDestinationId]);

  // Fetch route between active Center Point and destination listing
  React.useEffect(() => {
    if (!routeDestinationId || !activeCenterPoint) {
      routeDataRef.current = null;
      return;
    }

    const destination = allListings.find((l) => l.id === routeDestinationId);
    if (!destination) {
      routeDataRef.current = null;
      return;
    }

    const fetchRoute = async () => {
      const start = `${activeCenterPoint.lng},${activeCenterPoint.lat}`;
      const end = `${destination.lng},${destination.lat}`;

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const coordinates = data.routes[0].geometry.coordinates as [number, number][];
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([activeCenterPoint.lng, activeCenterPoint.lat]);
          bounds.extend([destination.lng, destination.lat]);
          coordinates.forEach((coord) => bounds.extend(coord));

          routeDataRef.current = { coordinates, bounds };

          const map = mapRef.current;
          if (map) {
            drawRoute(map, coordinates);
            isAnimatingRef.current = true;
            map.fitBounds(bounds, { padding: 80 });
          }
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
      }
    };

    fetchRoute();
  }, [routeDestinationId, activeCenterPoint, allListings, drawRoute]);

  // Route cleanup when destination cleared
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clearRouteLayers = () => {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getLayer("route-line-outline")) map.removeLayer("route-line-outline");
      if (map.getSource("route")) map.removeSource("route");
    };

    if (!routeDestinationId) {
      clearRouteLayers();
    }
  }, [routeDestinationId]);

  // Render User Location Beacon Marker
  React.useEffect(() => {
    if (!mapRef.current) return;

    if (!userLocation || !isValidCoordinates(userLocation.lat, userLocation.lng)) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      return;
    }

    if (!userLocationMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "user-location-marker relative flex items-center justify-center cursor-pointer";
      el.innerHTML = `
        <span class="absolute size-8 rounded-full bg-blue-500/25 animate-ping"></span>
        <span class="absolute size-5 rounded-full bg-blue-500/40 animate-pulse"></span>
        <span class="size-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md relative z-10"></span>
      `;

      const userPopup = new maplibregl.Popup({ offset: [0, -10], closeButton: false })
        .setHTML(`<div class="text-[11px] font-semibold px-1 py-0.5 text-center">📍 Your Current Location</div>`);

      userLocationMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(userPopup)
        .addTo(mapRef.current);
    } else {
      userLocationMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }

    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
    };
  }, [userLocation]);

  // Temporary Marker while picking or adding
  React.useEffect(() => {
    if (!mapRef.current) return;

    if (tempPinMarkerRef.current) {
      tempPinMarkerRef.current.remove();
      tempPinMarkerRef.current = null;
    }

    if (pendingCoordinates) {
      const el = document.createElement("div");
      el.className = "temp-marker-root select-none cursor-pointer";
      el.innerHTML = `
        <div class="relative flex flex-col items-center animate-bounce">
          <div class="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl border-2 border-background ring-4 ring-primary/20">
            <span class="text-base">${pickingTarget === "center-point" ? "🎯" : "📍"}</span>
          </div>
          <div class="size-2 bg-primary rotate-45 -mt-1 shadow-sm"></div>
        </div>
      `;

      tempPinMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([pendingCoordinates.lng, pendingCoordinates.lat])
        .addTo(mapRef.current);
    }

    return () => {
      if (tempPinMarkerRef.current) {
        tempPinMarkerRef.current.remove();
        tempPinMarkerRef.current = null;
      }
    };
  }, [pendingCoordinates, pickingTarget]);

  // Render Center Point Markers (Workplace, target hubs)
  React.useEffect(() => {
    if (!mapRef.current) return;

    centerPointMarkersRef.current.forEach((marker) => marker.remove());
    centerPointMarkersRef.current.clear();

    centerPoints.forEach((cp) => {
      const isActive = cp.id === activeCenterPointId;
      const el = document.createElement("div");
      el.className = "center-point-marker relative group cursor-pointer transition-transform duration-200 hover:scale-110";

      // Keep animation inside inner wrapper to avoid coordinate jumps
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${
            isActive
              ? '<span class="absolute -inset-1 rounded-full bg-pink-500/30 animate-ping"></span>'
              : ""
          }
          <div
            class="size-8 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white transition-all ${
              isActive
                ? "bg-pink-600 text-white ring-2 ring-pink-400"
                : "bg-background text-foreground hover:bg-muted"
            }"
          >
            ${cp.icon || "🎯"}
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: [0, -20], closeButton: false })
        .setHTML(`
          <div class="text-xs font-semibold px-1 py-0.5 text-center">
            ${cp.name}
            ${isActive ? ' <span class="text-pink-500 font-bold">(Target)</span>' : ""}
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cp.lng, cp.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      centerPointMarkersRef.current.set(cp.id, marker);
    });

    return () => {
      centerPointMarkersRef.current.forEach((marker) => marker.remove());
      centerPointMarkersRef.current.clear();
    };
  }, [centerPoints, activeCenterPointId]);

  // Update condo markers on listings change (Preserves markers in memory, avoids DOM re-creation flickering)
  React.useEffect(() => {
    if (!mapRef.current) return;

    const currentListingIds = new Set(listings.map((l) => l.id));

    // Remove markers that no longer exist in the filtered listings
    markersRef.current.forEach((marker, id) => {
      if (!currentListingIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Create or update markers
    listings.forEach((listing) => {
      let marker = markersRef.current.get(listing.id);

      if (marker) {
        // Just update coordinates if needed
        marker.setLngLat([listing.lng, listing.lat]);
        return;
      }

      const rent = getLatestRent(listing);
      const distanceKm = activeCenterPoint
        ? calculateDistance(listing.lat, listing.lng, activeCenterPoint.lat, activeCenterPoint.lng)
        : 0;

      const typeConfig = propertyTypes.find((t) => t.id === listing.type);
      const statusConfig = pipelineStatuses.find((s) => s.id === listing.status);

      const el = document.createElement("div");
      el.className = "listing-marker-container select-none cursor-pointer";

      // Inner container preserves MapLibre root transform positioning
      el.innerHTML = `
        <div class="listing-marker-inner relative flex flex-col items-center origin-bottom transition-all duration-200">
          <div class="marker-pill px-2 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white flex items-center gap-1 whitespace-nowrap bg-background text-foreground transition-all duration-200 hover:scale-105">
            <span class="marker-status-dot size-2 rounded-full shrink-0" style="background-color: ${statusConfig?.color || "#3b82f6"}"></span>
            <span class="marker-price">฿${(rent / 1000).toFixed(rent % 1000 === 0 ? 0 : 1)}k</span>
            ${listing.is_favorite ? '<span class="text-red-500 marker-fav-icon">★</span>' : ""}
          </div>
          <div class="marker-pointer size-2 rotate-45 -mt-1 border-r-2 border-b-2 border-white bg-background transition-colors duration-200"></div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        userClickedMarkerRef.current = true;
        selectListing(listing.id);
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      el.addEventListener("mouseenter", () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }

        if (popupRef.current) {
          popupRef.current.remove();
        }

        const popupContent = `
          <div class="p-2 space-y-1.5 max-w-[240px] text-xs cursor-pointer">
            <div class="font-bold text-sm leading-tight hover:text-primary">${listing.name}</div>
            <div class="text-muted-foreground text-[11px] truncate">${listing.address}</div>
            <div class="flex items-center justify-between text-xs pt-1 border-t">
              <span class="font-extrabold text-blue-600 dark:text-blue-400">฿${rent.toLocaleString()}/mo</span>
              <span class="text-[10px] text-muted-foreground">${listing.size_sqm} m² • Fl ${listing.floor}</span>
            </div>
            <div class="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
              <span>📍 ${formatDistance(distanceKm)}</span>
              <span class="font-medium text-foreground">${statusConfig?.name || listing.status}</span>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({
          offset: [0, -36],
          closeButton: false,
          closeOnClick: false,
          className: "location-hover-popup",
          maxWidth: "320px",
        })
          .setLngLat([listing.lng, listing.lat])
          .setHTML(popupContent)
          .addTo(mapRef.current!);

        const popupElement = popup.getElement();
        if (popupElement) {
          popupElement.addEventListener("mouseenter", () => {
            isHoveringPopupRef.current = true;
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
            }
          });
          popupElement.addEventListener("mouseleave", () => {
            isHoveringPopupRef.current = false;
            closePopup();
          });
          popupElement.addEventListener("click", () => {
            userClickedMarkerRef.current = true;
            selectListing(listing.id);
            popup.remove();
            popupRef.current = null;
          });
        }

        popupRef.current = popup;
      });

      el.addEventListener("mouseleave", () => {
        closePopup();
      });

      const markerInstance = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([listing.lng, listing.lat])
        .addTo(mapRef.current!);

      markersRef.current.set(listing.id, markerInstance);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    listings,
    activeCenterPoint,
    selectListing,
    closePopup,
  ]);

  // Synchronize marker visual styles on selection change without destroying DOM (100% flicker-free)
  React.useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedListingId;
      const el = marker.getElement();
      if (!el) return;

      const inner = el.querySelector(".listing-marker-inner") as HTMLElement | null;
      const pill = el.querySelector(".marker-pill") as HTMLElement | null;
      const pointer = el.querySelector(".marker-pointer") as HTMLElement | null;

      if (!inner || !pill || !pointer) return;

      if (isSelected) {
        inner.style.transform = "scale(1.25)";
        inner.style.zIndex = "1000";
        pill.className = "marker-pill px-2.5 py-1 rounded-full text-xs font-extrabold shadow-2xl border-2 border-white flex items-center gap-1 whitespace-nowrap bg-primary text-primary-foreground ring-4 ring-primary/30 transition-all duration-200";
        pointer.className = "marker-pointer size-2 rotate-45 -mt-1 border-r-2 border-b-2 border-white bg-primary transition-colors duration-200";
        el.style.zIndex = "1000";
      } else {
        inner.style.transform = "scale(1)";
        inner.style.zIndex = "1";
        pill.className = "marker-pill px-2 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white flex items-center gap-1 whitespace-nowrap bg-background text-foreground transition-all duration-200 hover:scale-105";
        pointer.className = "marker-pointer size-2 rotate-45 -mt-1 border-r-2 border-b-2 border-white bg-background transition-colors duration-200";
        el.style.zIndex = "1";
      }
    });

    if (selectedListingId && mapRef.current) {
      const selectedListing = listings.find((l) => l.id === selectedListingId);
      if (selectedListing) {
        if (userClickedMarkerRef.current) {
          userClickedMarkerRef.current = false;
        } else {
          isAnimatingRef.current = true;
          mapRef.current.easeTo({
            center: [selectedListing.lng, selectedListing.lat],
            zoom: Math.max(mapRef.current.getZoom(), 14),
            duration: 800,
          });
        }
      }
    }
  }, [selectedListingId, listings]);

  // Center & zoom sync from store
  React.useEffect(() => {
    if (!mapRef.current) return;
    if (isAnimatingRef.current) return;

    const centerChanged =
      Math.abs(lastCenterRef.current.lat - mapCenter.lat) > 0.0001 ||
      Math.abs(lastCenterRef.current.lng - mapCenter.lng) > 0.0001;
    const zoomChanged = Math.abs(lastZoomRef.current - mapZoom) > 0.1;

    if (centerChanged || zoomChanged) {
      isAnimatingRef.current = true;
      mapRef.current.flyTo({
        center: [mapCenter.lng, mapCenter.lat],
        zoom: mapZoom,
        essential: true,
      });
      lastCenterRef.current = { lat: mapCenter.lat, lng: mapCenter.lng };
      lastZoomRef.current = mapZoom;
    }
  }, [mapCenter, mapZoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 isolate" />

      {/* Interactive Map Picking Banner */}
      {isPickingOnMap && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-background/95 backdrop-blur-md border-2 border-primary shadow-2xl px-4 py-2 rounded-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="relative flex items-center justify-center">
            <span className="size-2.5 rounded-full bg-primary animate-ping absolute" />
            <span className="size-2 rounded-full bg-primary relative" />
          </div>
          <div className="text-xs font-medium">
            <span className="font-semibold text-foreground">Click anywhere on map</span>
            <span className="text-muted-foreground ml-1">
              to place {pickingTarget === "listing" ? "listing" : "waypoint"}
            </span>
          </div>
          <button
            type="button"
            onClick={cancelMapPicking}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-0.5 rounded-full bg-muted border hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Cancel (Esc)
          </button>
        </div>
      )}
    </div>
  );
}
