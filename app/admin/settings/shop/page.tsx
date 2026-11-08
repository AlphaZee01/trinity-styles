import { ShopSettingsForm } from "@/components/admin/shop-settings-form";
import { getShopSettings } from "@/lib/shop-settings";

export default async function AdminShopSettingsPage() {
  const settings = await getShopSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Shop settings</h1>
        <p className="mt-2 text-muted-foreground">
          Delivery fee in cedis, customer contact, and the text shoppers see on product and policy pages.
        </p>
      </div>
      <ShopSettingsForm initial={settings} />
    </div>
  );
}
