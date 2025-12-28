"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type PickedLocation = {
  fullAddress: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  postalCode?: string;
};

type AddressPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialLat?: number | undefined;
  initialLng?: number | undefined;
  onConfirm: (picked: PickedLocation) => void;
};

const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125]; // Dhaka fallback

function MapClickPicker({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function nominatimSearch(q: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("OpenStreetMap search failed");
  return (await res.json()) as Array<any>;
}

async function nominatimReverse(lat: number, lng: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("OpenStreetMap reverse geocode failed");
  return (await res.json()) as any;
}

export function AddressPickerDialog({
  open,
  onOpenChange,
  title,
  description = "Search or click the map to select a location.",
  initialLat,
  initialLng,
  onConfirm,
}: AddressPickerDialogProps) {
  const initialCenter = useMemo<[number, number]>(() => {
    if (typeof initialLat === "number" && typeof initialLng === "number")
      return [initialLat, initialLng];
    return DEFAULT_CENTER;
  }, [initialLat, initialLng]);

  const mapRef = useRef<LeafletMap | null>(null);

  // ✅ CRITICAL: cleanup on unmount (fixes StrictMode “already initialized”)
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);

  const [pickedLat, setPickedLat] = useState<number>(initialCenter[0]);
  const [pickedLng, setPickedLng] = useState<number>(initialCenter[1]);
  const [pickedAddress, setPickedAddress] = useState<string>("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPickedLat(initialCenter[0]);
    setPickedLng(initialCenter[1]);
    setPickedAddress("");
    setResults([]);
    setQuery("");
  }, [open, initialCenter]);

  const resolveAddress = async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const data = await nominatimReverse(lat, lng);
      const addr = data?.address ?? {};
      const fullAddress = data?.display_name ?? "";
      setPickedAddress(fullAddress);

      const picked: PickedLocation = {
        fullAddress,
        lat,
        lng,
        city: addr.city || addr.town || addr.village || addr.county || "",
        area: addr.suburb || addr.neighbourhood || addr.city_district || "",
        postalCode: addr.postcode || "",
      };
      return picked;
    } finally {
      setResolving(false);
    }
  };

  const handlePick = async (lat: number, lng: number) => {
    setPickedLat(lat);
    setPickedLng(lng);
    await resolveAddress(lat, lng);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await nominatimSearch(query.trim());
      setResults(data);
      if (data?.[0]) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        setPickedLat(lat);
        setPickedLng(lng);
        await resolveAddress(lat, lng);
      }
    } finally {
      setSearching(false);
    }
  };

  const canConfirm =
    !!pickedAddress && Number.isFinite(pickedLat) && Number.isFinite(pickedLng);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="House 12, Road 1, Dhanmondi"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleSearch} disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="rounded-md border p-2 max-h-40 overflow-auto">
              <div className="text-xs text-muted-foreground mb-2">
                Search results
              </div>
              <div className="space-y-2">
                {results.map((r) => (
                  <button
                    key={`${r.place_id}`}
                    type="button"
                    className="w-full text-left rounded-md px-2 py-2 hover:bg-muted"
                    onClick={async () => {
                      const lat = Number(r.lat);
                      const lng = Number(r.lon);
                      setPickedLat(lat);
                      setPickedLng(lng);
                      await resolveAddress(lat, lng);
                    }}
                  >
                    <div className="text-sm">{r.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {Number(r.lat).toFixed(5)}, {Number(r.lon).toFixed(5)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-[360px] w-full overflow-hidden rounded-md border">
            {open ? (
              <MapContainer
                key={`addr-map-${initialCenter[0]}-${initialCenter[1]}`}
                center={[pickedLat, pickedLng]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                ref={(map) => {
                  mapRef.current = map ?? null;
                }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickPicker onPick={handlePick} />
                <Marker position={[pickedLat, pickedLng]} />
              </MapContainer>
            ) : null}
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Selected</div>
            <div className="text-xs text-muted-foreground mt-1">
              Lat: {pickedLat.toFixed(6)} | Lng: {pickedLng.toFixed(6)}
            </div>
            <div className="text-sm mt-2">
              {pickedAddress || "Click on the map to resolve an address."}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canConfirm || resolving}
              onClick={async () => {
                const picked = await resolveAddress(pickedLat, pickedLng);
                onConfirm(picked);
                onOpenChange(false);
              }}
            >
              {resolving ? "Resolving..." : "Use this address"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
