"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { createParcelBooking, type ParcelSummary } from "@/lib/api-client"

const PARCEL_TYPES = ["Documents", "Electronics", "Apparel", "Fragile", "Other"]
const PARCEL_SIZES = ["Small", "Medium", "Large", "Oversized"]

interface NewShipmentDialogProps {
  onCreated?: (parcel: ParcelSummary) => void
}

const defaultAddress = {
  label: "",
  fullAddress: "",
  city: "",
  area: "",
  postalCode: "",
}

const createDefaultForm = () => ({
  pickupAddress: { ...defaultAddress },
  deliveryAddress: { ...defaultAddress },
  parcelType: "Documents",
  parcelSize: "Small",
  paymentType: "COD" as "COD" | "PREPAID",
  codAmount: "0",
  weight: "",
  scheduledPickupAt: "",
})

type ShipmentFormState = ReturnType<typeof createDefaultForm>

export function NewShipmentDialog({ onCreated }: NewShipmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ShipmentFormState>(createDefaultForm)
  const [submitting, setSubmitting] = useState(false)
  const { tokens } = useAuth()
  const { toast } = useToast()

  const handleAddressChange = (
    target: "pickupAddress" | "deliveryAddress",
    field: keyof typeof defaultAddress,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [target]: {
        ...prev[target],
        [field]: value,
      },
    }))
  }

  const handleFieldChange = (field: keyof ShipmentFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => setForm(createDefaultForm())

  const requiredFieldsFilled =
    form.pickupAddress.fullAddress &&
    form.pickupAddress.city &&
    form.pickupAddress.area &&
    form.pickupAddress.postalCode &&
    form.deliveryAddress.fullAddress &&
    form.deliveryAddress.city &&
    form.deliveryAddress.area &&
    form.deliveryAddress.postalCode

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!tokens?.accessToken) {
      toast({ title: "Authentication required", description: "Please log in again.", variant: "destructive" })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        pickupAddress: form.pickupAddress,
        deliveryAddress: form.deliveryAddress,
        parcelType: form.parcelType,
        parcelSize: form.parcelSize,
        paymentType: form.paymentType,
        codAmount: form.paymentType === "COD" ? Number(form.codAmount || 0) : 0,
        weight: form.weight ? Number(form.weight) : undefined,
        scheduledPickupAt: form.scheduledPickupAt
          ? new Date(form.scheduledPickupAt).toISOString()
          : undefined,
      }
      const parcel = await createParcelBooking(tokens.accessToken, payload)
      toast({
        title: "Shipment created",
        description: `Tracking code ${parcel.trackingCode} is ready.`,
      })
      onCreated?.(parcel)
      resetForm()
      setOpen(false)
    } catch (error) {
      toast({
        title: "Failed to create shipment",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const codDisabled = form.paymentType === "PREPAID"

  return (
    <Dialog open={open} onOpenChange={(value) => !submitting && setOpen(value)}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create shipment</DialogTitle>
          <DialogDescription>Enter pickup and delivery details to schedule a courier.</DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Pickup</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pickup-label">Label</Label>
                <Input
                  id="pickup-label"
                  placeholder="Warehouse A"
                  value={form.pickupAddress.label}
                  onChange={(event) => handleAddressChange("pickupAddress", "label", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup-city">City</Label>
                <Input
                  id="pickup-city"
                  placeholder="Dhaka"
                  value={form.pickupAddress.city}
                  onChange={(event) => handleAddressChange("pickupAddress", "city", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pickup-address">Full address</Label>
                <Input
                  id="pickup-address"
                  placeholder="House 12, Road 1, Dhanmondi"
                  value={form.pickupAddress.fullAddress}
                  onChange={(event) => handleAddressChange("pickupAddress", "fullAddress", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup-area">Area</Label>
                <Input
                  id="pickup-area"
                  placeholder="Dhanmondi"
                  value={form.pickupAddress.area}
                  onChange={(event) => handleAddressChange("pickupAddress", "area", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup-postal">Postal code</Label>
                <Input
                  id="pickup-postal"
                  placeholder="1205"
                  value={form.pickupAddress.postalCode}
                  onChange={(event) => handleAddressChange("pickupAddress", "postalCode", event.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Delivery</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery-label">Label</Label>
                <Input
                  id="delivery-label"
                  placeholder="Customer"
                  value={form.deliveryAddress.label}
                  onChange={(event) => handleAddressChange("deliveryAddress", "label", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-city">City</Label>
                <Input
                  id="delivery-city"
                  placeholder="Chattogram"
                  value={form.deliveryAddress.city}
                  onChange={(event) => handleAddressChange("deliveryAddress", "city", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="delivery-address">Full address</Label>
                <Input
                  id="delivery-address"
                  placeholder="Apartment 3B, Agrabad"
                  value={form.deliveryAddress.fullAddress}
                  onChange={(event) => handleAddressChange("deliveryAddress", "fullAddress", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-area">Area</Label>
                <Input
                  id="delivery-area"
                  placeholder="Agrabad"
                  value={form.deliveryAddress.area}
                  onChange={(event) => handleAddressChange("deliveryAddress", "area", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-postal">Postal code</Label>
                <Input
                  id="delivery-postal"
                  placeholder="4000"
                  value={form.deliveryAddress.postalCode}
                  onChange={(event) => handleAddressChange("deliveryAddress", "postalCode", event.target.value)}
                  required
                />
              </div>
            </div>
          </section>

  <section className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Parcel details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Parcel type</Label>
                <Select value={form.parcelType} onValueChange={(value) => handleFieldChange("parcelType", value)}>
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
                <Select value={form.parcelSize} onValueChange={(value) => handleFieldChange("parcelSize", value)}>
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
                  onChange={(event) => handleFieldChange("weight", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment type</Label>
                <Select value={form.paymentType} onValueChange={(value) => handleFieldChange("paymentType", value)}>
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
                  onChange={(event) => handleFieldChange("codAmount", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup-time">Pickup schedule</Label>
                <Input
                  id="pickup-time"
                  type="datetime-local"
                  value={form.scheduledPickupAt}
                  onChange={(event) => handleFieldChange("scheduledPickupAt", event.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={resetForm} disabled={submitting}>
              Reset
            </Button>
            <Button type="submit" disabled={!requiredFieldsFilled || submitting}>
              {submitting ? "Creating..." : "Create shipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
