"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useMapsStore, formatDistance, calculateDistance, getLatestRent } from "@/store/maps-store";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";
import { isValidCoordinates } from "@/lib/utils";

const MAP_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  outdoors: "https://tiles.stadiamaps.com/styles/outdoors.json",
  satellite: "https://tiles.stadiamaps.com/styles/alidade_satellite.json",
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

  const getMapStyleUrl = React.useCallback(() => {
    if (mapStyle === "default") {
      return resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
    }
    return MAP_STYLES[mapStyle];
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

  // Initialize Map
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(),
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
        offset: [0, -10],
        closeButton: true,
        closeOnClick: true,
        className: "location-action-popup",
        maxWidth: "280px",
      })
        .setLngLat([lng, lat])
        .setDOMContent(popupDiv)
        .addTo(map);

      clickActionPopupRef.current = actionPopup;
    });

    mapRef.current = map;

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (clickActionPopupRef.current) {
        clickActionPopupRef.current.remove();
        clickActionPopupRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map style when theme or mapStyle changes
  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(getMapStyleUrl());
  }, [getMapStyleUrl]);

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
            <span class="text-sm font-bold">${pickingTarget === "center-point" ? "🎯" : "📍"}</span>
          </div>
          <div class="w-2 h-2 bg-primary rotate-45 -mt-1 border-r border-b border-background"></div>
        </div>
      `;

      tempPinMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([pendingCoordinates.lng, pendingCoordinates.lat])
        .addTo(mapRef.current);
    }
  }, [pendingCoordinates, pickingTarget]);

  // Render Center Point Markers (only rebuilt when centerPoints list changes)
  React.useEffect(() => {
    if (!mapRef.current) return;

    centerPointMarkersRef.current.forEach((marker) => marker.remove());
    centerPointMarkersRef.current.clear();

    centerPoints.forEach((cp) => {
      const isActive = cp.id === activeCenterPointId;

      const el = document.createElement("div");
      el.className = "center-point-marker select-none cursor-pointer";
      el.style.zIndex = isActive ? "30" : "20";

      el.innerHTML = `
        <div class="center-point-inner origin-bottom flex flex-col items-center transition-transform duration-200 ${
          isActive ? "scale-110" : "opacity-80 hover:opacity-100 hover:scale-105"
        }">
          <div class="center-point-badge px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 border whitespace-nowrap mb-0.5 ${
            isActive
              ? "bg-pink-600 text-white border-pink-700 ring-2 ring-pink-400/40"
              : "bg-background/95 text-foreground border-border"
          }">
            <span>${cp.icon || "🎯"}</span>
            <span>${cp.name}</span>
          </div>
          <div class="size-3.5 rounded-full bg-pink-600 border-2 border-white shadow-sm flex items-center justify-center">
            <div class="size-1 rounded-full bg-white"></div>
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        useMapsStore.getState().setActiveCenterPoint(cp.id);
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([cp.lng, cp.lat])
        .addTo(mapRef.current!);

      centerPointMarkersRef.current.set(cp.id, marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerPoints]);

  // Synchronize Center Point active state in-place (100% flicker-free)
  React.useEffect(() => {
    centerPointMarkersRef.current.forEach((marker, id) => {
      const isActive = id === activeCenterPointId;
      const el = marker.getElement();
      if (!el) return;

      el.style.zIndex = isActive ? "30" : "20";

      const inner = el.querySelector<HTMLElement>(".center-point-inner");
      const badge = el.querySelector<HTMLElement>(".center-point-badge");

      if (isActive) {
        if (inner) {
          inner.className =
            "center-point-inner origin-bottom flex flex-col items-center transition-transform duration-200 scale-110";
        }
        if (badge) {
          badge.className =
            "center-point-badge px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 border whitespace-nowrap mb-0.5 bg-pink-600 text-white border-pink-700 ring-2 ring-pink-400/40";
        }
      } else {
        if (inner) {
          inner.className =
            "center-point-inner origin-bottom flex flex-col items-center transition-transform duration-200 opacity-80 hover:opacity-100 hover:scale-105";
        }
        if (badge) {
          badge.className =
            "center-point-badge px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 border whitespace-nowrap mb-0.5 bg-background/95 text-foreground border-border";
        }
      }
    });
  }, [activeCenterPointId]);

  // Render Listing Markers (only rebuilt when listings or active center point change)
  React.useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    listings.forEach((listing) => {
      const isSelected = listing.id === selectedListingId;
      const rent = getLatestRent(listing);
      const statusConfig = pipelineStatuses.find((s) => s.id === listing.status);
      const typeConfig = propertyTypes.find((t) => t.id === listing.type);
      const dist = activeCenterPoint
        ? calculateDistance(
            activeCenterPoint.lat,
            activeCenterPoint.lng,
            listing.lat,
            listing.lng
          )
        : null;

      const el = document.createElement("div");
      el.className = "listing-marker-container select-none cursor-pointer";
      el.style.zIndex = isSelected ? "40" : "10";

      const formattedRent = rent > 0 ? `฿${Math.round(rent / 1000)}k` : "N/A";

      el.innerHTML = `
        <div class="marker-wrapper origin-bottom flex flex-col items-center transition-transform duration-200 will-change-transform ${
          isSelected ? "scale-115" : "hover:scale-110"
        }">
          <div class="marker-pill px-2 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border transition-all duration-200 ${
            isSelected
              ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/40 shadow-lg"
              : "bg-background/95 text-foreground border-border hover:border-primary/60"
          }">
            <span class="size-2 rounded-full shrink-0" style="background-color: ${
              statusConfig?.color || "#3b82f6"
            }"></span>
            <span class="font-bold tracking-tight">${formattedRent}</span>
            ${listing.is_favorite ? '<span class="text-[10px] text-amber-500">★</span>' : ""}
          </div>
          <div class="marker-arrow w-2 h-2 bg-current rotate-45 -mt-1 ${
            isSelected ? "text-primary" : "text-border"
          }"></div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        userClickedMarkerRef.current = true;
        selectListing(listing.id);
      });

      el.addEventListener("mouseenter", () => {
        if (isPickingOnMapRef.current) return;

        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }

        if (popupRef.current) {
          popupRef.current.remove();
        }

        const photo = listing.photos[0] || "";
        const distanceText = dist !== null ? `${formatDistance(dist)} to ${activeCenterPoint?.name || "Center"}` : "";

        const popupContent = `
          <div class="p-3 w-72 text-sm bg-background rounded-xl overflow-hidden shadow-xl border cursor-pointer">
            ${
              photo
                ? `<div class="w-full h-32 rounded-lg overflow-hidden mb-2 bg-muted relative">
                    <img src="${photo}" alt="${listing.name}" class="w-full h-full object-cover" />
                    <span class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium ${
                      statusConfig?.badgeClass || "bg-black/60 text-white"
                    }">${statusConfig?.name || listing.status}</span>
                  </div>`
                : ""
            }
            <div class="flex items-start justify-between gap-1 mb-1">
              <h3 class="font-bold text-sm truncate leading-tight">${listing.name}</h3>
              <span class="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">฿${rent.toLocaleString()}/mo</span>
            </div>
            <p class="text-xs text-muted-foreground truncate mb-2">${listing.address}</p>
            <div class="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span>📐 ${listing.size_sqm} m²</span>
              <span>🏢 Fl. ${listing.floor}</span>
              <span class="capitalize">🏷️ ${typeConfig?.name || listing.type}</span>
            </div>
            ${
              distanceText
                ? `<div class="text-[11px] font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1 border-t pt-2">
                    <span>📍</span>
                    <span class="truncate">${distanceText}</span>
                  </div>`
                : ""
            }
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

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([listing.lng, listing.lat])
        .addTo(mapRef.current!);

      markersRef.current.set(listing.id, marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedListingId is intentionally synced in separate effect to prevent rebuilding DOM markers
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

      el.style.zIndex = isSelected ? "40" : "10";

      const wrapper = el.querySelector<HTMLElement>(".marker-wrapper");
      const pill = el.querySelector<HTMLElement>(".marker-pill");
      const arrow = el.querySelector<HTMLElement>(".marker-arrow");

      if (isSelected) {
        if (wrapper) {
          wrapper.className =
            "marker-wrapper origin-bottom flex flex-col items-center transition-transform duration-200 will-change-transform scale-115";
        }
        if (pill) {
          pill.className =
            "marker-pill px-2 py-0.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border transition-all duration-200 bg-primary text-primary-foreground border-primary ring-2 ring-primary/40";
        }
        if (arrow) {
          arrow.className = "marker-arrow w-2 h-2 bg-current rotate-45 -mt-1 text-primary";
        }
      } else {
        if (wrapper) {
          wrapper.className =
            "marker-wrapper origin-bottom flex flex-col items-center transition-transform duration-200 will-change-transform hover:scale-110";
        }
        if (pill) {
          pill.className =
            "marker-pill px-2 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border transition-all duration-200 bg-background/95 text-foreground border-border hover:border-primary/60";
        }
        if (arrow) {
          arrow.className = "marker-arrow w-2 h-2 bg-current rotate-45 -mt-1 text-border";
        }
      }
    });
  }, [selectedListingId]);

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

  const routeDataRef = React.useRef<{
    coordinates: [number, number][];
    bounds: maplibregl.LngLatBounds;
  } | null>(null);

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

  // Route cleanup
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

  // Style reload re-draw
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

  // Fly to selected listing (only when selected from panel/table, NOT when clicking marker directly)
  React.useEffect(() => {
    if (!mapRef.current || !selectedListingId) return;
    if (routeDestinationId) return;

    if (userClickedMarkerRef.current) {
      // User clicked pin directly on map: keep camera stationary so pin stays under cursor without shifting
      userClickedMarkerRef.current = false;
      return;
    }

    const listing = listings.find((l) => l.id === selectedListingId);
    if (listing) {
      isAnimatingRef.current = true;
      const targetZoom = Math.max(mapRef.current.getZoom(), 14);
      lastCenterRef.current = { lat: listing.lat, lng: listing.lng };
      lastZoomRef.current = targetZoom;

      mapRef.current.flyTo({
        center: [listing.lng, listing.lat],
        zoom: targetZoom,
        duration: 500,
        essential: true,
      });
    }
  }, [selectedListingId, listings, routeDestinationId]);

  // Center & zoom sync
  const lastCenterRef = React.useRef({
    lat: mapCenter.lat,
    lng: mapCenter.lng,
  });
  const lastZoomRef = React.useRef(mapZoom);

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
