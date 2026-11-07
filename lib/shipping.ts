import type { Profile, ShippingAddress } from "@/lib/types";

export const emptyShippingAddress: ShippingAddress = {
  full_name: "",
  phone: "",
  city: "",
  region: "",
  address_line: "",
  notes: "",
};

export function shippingFromProfile(profile: Profile | null): ShippingAddress {
  const saved = profile?.shipping_address;
  return {
    full_name: saved?.full_name?.trim() || profile?.full_name?.trim() || "",
    phone: saved?.phone?.trim() || profile?.phone?.trim() || "",
    city: saved?.city?.trim() || "",
    region: saved?.region?.trim() || "",
    address_line: saved?.address_line?.trim() || "",
    notes: saved?.notes?.trim() || "",
  };
}
