"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

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

// ✅ Fix default marker icon
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export type PickedLocation = {
  fullAddress: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  postalCode?: string;
};

export type AddressPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (picked: PickedLocation) => void;

  /** must increment every time you open */
  instanceId: number;
};

const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125]; // Dhaka fallback

async function nominatimSearch(q: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("OpenStreetMap search failed");
  return (await res.json()) as Array<any>;
}

async function nominatimReverse(lat: number, lng: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
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
  instanceId,
}: AddressPickerDialogProps) {
  const initialCenter = useMemo<[number, number]>(() => {
    if (typeof initialLat === "number" && typeof initialLng === "number") return [initialLat, initialLng];
    return DEFAULT_CENTER;
  }, [initialLat, initialLng]);

  // ✅ Map node state (fixes portal timing issues)
  const [mapNode, setMapNode] = useState<HTMLDivElement | null>(null);

  // Leaflet refs
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);

  const [pickedLat, setPickedLat] = useState<number>(initialCenter[0]);
  const [pickedLng, setPickedLng] = useState<number>(initialCenter[1]);
  const [pickedAddress, setPickedAddress] = useState<string>("");
  const [resolving, setResolving] = useState(false);

  const destroyMap = () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.off();
      map.remove();
    } catch {
      // ignore
    } finally {
      mapRef.current = null;
      markerRef.current = null;
    }
  };

  // Reset state on open
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setPickedLat(initialCenter[0]);
    setPickedLng(initialCenter[1]);
    setPickedAddress("");
  }, [open, initialCenter]);

  const resolveAddress = async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const data = await nominatimReverse(lat, lng);
      const addr = data?.address ?? {};
      const picked: PickedLocation = {
        fullAddress: data?.display_name ?? "",
        lat,
        lng,
        city: addr.city || addr.town || addr.village || addr.county || "",
        area: addr.suburb || addr.neighbourhood || addr.city_district || "",
        postalCode: addr.postcode || "",
      };
      setPickedAddress(picked.fullAddress);
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

  // ✅ Initialize Leaflet ONLY when mapNode exists (portal-safe)
  useEffect(() => {
    if (!open || !mapNode) return;

    // Always destroy before init (dev strict-mode safe)
    destroyMap();

    // wipe stale leaflet id if any
    const anyNode = mapNode as any;
    if (anyNode._leaflet_id) delete anyNode._leaflet_id;

    const map = L.map(mapNode).setView([pickedLat, pickedLng], 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([pickedLat, pickedLng], { icon: DefaultIcon }).addTo(map);
    markerRef.current = marker;

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      marker.setLatLng([lat, lng]);
      await handlePick(lat, lng);
    });

    // ✅ Important: dialog animations/portal can cause 0-size at init
    // invalidate after paint + small delay
    requestAnimationFrame(() => map.invalidateSize());
    const t = window.setTimeout(() => map.invalidateSize(), 200);

    return () => {
      window.clearTimeout(t);
      destroyMap();
      if (anyNode._leaflet_id) delete anyNode._leaflet_id;
    };
    // instanceId ensures new map per open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instanceId, mapNode]);

  // Keep marker/view synced when picked coords change (search / result click)
  useEffect(() => {
    if (!open) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([pickedLat, pickedLng]);
    map.setView([pickedLat, pickedLng], map.getZoom(), { animate: true });
  }, [pickedLat, pickedLng, open]);

  const canConfirm = !!pickedAddress && Number.isFinite(pickedLat) && Number.isFinite(pickedLng);

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
              <div className="text-xs text-muted-foreground mb-2">Search results</div>
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

          {/* ✅ Map */}
          <div className="h-[360px] w-full overflow-hidden rounded-md border">
            <div
              key={`leaflet-map-${instanceId}`}   // ✅ new DOM per open
              ref={setMapNode}                   // ✅ callback ref (portal-safe)
              className="h-full w-full"
            />
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Selected</div>
            <div className="text-xs text-muted-foreground mt-1">
              Lat: {pickedLat.toFixed(6)} | Lng: {pickedLng.toFixed(6)}
            </div>
            <div className="text-sm mt-2">{pickedAddress || "Click on the map to resolve an address."}</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
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
