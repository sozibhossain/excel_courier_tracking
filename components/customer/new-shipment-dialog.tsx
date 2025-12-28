"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { createParcelBooking, type ParcelSummary } from "@/lib/api-client";
import { useToast } from "../ui/use-toast";

// Leaflet / OSM
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

const PARCEL_TYPES = [
  "Documents",
  "Electronics",
  "Apparel",
  "Fragile",
  "Other",
] as const;
const PARCEL_SIZES = ["Small", "Medium", "Large", "Oversized"] as const;

interface NewShipmentDialogProps {
  onCreated?: (parcel: ParcelSummary) => void;
}

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

// Use undefined (not null) so API payload types don't complain
const defaultAddress = {
  label: "",
  fullAddress: "",
  city: "",
  area: "",
  postalCode: "",
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
};

const createDefaultForm = () => ({
  pickupAddress: { ...defaultAddress },
  deliveryAddress: { ...defaultAddress },
  parcelType: "Documents",
  parcelSize: "Small",
  paymentType: "COD" as "COD" | "PREPAID",
  codAmount: "0",
  weight: "",
  scheduledPickupAt: "",
});

type ShipmentFormState = ReturnType<typeof createDefaultForm>;
type AddressTarget = "pickupAddress" | "deliveryAddress";

type PickedLocation = {
  fullAddress: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  postalCode?: string;
};

const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125]; // Dhaka fallback

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

function AddressPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  initialLat,
  initialLng,
  onConfirm,
  instanceId, // ✅ important
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialLat?: number | undefined;
  initialLng?: number | undefined;
  onConfirm: (picked: PickedLocation) => void;
  instanceId: number;
}) {
  const initialCenter = useMemo<[number, number]>(() => {
    if (typeof initialLat === "number" && typeof initialLng === "number")
      return [initialLat, initialLng];
    return DEFAULT_CENTER;
  }, [initialLat, initialLng]);

  const mapRef = useRef<LeafletMap | null>(null);

  // Hard cleanup helper
  const cleanupMap = () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const container = map.getContainer() as any;
      map.off();
      map.remove();
      if (container && container._leaflet_id) delete container._leaflet_id;
    } catch {
      // ignore
    } finally {
      mapRef.current = null;
    }
  };

  // ✅ Cleanup when closing and on unmount (covers StrictMode/HMR)
  useEffect(() => {
    if (!open) cleanupMap();
    return () => cleanupMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);

  const [pickedLat, setPickedLat] = useState<number>(initialCenter[0]);
  const [pickedLng, setPickedLng] = useState<number>(initialCenter[1]);
  const [pickedAddress, setPickedAddress] = useState<string>("");
  const [resolving, setResolving] = useState(false);

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

  const canConfirm =
    !!pickedAddress && Number.isFinite(pickedLat) && Number.isFinite(pickedLng);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) cleanupMap();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? "Search or click the map to select a location."}
          </DialogDescription>
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

          {/* ✅ KEY FIX: wrapper div gets unique key per open -> brand new DOM container */}
          <div className="h-[360px] w-full overflow-hidden rounded-md border">
            {open ? (
              <div key={instanceId} className="h-full w-full">
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
              </div>
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
              onClick={() => {
                cleanupMap();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canConfirm || resolving}
              onClick={async () => {
                const picked = await resolveAddress(pickedLat, pickedLng);
                onConfirm(picked);
                cleanupMap();
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

export function NewShipmentDialog({ onCreated }: NewShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShipmentFormState>(createDefaultForm);
  const [submitting, setSubmitting] = useState(false);

  // Address picker modal state
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [addressPickerTarget, setAddressPickerTarget] =
    useState<AddressTarget>("pickupAddress");

  // ✅ Unique instance per open (prevents Leaflet container reuse)
  const [addressPickerInstanceId, setAddressPickerInstanceId] = useState(0);

  const { tokens } = useAuth();
  const { toast } = useToast();

  const handleAddressChange = (
    target: "pickupAddress" | "deliveryAddress",
    field: keyof typeof defaultAddress,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      [target]: {
        ...prev[target],
        [field]: value,
      },
    }));
  };

  const handleFieldChange = (field: keyof ShipmentFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddressPicker = (target: AddressTarget) => {
    setAddressPickerTarget(target);
    setAddressPickerInstanceId((id) => id + 1); // ✅ increment BEFORE open
    setAddressPickerOpen(true);
  };

  const resetForm = () => setForm(createDefaultForm());

  const requiredFieldsFilled =
    !!form.pickupAddress.fullAddress &&
    !!form.pickupAddress.city &&
    !!form.pickupAddress.area &&
    !!form.pickupAddress.postalCode &&
    !!form.deliveryAddress.fullAddress &&
    !!form.deliveryAddress.city &&
    !!form.deliveryAddress.area &&
    !!form.deliveryAddress.postalCode;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tokens?.accessToken) {
      toast({
        title: "Authentication required",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        pickupAddress: {
          ...form.pickupAddress,
          lat: form.pickupAddress.lat ?? undefined,
          lng: form.pickupAddress.lng ?? undefined,
        },
        deliveryAddress: {
          ...form.deliveryAddress,
          lat: form.deliveryAddress.lat ?? undefined,
          lng: form.deliveryAddress.lng ?? undefined,
        },
        parcelType: form.parcelType,
        parcelSize: form.parcelSize,
        paymentType: form.paymentType,
        codAmount: form.paymentType === "COD" ? Number(form.codAmount || 0) : 0,
        weight: form.weight ? Number(form.weight) : undefined,
        scheduledPickupAt: form.scheduledPickupAt
          ? new Date(form.scheduledPickupAt).toISOString()
          : undefined,
      };

      const parcel = await createParcelBooking(
        tokens.accessToken,
        payload as any
      );

      toast({
        title: "Shipment created",
        description: `Tracking code ${parcel.trackingCode} is ready.`,
      });

      onCreated?.(parcel);
      resetForm();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create shipment",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const codDisabled = form.paymentType === "PREPAID";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => !submitting && setOpen(value)}
      >
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Shipment
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create shipment</DialogTitle>
            <DialogDescription>
              Enter pickup and delivery details to schedule a courier.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Pickup
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pickup-label">Label</Label>
                  <Input
                    id="pickup-label"
                    placeholder="Warehouse A"
                    value={form.pickupAddress.label}
                    onChange={(event) =>
                      handleAddressChange(
                        "pickupAddress",
                        "label",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup-city">City</Label>
                  <Input
                    id="pickup-city"
                    placeholder="Dhaka"
                    value={form.pickupAddress.city}
                    onChange={(event) =>
                      handleAddressChange(
                        "pickupAddress",
                        "city",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pickup-address">Full address</Label>
                  <Input
                    id="pickup-address"
                    placeholder="House 12, Road 1, Dhanmondi"
                    value={form.pickupAddress.fullAddress}
                    readOnly
                    onClick={() => openAddressPicker("pickupAddress")}
                    required
                  />
                  <div className="text-xs text-muted-foreground">
                    {typeof form.pickupAddress.lat === "number" &&
                    typeof form.pickupAddress.lng === "number"
                      ? `Lat ${form.pickupAddress.lat.toFixed(
                          6
                        )}, Lng ${form.pickupAddress.lng.toFixed(6)}`
                      : "Click to pick on map (sets latitude/longitude)."}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup-area">Area</Label>
                  <Input
                    id="pickup-area"
                    placeholder="Dhanmondi"
                    value={form.pickupAddress.area}
                    onChange={(event) =>
                      handleAddressChange(
                        "pickupAddress",
                        "area",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup-postal">Postal code</Label>
                  <Input
                    id="pickup-postal"
                    placeholder="1205"
                    value={form.pickupAddress.postalCode}
                    onChange={(event) =>
                      handleAddressChange(
                        "pickupAddress",
                        "postalCode",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Delivery
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delivery-label">Label</Label>
                  <Input
                    id="delivery-label"
                    placeholder="Customer"
                    value={form.deliveryAddress.label}
                    onChange={(event) =>
                      handleAddressChange(
                        "deliveryAddress",
                        "label",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-city">City</Label>
                  <Input
                    id="delivery-city"
                    placeholder="Chattogram"
                    value={form.deliveryAddress.city}
                    onChange={(event) =>
                      handleAddressChange(
                        "deliveryAddress",
                        "city",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="delivery-address">Full address</Label>
                  <Input
                    id="delivery-address"
                    placeholder="Apartment 3B, Agrabad"
                    value={form.deliveryAddress.fullAddress}
                    readOnly
                    onClick={() => openAddressPicker("deliveryAddress")}
                    required
                  />
                  <div className="text-xs text-muted-foreground">
                    {typeof form.deliveryAddress.lat === "number" &&
                    typeof form.deliveryAddress.lng === "number"
                      ? `Lat ${form.deliveryAddress.lat.toFixed(
                          6
                        )}, Lng ${form.deliveryAddress.lng.toFixed(6)}`
                      : "Click to pick on map (sets latitude/longitude)."}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-area">Area</Label>
                  <Input
                    id="delivery-area"
                    placeholder="Agrabad"
                    value={form.deliveryAddress.area}
                    onChange={(event) =>
                      handleAddressChange(
                        "deliveryAddress",
                        "area",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-postal">Postal code</Label>
                  <Input
                    id="delivery-postal"
                    placeholder="4000"
                    value={form.deliveryAddress.postalCode}
                    onChange={(event) =>
                      handleAddressChange(
                        "deliveryAddress",
                        "postalCode",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Parcel details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Parcel type</Label>
                  <Select
                    value={form.parcelType}
                    onValueChange={(value) =>
                      handleFieldChange("parcelType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARCEL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Parcel size</Label>
                  <Select
                    value={form.parcelSize}
                    onValueChange={(value) =>
                      handleFieldChange("parcelSize", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARCEL_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parcel-weight">Weight (kg)</Label>
                  <Input
                    id="parcel-weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.weight}
                    onChange={(event) =>
                      handleFieldChange("weight", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment type</Label>
                  <Select
                    value={form.paymentType}
                    onValueChange={(value) =>
                      handleFieldChange("paymentType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COD">Cash on Delivery</SelectItem>
                      <SelectItem value="PREPAID">Prepaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cod-amount">COD amount</Label>
                  <Input
                    id="cod-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={codDisabled}
                    value={form.codAmount}
                    onChange={(event) =>
                      handleFieldChange("codAmount", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup-time">Pickup schedule</Label>
                  <Input
                    id="pickup-time"
                    type="datetime-local"
                    value={form.scheduledPickupAt}
                    onChange={(event) =>
                      handleFieldChange("scheduledPickupAt", event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                disabled={submitting}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!requiredFieldsFilled || submitting}
              >
                {submitting ? "Creating..." : "Create shipment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AddressPickerDialog
        open={addressPickerOpen}
        onOpenChange={(v) => setAddressPickerOpen(v)}
        title={
          addressPickerTarget === "pickupAddress"
            ? "Select pickup location"
            : "Select delivery location"
        }
        initialLat={form[addressPickerTarget].lat}
        initialLng={form[addressPickerTarget].lng}
        instanceId={addressPickerInstanceId}
        onConfirm={(picked) => {
          setForm((prev) => ({
            ...prev,
            [addressPickerTarget]: {
              ...prev[addressPickerTarget],
              fullAddress: picked.fullAddress,
              lat: picked.lat,
              lng: picked.lng,
              city: picked.city || prev[addressPickerTarget].city,
              area: picked.area || prev[addressPickerTarget].area,
              postalCode:
                picked.postalCode || prev[addressPickerTarget].postalCode,
            },
          }));
        }}
      />
    </>
  );
}
