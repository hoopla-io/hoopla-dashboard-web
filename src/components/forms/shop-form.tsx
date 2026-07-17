import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/pickers/searchable-select";
import type { CreateShopRequest } from "@/lib/api/schemas/shops";

export interface ShopFormInitialValues {
  partner_id?: number;
  name?: string;
  vendor_terminal_id?: string;
  vendor_login?: string;
  vendor_organization_id?: string;
  location_lat?: number;
  location_long?: number;
  use_own_legal?: boolean;
  tin_type?: string;
  tin_num?: string;
  tin_percent?: number;
  always_open?: boolean;
  restock_time?: string;
}

interface ShopFormProps {
  /** Fixed partner id — when set, no partner picker is shown (partner-scoped usage). */
  partnerId?: number;
  /** Required when `partnerId` is omitted, to populate the partner picker. */
  partnerOptions?: { id: number; name: string }[];
  initialValues?: ShopFormInitialValues;
  isEditing: boolean;
  isSubmitting: boolean;
  onSubmit: (data: CreateShopRequest, file?: File) => void;
  onCancel: () => void;
}

export function ShopForm({
  partnerId,
  partnerOptions = [],
  initialValues,
  isEditing,
  isSubmitting,
  onSubmit,
  onCancel,
}: ShopFormProps) {
  const [formData, setFormData] = useState({
    partner_id: partnerId ?? initialValues?.partner_id ?? 0,
    name: initialValues?.name ?? "",
    vendor_terminal_id: initialValues?.vendor_terminal_id ?? "",
    vendor_login: initialValues?.vendor_login ?? "",
    vendor_password: "",
    vendor_organization_id: initialValues?.vendor_organization_id ?? "",
    location_lat: initialValues?.location_lat ?? 0,
    location_long: initialValues?.location_long ?? 0,
    use_own_legal: initialValues?.use_own_legal ?? false,
    tin_type: initialValues?.tin_type ?? "",
    tin_num: initialValues?.tin_num ?? "",
    tin_percent: initialValues?.tin_percent ?? 0,
    always_open: initialValues?.always_open ?? false,
    restock_time: initialValues?.restock_time ?? "",
  });
  const [file, setFile] = useState<File | undefined>(undefined);
  const [showVendorPassword, setShowVendorPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Shop name is required");
      return;
    }
    if (
      formData.use_own_legal &&
      (!formData.tin_type ||
        !formData.tin_num.trim() ||
        formData.tin_percent == null ||
        Number.isNaN(formData.tin_percent) ||
        formData.tin_percent < 0 ||
        formData.tin_percent > 100)
    ) {
      toast.error("TIN type, number, and percent are all required when billing under the shop's own legal entity");
      return;
    }
    const { tin_type, tin_num, tin_percent, ...rest } = formData;
    const data: CreateShopRequest = {
      ...rest,
      partner_id: partnerId ?? formData.partner_id,
      // Only send TIN fields when the shop actually bills under its own legal
      // entity — otherwise it inherits the partner's TIN and these are moot.
      ...(formData.use_own_legal
        ? { tin_type: tin_type as "tin" | "pinfl", tin_num, tin_percent }
        : {}),
    };
    onSubmit(data, file);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        {partnerId === undefined && (
          <div className="space-y-1.5">
            <Label>Partner</Label>
            <SearchableSelect
              value={formData.partner_id ? String(formData.partner_id) : ""}
              onValueChange={(v) => setFormData({ ...formData, partner_id: Number(v) })}
              placeholder="Select partner"
              searchPlaceholder="Search partners…"
              items={partnerOptions.map((p) => ({ value: String(p.id), label: p.name }))}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="shop-form-name">Name</Label>
          <Input
            id="shop-form-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Shop name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-form-terminal">Vendor terminal ID</Label>
          <Input
            id="shop-form-terminal"
            value={formData.vendor_terminal_id}
            onChange={(e) => setFormData({ ...formData, vendor_terminal_id: e.target.value })}
            placeholder="Terminal ID"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-form-login">Vendor login</Label>
          <Input
            id="shop-form-login"
            value={formData.vendor_login}
            onChange={(e) => setFormData({ ...formData, vendor_login: e.target.value })}
            placeholder="Cassa login"
            maxLength={255}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-form-password">
            {isEditing ? "Vendor password (leave blank to keep)" : "Vendor password"}
          </Label>
          <div className="relative">
            <Input
              id="shop-form-password"
              type={showVendorPassword ? "text" : "password"}
              value={formData.vendor_password}
              onChange={(e) => setFormData({ ...formData, vendor_password: e.target.value })}
              placeholder={isEditing ? "••••••••" : "Cassa password"}
              minLength={4}
              maxLength={255}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowVendorPassword((v) => !v)}
            >
              {showVendorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-form-org">Vendor organization ID</Label>
          <Input
            id="shop-form-org"
            value={formData.vendor_organization_id}
            onChange={(e) => setFormData({ ...formData, vendor_organization_id: e.target.value })}
            placeholder="Organization ID"
            maxLength={255}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="shop-form-lat">Latitude</Label>
            <Input
              id="shop-form-lat"
              type="number"
              step="any"
              value={formData.location_lat === 0 ? "" : formData.location_lat}
              onChange={(e) => setFormData({ ...formData, location_lat: Number(e.target.value) })}
              placeholder="Latitude"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shop-form-long">Longitude</Label>
            <Input
              id="shop-form-long"
              type="number"
              step="any"
              value={formData.location_long === 0 ? "" : formData.location_long}
              onChange={(e) => setFormData({ ...formData, location_long: Number(e.target.value) })}
              placeholder="Longitude"
            />
          </div>
        </div>
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-medium text-foreground">Billing</h4>
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <Label htmlFor="shop-form-use-own-legal">Use own legal entity</Label>
              <p className="text-xs text-muted-foreground">
                Bill this shop under its own TIN instead of the partner&apos;s.
              </p>
            </div>
            <Switch
              id="shop-form-use-own-legal"
              checked={formData.use_own_legal}
              onCheckedChange={(checked) => setFormData({ ...formData, use_own_legal: checked })}
            />
          </div>
          {formData.use_own_legal ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="shop-form-tin-type">TIN type</Label>
                <Select
                  value={formData.tin_type}
                  onValueChange={(val) => setFormData({ ...formData, tin_type: val })}
                >
                  <SelectTrigger id="shop-form-tin-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tin">TIN</SelectItem>
                    <SelectItem value="pinfl">PINFL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shop-form-tin-num">TIN number</Label>
                <Input
                  id="shop-form-tin-num"
                  value={formData.tin_num}
                  onChange={(e) => setFormData({ ...formData, tin_num: e.target.value })}
                  placeholder="TIN / PINFL number"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shop-form-tin-percent">TIN percent</Label>
                <Input
                  id="shop-form-tin-percent"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.tin_percent === 0 ? "" : formData.tin_percent}
                  onChange={(e) => setFormData({ ...formData, tin_percent: Number(e.target.value) })}
                  placeholder="0–100"
                />
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              Inherits billing from the partner.
            </p>
          )}
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <Label htmlFor="shop-form-always-open">Always open</Label>
              <p className="text-xs text-muted-foreground">
                Overrides working hours — the shop never shows as closed.
              </p>
            </div>
            <Switch
              id="shop-form-always-open"
              checked={formData.always_open}
              onCheckedChange={(checked) => setFormData({ ...formData, always_open: checked })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shop-form-restock-time">Restock time</Label>
            <Input
              id="shop-form-restock-time"
              type="time"
              value={formData.restock_time}
              onChange={(e) => setFormData({ ...formData, restock_time: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Optional daily time the shop restocks. Leave blank to clear.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shop-form-file">Image</Label>
          <Input
            id="shop-form-file"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create shop"}
        </Button>
      </DialogFooter>
    </form>
  );
}
