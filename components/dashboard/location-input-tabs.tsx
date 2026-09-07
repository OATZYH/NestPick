"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseLocationInput, isGoogleMapsShortLink, isValidLatLng } from "@/lib/geo-utils";
import { Link2, MapPin, SlidersHorizontal, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface LocationInputTabsProps {
  lat: number;
  lng: number;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onPickOnMap?: () => void;
  className?: string;
}

export function LocationInputTabs({
  lat,
  lng,
  onCoordinatesChange,
  onPickOnMap,
  className = "",
}: LocationInputTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"link" | "pick" | "manual">("link");
  const [linkInput, setLinkInput] = React.useState("");
  const [isResolving, setIsResolving] = React.useState(false);
  const [resolveFeedback, setResolveFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Synchronize local manual inputs with props
  const [manualLat, setManualLat] = React.useState<string>(lat.toString());
  const [manualLng, setManualLng] = React.useState<string>(lng.toString());

  React.useEffect(() => {
    setManualLat(lat.toString());
    setManualLng(lng.toString());
  }, [lat, lng]);

  const handleManualLatChange = (value: string) => {
    setManualLat(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isValidLatLng(parsed, lng)) {
      onCoordinatesChange(parsed, lng);
    }
  };

  const handleManualLngChange = (value: string) => {
    setManualLng(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isValidLatLng(lat, parsed)) {
      onCoordinatesChange(lat, parsed);
    }
  };

  const handleProcessLink = React.useCallback(
    async (textToProcess: string) => {
      const trimmed = textToProcess.trim();
      if (!trimmed) {
        setResolveFeedback(null);
        return;
      }

      setResolveFeedback(null);

      // 1. Check if it's already an expanded URL or raw coordinates
      const immediate = parseLocationInput(trimmed);
      if (immediate) {
        onCoordinatesChange(immediate.lat, immediate.lng);
        setResolveFeedback({
          type: "success",
          message: `Extracted: ${immediate.lat.toFixed(5)}, ${immediate.lng.toFixed(5)}`,
        });
        return;
      }

      // 2. Check if it's a shortened link that needs server-side redirection
      if (isGoogleMapsShortLink(trimmed) || trimmed.startsWith("http")) {
        setIsResolving(true);
        try {
          const res = await fetch("/api/resolve-maps-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: trimmed }),
          });

          const data = await res.json();
          if (res.ok && data.lat && data.lng) {
            onCoordinatesChange(data.lat, data.lng);
            setResolveFeedback({
              type: "success",
              message: `Extracted: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
            });
          } else {
            setResolveFeedback({
              type: "error",
              message: data.error || "Could not find coordinates in this URL.",
            });
          }
        } catch {
          setResolveFeedback({
            type: "error",
            message: "Failed to connect to link resolver.",
          });
        } finally {
          setIsResolving(false);
        }
      } else {
        setResolveFeedback({
          type: "error",
          message: "Unrecognized format. Paste a Google Maps link or coordinates like 13.7554, 100.5658",
        });
      }
    },
    [onCoordinatesChange]
  );

  return (
    <div className={`space-y-2 rounded-xl border bg-muted/20 p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary" />
          Location Coordinates
        </label>
        <span className="text-[11px] font-mono font-medium text-foreground bg-background px-2 py-0.5 rounded border">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "link" | "pick" | "manual")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="link" className="text-[11px] gap-1 px-1">
            <Link2 className="size-3" />
            <span>Link / Coords</span>
          </TabsTrigger>
          <TabsTrigger value="pick" className="text-[11px] gap-1 px-1">
            <MapPin className="size-3" />
            <span>Click on Map</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-[11px] gap-1 px-1">
            <SlidersHorizontal className="size-3" />
            <span>Manual Lat/Lng</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Google Maps Link / Raw Coords Convert */}
        <TabsContent value="link" className="mt-2.5 space-y-2">
          <div className="flex gap-1.5">
            <Input
              placeholder="Paste Google Maps URL or 13.7554, 100.5658"
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value);
                if (e.target.value.includes("@") || /^-?\d/.test(e.target.value)) {
                  handleProcessLink(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleProcessLink(linkInput);
                }
              }}
              className="text-xs h-8 bg-background"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isResolving || !linkInput.trim()}
              onClick={() => handleProcessLink(linkInput)}
              className="h-8 text-xs shrink-0"
            >
              {isResolving ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "Extract"
              )}
            </Button>
          </div>

          {resolveFeedback && (
            <div
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border ${
                resolveFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {resolveFeedback.type === "success" ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="size-3.5 shrink-0 text-destructive" />
              )}
              <span className="truncate">{resolveFeedback.message}</span>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Supports Google Maps share links (<code>maps.app.goo.gl</code>), browser URLs, or coordinate pairs (e.g. <code>13.745, 100.534</code>).
          </p>
        </TabsContent>

        {/* Tab 2: Click on Map */}
        <TabsContent value="pick" className="mt-2.5 space-y-2">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed bg-background/80 text-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="size-4" />
            </div>
            <div>
              <p className="text-xs font-medium">Interactive Map Placement</p>
              <p className="text-[11px] text-muted-foreground">
                Minimize this modal, switch to crosshair, and click anywhere on the map to pin this exact spot.
              </p>
            </div>
            {onPickOnMap && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onPickOnMap}
                className="h-7 text-xs font-medium gap-1.5 mt-1"
              >
                <MapPin className="size-3" />
                Pick Spot on Map
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Legacy Manual Lat/Lng */}
        <TabsContent value="manual" className="mt-2.5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Latitude (N/S)
              </label>
              <Input
                type="number"
                step="0.000001"
                value={manualLat}
                onChange={(e) => handleManualLatChange(e.target.value)}
                placeholder="13.7554"
                className="text-xs h-8 bg-background font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Longitude (E/W)
              </label>
              <Input
                type="number"
                step="0.000001"
                value={manualLng}
                onChange={(e) => handleManualLngChange(e.target.value)}
                placeholder="100.5658"
                className="text-xs h-8 bg-background font-mono"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Enter standard decimal degrees (WGS84). Coordinates update immediately.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
