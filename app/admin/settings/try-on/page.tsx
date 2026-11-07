import { TryOnSettingsForm } from "@/components/admin/try-on-settings-form";
import { TryOnSummary } from "@/components/admin/try-on-summary";

export default function AdminTryOnSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Try-on AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure RunPod for Qwen Image Edit or Seedream 4.0 Edit. Keys stay on the server; customers never see them.
        </p>
      </div>
      <TryOnSummary />
      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight">Settings</h2>
        <TryOnSettingsForm />
      </section>
    </div>
  );
}
