"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapsStore } from "@/store/maps-store";
import { CenterPointCategory } from "@/types/hunting";
import { Trash2 } from "lucide-react";

interface CenterPointModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CenterPointModal({ open, onOpenChange }: CenterPointModalProps) {
  const {
    centerPoints,
    activeCenterPointId,
    setActiveCenterPoint,
    addCenterPoint,
    deleteCenterPoint,
  } = useMapsStore();

  const [name, setName] = React.useState("");
  const [lat, setLat] = React.useState(13.7462);
  const [lng, setLng] = React.useState(100.5347);
  const [category, setCategory] = React.useState<CenterPointCategory>("workplace");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCenterPoint({
      name,
      lat: Number(lat),
      lng: Number(lng),
      category,
      color:
        category === "workplace"
          ? "#ec4899"
          : category === "university"
          ? "#8b5cf6"
          : "#3b82f6",
    });

    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reference Center Points</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-xs text-muted-foreground">
            Distances and routes will be calculated from your chosen center reference point (e.g. workplace, university, or landmark).
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Current Reference Points
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {centerPoints.map((cp) => {
                const isActive = activeCenterPointId === cp.id;
                return (
                  <div
                    key={cp.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10 font-medium"
                        : "hover:bg-accent/40"
                    }`}
                    onClick={() => setActiveCenterPoint(cp.id)}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full inline-block"
                          style={{ backgroundColor: cp.color || "#3b82f6" }}
                        />
                        <span>{cp.name}</span>
                        {isActive && (
                          <span className="text-[10px] text-primary font-semibold">
                            (Active)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground pl-3.5">
                        {cp.lat.toFixed(4)}, {cp.lng.toFixed(4)} • {cp.category}
                      </div>
                    </div>
                    {centerPoints.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCenterPoint(cp.id);
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAdd} className="border-t pt-3 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Add New Reference Point
            </h4>
            <div>
              <label className="block text-xs font-medium mb-1">Name / Label</label>
              <Input
                placeholder="e.g. New Office, Fitness Gym, Station"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Latitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Longitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <div className="flex gap-2">
                {(["workplace", "university", "transit", "landmark"] as const).map(
                  (cat) => (
                    <Button
                      key={cat}
                      type="button"
                      size="sm"
                      variant={category === cat ? "default" : "outline"}
                      className="h-7 text-xs flex-1 capitalize"
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </Button>
                  )
                )}
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full mt-2">
              Add Reference Point
            </Button>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
