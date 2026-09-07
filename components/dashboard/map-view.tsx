"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useMapsStore, formatDistance, calculateDistance, getLatestRent } from "@/store/maps-store";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";

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
  const popupRef = React.useRef<maplibregl.Popup | null>(null);
  const isAnimatingRef = React.useRef(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isHoveringPopupRef = React.useRef(false);
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
  } = useMapsStore();

  const activeCenterPoint = centerPoints.find((cp) => cp.id === activeCenterPointId) || centerPoints[0];

  const getMapStyleUrl = React.useCallback(() => {
    if (mapStyle === "default") {
      return resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
    }
    return MAP_STYLES[mapStyle];
  }, [mapStyle, resolvedTheme]);

  const listings = getFilteredListings();

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

    mapRef.current = map;

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update style on theme / style change
  React.useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(getMapStyleUrl());
  }, [mapStyle, resolvedTheme, getMapStyleUrl]);

  // Center Points Markers (Workplace, University, Transit)
  React.useEffect(() => {
    if (!mapRef.current) return;

    centerPointMarkersRef.current.forEach((marker) => marker.remove());
    centerPointMarkersRef.current.clear();

    centerPoints.forEach((cp) => {
      const isActive = cp.id === activeCenterPointId;
      const el = document.createElement("div");
      el.className = "center-point-marker";
      el.innerHTML = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute -inset-2 rounded-full ${
            isActive ? "bg-pink-500/20 animate-ping" : ""
          }"></div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border-2 ${
            isActive
              ? "bg-pink-600 text-white border-white scale-110"
              : "bg-background text-foreground border-pink-500 opacity-90 hover:scale-105"
          } transition-all duration-200">
            <span class="text-xs">🎯</span>
            <span class="text-[11px] font-semibold whitespace-nowrap">${cp.name}</span>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cp.lng, cp.lat])
        .addTo(mapRef.current!);

      centerPointMarkersRef.current.set(cp.id, marker);
    });
  }, [centerPoints, activeCenterPointId]);

  // Listings Markers
  React.useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    listings.forEach((listing) => {
      const typeConfig = propertyTypes.find((t) => t.id === listing.type);
      const statusConfig = pipelineStatuses.find((s) => s.id === listing.status);
      const rent = getLatestRent(listing);
      const rentDisplay = rent ? `฿${(rent / 1000).toFixed(0)}k` : "N/A";
      const isSelected = selectedListingId === listing.id;
      const isRouteDestination = routeDestinationId === listing.id;

      const dist = activeCenterPoint
        ? calculateDistance(activeCenterPoint.lat, activeCenterPoint.lng, listing.lat, listing.lng)
        : null;

      const el = document.createElement("div");
      el.className = "listing-marker-container";
      el.innerHTML = `
        <div class="relative cursor-pointer transition-all duration-200 ${
          isSelected || isRouteDestination ? "scale-125 z-30" : "hover:scale-110 z-10"
        }">
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-full shadow-md border text-xs font-bold ${
            isSelected
              ? "bg-blue-600 text-white border-white ring-2 ring-blue-400"
              : isRouteDestination
              ? "bg-emerald-600 text-white border-white ring-2 ring-emerald-400"
              : "bg-background text-foreground border-border hover:border-blue-500"
          }">
            <span class="size-2 rounded-full inline-block" style="background-color: ${
              statusConfig?.color || "#3b82f6"
            }"></span>
            <span>${rentDisplay}</span>
          </div>
          ${
            isSelected
              ? '<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>'
              : ""
          }
        </div>
      `;

      el.addEventListener("click", () => {
        selectListing(listing.id);
      });

      el.addEventListener("mouseenter", () => {
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
          offset: [0, -25],
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

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([listing.lng, listing.lat])
        .addTo(mapRef.current!);

      markersRef.current.set(listing.id, marker);
    });
  }, [
    listings,
    selectedListingId,
    selectListing,
    closePopup,
    routeDestinationId,
    activeCenterPoint,
  ]);

  // Route drawing function declared before useEffect to satisfy React compiler
  const drawRoute = React.useCallback(
    (map: maplibregl.Map, coordinates: [number, number][]) => {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getLayer("route-line-outline")) map.removeLayer("route-line-outline");
      if (map.getSource("route")) map.removeSource("route");

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

  // Fly to selected listing
  React.useEffect(() => {
    if (!mapRef.current || !selectedListingId) return;
    if (routeDestinationId) return;

    const listing = listings.find((l) => l.id === selectedListingId);
    if (listing) {
      isAnimatingRef.current = true;
      mapRef.current.flyTo({
        center: [listing.lng, listing.lat],
        zoom: Math.max(mapRef.current.getZoom(), 14),
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

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
