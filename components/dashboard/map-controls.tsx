"use client";

import * as React from "react";
import {
  Plus,
  Minus,
  Locate,
  Compass,
  Layers,
  Map,
  Mountain,
  Satellite,
  Circle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMapsStore } from "@/store/maps-store";
import { cn, isValidCoordinates } from "@/lib/utils";

const mapStyles = [
  {
    id: "default",
    name: "Default",
    icon: Circle,
    description: "Follows theme",
  },
  { id: "streets", name: "Streets", icon: Map, description: "Detailed roads" },
  {
    id: "outdoors",
    name: "Outdoors",
    icon: Mountain,
    description: "Terrain & trails",
  },
  {
    id: "satellite",
    name: "Satellite",
    icon: Satellite,
    description: "Aerial view",
  },
] as const;

export function MapControls() {
  const {
    mapZoom,
    setMapZoom,
    setMapCenter,
    setUserLocation,
    mapStyle,
    setMapStyle,
    activeCenterPointId,
    centerPoints,
  } = useMapsStore();

  const [isLocating, setIsLocating] = React.useState(false);

  const handleZoomIn = () => {
    setMapZoom(Math.min(mapZoom + 1, 18));
  };

  const handleZoomOut = () => {
    setMapZoom(Math.max(mapZoom - 1, 3));
  };

  const handleResetView = () => {
    const cp =
      centerPoints.find((c) => c.id === activeCenterPointId) ||
      centerPoints[0];
    if (cp && isValidCoordinates(cp.lat, cp.lng)) {
      setMapCenter({ lat: cp.lat, lng: cp.lng });
      setMapZoom(12.5);
    } else {
      setMapCenter({ lat: 13.745, lng: 100.54 });
      setMapZoom(12.5);
    }
  };

  // Fallback IP Geolocation services with strict validation
  const getLocationFromIP = async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    // 1st attempt: ipapi.co
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        if (isValidCoordinates(lat, lng)) {
          return { lat, lng };
        }
      }
    } catch {
      // Continue to secondary provider
    }

    // 2nd attempt: ipwho.is (reliable CORS-friendly backup)
    try {
      const response = await fetch("https://ipwho.is/", {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        if (data.success !== false && isValidCoordinates(lat, lng)) {
          return { lat, lng };
        }
      }
    } catch {
      // Both attempts failed
    }

    return null;
  };

  // Device GPS Location with progressive fallback and validation
  const handleLocate = async () => {
    if (isLocating) return;
    setIsLocating(true);

    const applyLocation = (coords: { lat: number; lng: number }) => {
      setUserLocation(coords);
      setMapCenter(coords);
      setMapZoom(16);
    };

    const tryIPFallback = async (errorMessage?: string) => {
      try {
        const ipLocation = await getLocationFromIP();
        if (ipLocation && isValidCoordinates(ipLocation.lat, ipLocation.lng)) {
          applyLocation(ipLocation);
        } else {
          alert(
            errorMessage ||
              "Unable to detect your location. Please check your GPS or internet connection."
          );
        }
      } finally {
        setIsLocating(false);
      }
    };

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      await tryIPFallback("Geolocation is not supported by your browser.");
      return;
    }

    const requestPosition = (
      highAccuracy: boolean
    ): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: 8000,
          maximumAge: 30000,
        });
      });
    };

    try {
      let position: GeolocationPosition;
      try {
        // Step 1: Request precise GPS coordinates
        position = await requestPosition(true);
      } catch (err: unknown) {
        const geoErr = err as GeolocationPositionError;
        // If permission was denied by user, don't silently retry with low accuracy
        if (geoErr.code === 1) {
          throw geoErr;
        }
        // Step 2: If high accuracy timed out or failed, try standard accuracy
        position = await requestPosition(false);
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (isValidCoordinates(lat, lng)) {
        applyLocation({ lat, lng });
        setIsLocating(false);
      } else {
        await tryIPFallback("GPS returned invalid coordinates.");
      }
    } catch (err: unknown) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr.code === 1) {
        // Permission Denied
        alert(
          "Location permission was denied. Please allow location permissions in your browser or device settings to view your position on the map."
        );
        setIsLocating(false);
      } else {
        await tryIPFallback();
      }
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col sm:flex-row items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-pointer">
              <SidebarTrigger className="sm:hidden bg-background! size-11 shadow-lg cursor-pointer" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background! size-11 shadow-lg cursor-pointer transition-transform active:scale-95"
                  title="Map styles"
                >
                  <Layers className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Map styles & layers</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-48">
            {mapStyles.map((style) => {
              const Icon = style.icon;
              return (
                <DropdownMenuItem
                  key={style.id}
                  onClick={() => setMapStyle(style.id)}
                  className={cn(
                    "gap-3 cursor-pointer",
                    mapStyle === style.id && "bg-accent"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">{style.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {style.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-pointer">
              <ThemeToggle className="bg-background! size-11 shadow-lg cursor-pointer" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle theme (Light / Dark)</TooltipContent>
        </Tooltip>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        {/* Locate Me (Crosshairs) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={isLocating}
              className={cn(
                "bg-background! size-11 shadow-lg cursor-pointer transition-all active:scale-95",
                isLocating && "opacity-75 cursor-wait"
              )}
              onClick={handleLocate}
              title={isLocating ? "Locating..." : "Locate me (GPS)"}
            >
              {isLocating ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Locate className="size-4 text-foreground hover:text-primary transition-colors" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isLocating ? "Detecting your location..." : "Locate me (GPS)"}
          </TooltipContent>
        </Tooltip>

        {/* Reset View (Compass) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background! size-11 shadow-lg cursor-pointer transition-transform active:scale-95"
              onClick={handleResetView}
              title="Reset view to reference point"
            >
              <Compass className="size-4 text-foreground hover:text-primary transition-colors" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset view & orientation</TooltipContent>
        </Tooltip>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-lg border bg-background! shadow-lg overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none size-11 border-b flex items-center justify-center cursor-pointer hover:bg-accent active:scale-95 transition-all"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none size-11 flex items-center justify-center cursor-pointer hover:bg-accent active:scale-95 transition-all"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <Minus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
