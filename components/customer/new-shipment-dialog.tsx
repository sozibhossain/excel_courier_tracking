"use client";

import React, { useState } from "react";
import { Plus, MapPin, Package, CreditCard, Map as MapIcon, Calendar } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { createParcelBooking, type ParcelSummary } from "@/lib/api-client";
import { useToast } from "../ui/use-toast";
import { AddressPickerDialog, PickedLocation } from "./address-picker-dialog";

const PARCEL_TYPES = ["Documents", "Electronics", "Apparel", "Fragile", "Other"] as const;
const PARCEL_SIZES = ["Small", "Medium", "Large", "Oversized"] as const;

interface NewShipmentDialogProps {
  onCreated?: (parcel: ParcelSummary) => void;
}

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

export function NewShipmentDialog({ onCreated }: NewShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShipmentFormState>(createDefaultForm);
  const [submitting, setSubmitting] = useState(false);

  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [addressPickerTarget, setAddressPickerTarget] = useState<AddressTarget>("pickupAddress");
  const [addressPickerInstanceId, setAddressPickerInstanceId] = useState(0);

  const { tokens } = useAuth();
  const { toast } = useToast();

  const handleAddressChange = (target: AddressTarget, field: keyof typeof defaultAddress, value: any) => {
    setForm((prev) => ({
      ...prev,
      [target]: { ...prev[target], [field]: value },
    }));
  };

  const handleFieldChange = (field: keyof ShipmentFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddressPicker = (target: AddressTarget) => {
    setAddressPickerTarget(target);
    setAddressPickerInstanceId((id) => id + 1);
    setAddressPickerOpen(true);
  };

  const resetForm = () => setForm(createDefaultForm());

  const requiredFieldsFilled =
    !!form.pickupAddress.fullAddress &&
    !!form.deliveryAddress.fullAddress &&
    !!form.pickupAddress.city &&
    !!form.deliveryAddress.city;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tokens?.accessToken) {
      toast({ title: "Authentication required", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        codAmount: form.paymentType === "COD" ? Number(form.codAmount || 0) : 0,
        weight: form.weight ? Number(form.weight) : undefined,
        scheduledPickupAt: form.scheduledPickupAt ? new Date(form.scheduledPickupAt).toISOString() : undefined,
      };

      const parcel = await createParcelBooking(tokens.accessToken, payload as any);
      toast({ title: "Shipment created", description: `Tracking: ${parcel.trackingCode}` });
      onCreated?.(parcel);
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
        <DialogTrigger asChild>
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> New Shipment
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden flex flex-col max-h-[95vh]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Create Shipment</DialogTitle>
            <DialogDescription>Fill in the details to schedule your courier pickup.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-2 space-y-8">
            {/* Pickup & Delivery Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pickup Address */}
              <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm uppercase tracking-wider">Pickup Details</span>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-address">Full Address</Label>
                    <div 
                      onClick={() => openAddressPicker("pickupAddress")}
                      className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white cursor-pointer hover:border-primary transition-colors text-sm"
                    >
                      <span className={form.pickupAddress.fullAddress ? "text-foreground" : "text-muted-foreground"}>
                        {form.pickupAddress.fullAddress || "Select location on map..."}
                      </span>
                      <MapIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input 
                        placeholder="Dhaka" 
                        value={form.pickupAddress.city} 
                        onChange={(e) => handleAddressChange("pickupAddress", "city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Area</Label>
                      <Input 
                        placeholder="Dhanmondi" 
                        value={form.pickupAddress.area} 
                        onChange={(e) => handleAddressChange("pickupAddress", "area", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm uppercase tracking-wider">Delivery Details</span>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="d-address">Full Address</Label>
                    <div 
                      onClick={() => openAddressPicker("deliveryAddress")}
                      className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white cursor-pointer hover:border-primary transition-colors text-sm"
                    >
                      <span className={form.deliveryAddress.fullAddress ? "text-foreground" : "text-muted-foreground"}>
                        {form.deliveryAddress.fullAddress || "Select destination..."}
                      </span>
                      <MapIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input 
                        placeholder="Chattogram" 
                        value={form.deliveryAddress.city} 
                        onChange={(e) => handleAddressChange("deliveryAddress", "city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Area</Label>
                      <Input 
                        placeholder="Agrabad" 
                        value={form.deliveryAddress.area} 
                        onChange={(e) => handleAddressChange("deliveryAddress", "area", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-semibold px-1">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm uppercase tracking-wider">Parcel Information</span>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.parcelType} onValueChange={(v) => handleFieldChange("parcelType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARCEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Size Class</Label>
                  <Select value={form.parcelSize} onValueChange={(v) => handleFieldChange("parcelSize", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARCEL_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Weight (kg)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={form.weight} 
                    onChange={(e) => handleFieldChange("weight", e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Payment & Schedule */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-semibold px-1">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="text-sm uppercase tracking-wider">Payment & Scheduling</span>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select value={form.paymentType} onValueChange={(v) => handleFieldChange("paymentType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COD">Cash on Delivery</SelectItem>
                      <SelectItem value="PREPAID">Prepaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>COD Amount (৳)</Label>
                  <Input 
                    type="number" 
                    disabled={form.paymentType === "PREPAID"} 
                    value={form.codAmount} 
                    onChange={(e) => handleFieldChange("codAmount", e.target.value)} 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Pickup Date
                  </Label>
                  <Input 
                    type="datetime-local" 
                    value={form.scheduledPickupAt} 
                    onChange={(e) => handleFieldChange("scheduledPickupAt", e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={resetForm} disabled={submitting}>
              Clear Form
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={!requiredFieldsFilled || submitting}
              className="px-8"
            >
              {submitting ? "Processing..." : "Confirm Booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {addressPickerOpen && (
        <AddressPickerDialog
          open={addressPickerOpen}
          onOpenChange={setAddressPickerOpen}
          title={addressPickerTarget === "pickupAddress" ? "Pick Up From" : "Deliver To"}
          initialLat={form[addressPickerTarget].lat}
          initialLng={form[addressPickerTarget].lng}
          instanceId={addressPickerInstanceId}
          onConfirm={(picked: PickedLocation) => {
            setForm((prev) => ({
              ...prev,
              [addressPickerTarget]: {
                ...prev[addressPickerTarget],
                ...picked,
              },
            }));
          }}
        />
      )}
    </>
  );
}