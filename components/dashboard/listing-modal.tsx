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
import { Badge } from "@/components/ui/badge";
import { useMapsStore } from "@/store/maps-store";
import {
  Listing,
  PropertyType,
  PipelineStatus,
} from "@/types/hunting";
import { propertyTypes, pipelineStatuses } from "@/mock-data/condos";

interface ListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialListing?: Listing | null;
}

export function ListingModal({
  open,
  onOpenChange,
  initialListing,
}: ListingModalProps) {
  const { addListing, updateListing } = useMapsStore();

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [lat, setLat] = React.useState(13.745);
  const [lng, setLng] = React.useState(100.54);
  const [type, setType] = React.useState<PropertyType>("condo");
  const [status, setStatus] = React.useState<PipelineStatus>("interested");
  const [sizeSqm, setSizeSqm] = React.useState(32);
  const [floor, setFloor] = React.useState(10);
  const [view, setView] = React.useState("City view");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactLine, setContactLine] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [photosStr, setPhotosStr] = React.useState("");

  // Pricing
  const [rent, setRent] = React.useState(15000);
  const [deposit, setDeposit] = React.useState(30000);
  const [advance, setAdvance] = React.useState(15000);
  const [commonFee, setCommonFee] = React.useState(0);
  const [parkingFee, setParkingFee] = React.useState(0);
  const [internetFee, setInternetFee] = React.useState(0);
  const [waterRate, setWaterRate] = React.useState("18 ฿/unit");
  const [electricRate, setElectricRate] = React.useState("MEA Rate (~4.4 ฿)");

  // Amenities
  const [elevator, setElevator] = React.useState(true);
  const [gym, setGym] = React.useState(true);
  const [pool, setPool] = React.useState(true);
  const [parking, setParking] = React.useState(true);
  const [cctv, setCctv] = React.useState(true);
  const [keycard, setKeycard] = React.useState(true);

  React.useEffect(() => {
    if (initialListing) {
      setName(initialListing.name);
      setAddress(initialListing.address);
      setLat(initialListing.lat);
      setLng(initialListing.lng);
      setType(initialListing.type);
      setStatus(initialListing.status);
      setSizeSqm(initialListing.size_sqm);
      setFloor(initialListing.floor);
      setView(initialListing.view);
      setSourceUrl(initialListing.source_url);
      setContactPhone(initialListing.contact_phone);
      setContactLine(initialListing.contact_line);
      setNotes(initialListing.notes);
      setPhotosStr(initialListing.photos.join("\n"));
      setElevator(initialListing.amenities.elevator);
      setGym(initialListing.amenities.gym);
      setPool(initialListing.amenities.pool);
      setParking(initialListing.amenities.parking);
      setCctv(initialListing.amenities.cctv);
      setKeycard(initialListing.amenities.keycard);

      const latestPrice =
        initialListing.price_history[initialListing.price_history.length - 1];
      if (latestPrice) {
        setRent(latestPrice.rent);
        setDeposit(latestPrice.deposit);
        setAdvance(latestPrice.advance);
        setCommonFee(latestPrice.common_fee);
        setParkingFee(latestPrice.parking_fee);
        setInternetFee(latestPrice.internet_fee);
        setWaterRate(latestPrice.water_rate);
        setElectricRate(latestPrice.electric_rate);
      }
    } else {
      // Default reset
      setName("");
      setAddress("");
      setLat(13.74 + (Math.random() - 0.5) * 0.05);
      setLng(100.54 + (Math.random() - 0.5) * 0.05);
      setType("condo");
      setStatus("interested");
      setSizeSqm(32);
      setFloor(12);
      setView("City view");
      setSourceUrl("");
      setContactPhone("");
      setContactLine("");
      setNotes("");
      setPhotosStr(
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80\nhttps://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
      );
      setRent(15000);
      setDeposit(30000);
      setAdvance(15000);
      setCommonFee(0);
      setParkingFee(0);
      setInternetFee(0);
      setWaterRate("18 ฿/unit");
      setElectricRate("MEA Rate (~4.4 ฿)");
      setElevator(true);
      setGym(true);
      setPool(true);
      setParking(true);
      setCctv(true);
      setKeycard(true);
    }
  }, [initialListing, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPhotos = photosStr
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const priceEntry = {
      id: `ph-${Date.now()}`,
      listing_id: initialListing?.id || "",
      rent: Number(rent) || 0,
      deposit: Number(deposit) || 0,
      advance: Number(advance) || 0,
      common_fee: Number(commonFee) || 0,
      parking_fee: Number(parkingFee) || 0,
      internet_fee: Number(internetFee) || 0,
      water_type: "metered" as const,
      water_rate: waterRate,
      electric_type: "government" as const,
      electric_rate: electricRate,
      recorded_at: new Date().toISOString(),
      note: initialListing ? "Updated details" : "Initial listing entry",
    };

    if (initialListing) {
      updateListing(initialListing.id, {
        name,
        address,
        lat: Number(lat),
        lng: Number(lng),
        type,
        status,
        size_sqm: Number(sizeSqm),
        floor: Number(floor),
        view,
        source_url: sourceUrl,
        contact_phone: contactPhone,
        contact_line: contactLine,
        notes,
        photos: parsedPhotos.length > 0 ? parsedPhotos : initialListing.photos,
        amenities: { elevator, gym, pool, parking, cctv, keycard },
      });
    } else {
      addListing({
        name,
        address: address || "Bangkok, Thailand",
        lat: Number(lat),
        lng: Number(lng),
        type,
        status,
        size_sqm: Number(sizeSqm),
        floor: Number(floor),
        view,
        source_url: sourceUrl,
        contact_phone: contactPhone,
        contact_line: contactLine,
        is_favorite: false,
        notes,
        amenities: { elevator, gym, pool, parking, cctv, keycard },
        photos:
          parsedPhotos.length > 0
            ? parsedPhotos
            : [
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
              ],
        price_history: [priceEntry],
        viewing_logs: [],
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialListing ? "Edit Listing Details" : "Record New Rental Listing"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              1. Property Info
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Project / Property Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Life Asoke Hype"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Property Type</label>
                <div className="flex gap-1.5 flex-wrap">
                  {propertyTypes.map((pt) => (
                    <Button
                      key={pt.id}
                      type="button"
                      size="sm"
                      variant={type === pt.id ? "default" : "outline"}
                      className="h-8 text-xs capitalize"
                      onClick={() => setType(pt.id)}
                    >
                      {pt.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Address / Soi</label>
              <Input
                placeholder="e.g. Sukhumvit Soi 21, Asoke, Bangkok"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Size (sqm)</label>
                <Input
                  type="number"
                  value={sizeSqm}
                  onChange={(e) => setSizeSqm(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Floor</label>
                <Input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                />
              </div>
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
              <label className="block text-xs font-medium mb-1">View / Exposure</label>
              <Input
                placeholder="e.g. Unblocked city view, Pool view"
                value={view}
                onChange={(e) => setView(e.target.value)}
              />
            </div>
          </div>

          {/* Pipeline Status */}
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              2. Pipeline Status
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {pipelineStatuses.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className={`cursor-pointer px-2.5 py-1 text-xs transition-all ${
                    status === s.id
                      ? `${s.badgeClass} ring-2 ring-primary font-semibold`
                      : "opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setStatus(s.id)}
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pricing & Costs */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              3. Pricing & Terms (฿)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Monthly Rent (฿)</label>
                <Input
                  type="number"
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Deposit (฿)</label>
                <Input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Advance (฿)</label>
                <Input
                  type="number"
                  value={advance}
                  onChange={(e) => setAdvance(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Common Area Fee</label>
                <Input
                  type="number"
                  placeholder="0 if included"
                  value={commonFee}
                  onChange={(e) => setCommonFee(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Water Rate</label>
                <Input
                  placeholder="e.g. 18 ฿/unit"
                  value={waterRate}
                  onChange={(e) => setWaterRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Electricity Rate</label>
                <Input
                  placeholder="e.g. MEA Rate / 7 ฿/unit"
                  value={electricRate}
                  onChange={(e) => setElectricRate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              4. Project Amenities
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: "Elevator", val: elevator, set: setElevator },
                { label: "Gym / Fitness", val: gym, set: setGym },
                { label: "Swimming Pool", val: pool, set: setPool },
                { label: "Parking Space", val: parking, set: setParking },
                { label: "CCTV 24h", val: cctv, set: setCctv },
                { label: "Keycard Access", val: keycard, set: setKeycard },
              ].map((item) => (
                <Button
                  key={item.label}
                  type="button"
                  variant={item.val ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs w-full"
                  onClick={() => item.set(!item.val)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Contact & Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              5. Contacts & Source
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Source URL</label>
                <Input
                  placeholder="https://ddproperty.com/..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Contact Phone</label>
                <Input
                  placeholder="08x-xxx-xxxx"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">LINE ID</label>
                <Input
                  placeholder="@agent_id"
                  value={contactLine}
                  onChange={(e) => setContactLine(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes & Photos */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              6. Photos & Inspection Notes
            </h4>
            <div>
              <label className="block text-xs font-medium mb-1">
                Photo URLs (one per line)
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="https://..."
                value={photosStr}
                onChange={(e) => setPhotosStr(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Personal Notes (pros, cons, noise, smell)
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Aircon condition, street noise, water pressure, sunlight..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {initialListing ? "Save Changes" : "Create Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
