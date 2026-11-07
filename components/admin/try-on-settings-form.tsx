"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SettingsResponse = {
  runpodEndpointMode: "qwen_image_edit" | "seedream_v4_edit" | "custom";
  effectivePayloadMode: string;
  runpodSubmitJobUrl: string | null;
  runpodCheckStatusUrl: string | null;
  runpodEndpointId: string | null;
  runpodTimeoutMs: number;
  runpodMaxRetries: number;
  runpodPollIntervalMs: number;
  tryOnPrompt: string | null;
  tryOnNegativePrompt: string | null;
  useStubWhenUnconfigured: boolean;
  apiKey: { configured: boolean; last4: string | null };
  configured: boolean;
};

const fieldClass = "h-11 rounded-xl bg-background px-3 text-base";

const payloadHelp: Record<string, string> = {
  qwen_image_edit: "Sends input.image, prompt, negative_prompt, and garment_image (Qwen Image Edit).",
  seedream_v4_edit: "Sends input.images [person, garment], prompt, negative_prompt, plus product_details (Seedream 4.0 Edit).",
  custom: "Payload is inferred from the submit URL (qwen-image-edit vs seedream-v4-edit).",
};

export function TryOnSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmSure, setConfirmSure] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState<SettingsResponse["runpodEndpointMode"]>("qwen_image_edit");
  const [submitUrl, setSubmitUrl] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [timeoutMs, setTimeoutMs] = useState("30000");
  const [maxRetries, setMaxRetries] = useState("3");
  const [pollMs, setPollMs] = useState("2000");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [useStub, setUseStub] = useState(true);
  const [workerOpen, setWorkerOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/try-on-settings");
        const json = (await response.json()) as SettingsResponse & { error?: string };
        if (!response.ok) throw new Error(json.error ?? "Could not load settings");
        setSettings(json);
        setMode(json.runpodEndpointMode);
        setSubmitUrl(json.runpodSubmitJobUrl ?? "");
        setStatusUrl(json.runpodCheckStatusUrl ?? "");
        setEndpointId(json.runpodEndpointId ?? "");
        setTimeoutMs(String(json.runpodTimeoutMs));
        setMaxRetries(String(json.runpodMaxRetries));
        setPollMs(String(json.runpodPollIntervalMs));
        setPrompt(json.tryOnPrompt ?? "");
        setNegativePrompt(json.tryOnNegativePrompt ?? "");
        setUseStub(json.useStubWhenUnconfigured);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function applyPreset(preset: "qwen_image_edit" | "seedream_v4_edit") {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/try-on-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applyPreset: preset }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not apply preset");
      toast.success("Preset applied");
      setMode(preset);
      if (preset === "qwen_image_edit") {
        setSubmitUrl("https://api.runpod.ai/v2/qwen-image-edit/run");
        setStatusUrl("https://api.runpod.ai/v2/qwen-image-edit/status/{jobId}");
      } else {
        setSubmitUrl("https://api.runpod.ai/v2/seedream-v4-edit/run");
        setStatusUrl("https://api.runpod.ai/v2/seedream-v4-edit/status/{jobId}");
      }
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              runpodEndpointMode: preset,
              effectivePayloadMode: preset,
              configured: json.configured,
              apiKey: json.apiKey,
            }
          : prev,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply preset");
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/try-on-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runpodApiKey: apiKey.trim() || undefined,
          runpodEndpointMode: mode,
          runpodSubmitJobUrl: submitUrl,
          runpodCheckStatusUrl: statusUrl,
          runpodEndpointId: endpointId,
          runpodTimeoutMs: Number(timeoutMs),
          runpodMaxRetries: Number(maxRetries),
          runpodPollIntervalMs: Number(pollMs),
          tryOnPrompt: prompt.trim() || null,
          tryOnNegativePrompt: negativePrompt.trim() || null,
          useStubWhenUnconfigured: useStub,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not save");
      setApiKey("");
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              configured: json.configured,
              apiKey: json.apiKey,
              effectivePayloadMode: json.effectivePayloadMode,
            }
          : prev,
      );
      toast.success("Try-on settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function removeKey() {
    setRemovingKey(true);
    try {
      const response = await fetch("/api/admin/try-on-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearApiKey: true }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not remove the key");
      setApiKey("");
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              configured: json.configured,
              apiKey: json.apiKey,
              effectivePayloadMode: json.effectivePayloadMode,
            }
          : prev,
      );
      setConfirmRemove(false);
      setConfirmSure(false);
      toast.success("API key removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the key");
    } finally {
      setRemovingKey(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const response = await fetch("/api/admin/try-on-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runpodApiKey: apiKey.trim() || undefined,
          runpodSubmitJobUrl: submitUrl,
          runpodEndpointMode: mode,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Test failed");
      toast.success(json.message ?? "Connection OK");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading try-on settings…</p>;
  }

  const effective = settings?.effectivePayloadMode ?? mode;
  const statusLabel = settings?.configured
    ? "Configured"
    : useStub
      ? "Stub mode (garment preview)"
      : "Not configured";
  const workerLabel =
    mode === "qwen_image_edit" ? "Qwen Image Edit" : mode === "seedream_v4_edit" ? "Seedream 4.0 Edit" : "Custom URLs";

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4">
        <p className="text-sm text-muted-foreground">Status</p>
        <p className="font-heading text-xl">{statusLabel}</p>
        {settings?.apiKey.configured ? (
          <p className="mt-1 text-sm text-muted-foreground">API key ending in …{settings.apiKey.last4}</p>
        ) : null}
        <p className="mt-3 text-sm text-muted-foreground">
          {payloadHelp[effective] ?? payloadHelp.custom}
        </p>
      </div>

      <div className="glass rounded-2xl p-4">
        <button
          type="button"
          className="press flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={workerOpen}
          onClick={() => setWorkerOpen((open) => !open)}
        >
          <span className="min-w-0">
            <span className="block text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Worker mode</span>
            <span className="mt-1 block truncate font-heading text-xl tracking-tight">{workerLabel}</span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${workerOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {workerOpen ? (
        <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-11 rounded-full" disabled={saving} onClick={() => applyPreset("qwen_image_edit")}>
            Use Qwen preset
          </Button>
          <Button type="button" variant="outline" className="h-11 rounded-full" disabled={saving} onClick={() => applyPreset("seedream_v4_edit")}>
            Use Seedream 4.0 preset
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tryon-mode">Worker</Label>
          <select
            id="tryon-mode"
            className={`${fieldClass} w-full`}
            value={mode}
            onChange={(event) => setMode(event.target.value as SettingsResponse["runpodEndpointMode"])}
          >
            <option value="qwen_image_edit">Qwen Image Edit</option>
            <option value="seedream_v4_edit">Seedream 4.0 Edit</option>
            <option value="custom">Custom URLs</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="tryon-key">RunPod API key</Label>
            {settings?.apiKey.configured ? (
              <button
                type="button"
                className="press text-sm text-rose disabled:opacity-50"
                disabled={removingKey}
                onClick={() => setConfirmRemove(true)}
              >
                {removingKey ? "Removing…" : "Remove key"}
              </button>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {settings?.apiKey.configured
              ? `Current key ends in …${settings.apiKey.last4}. Paste a new key and save to replace it.`
              : "No key stored. Paste one and save."}
          </p>
          <Input
            id="tryon-key"
            type="password"
            autoComplete="off"
            className={fieldClass}
            placeholder={settings?.apiKey.configured ? "Leave blank to keep current key" : "Paste RunPod API key"}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tryon-endpoint">Endpoint ID (optional)</Label>
          <Input id="tryon-endpoint" className={fieldClass} value={endpointId} onChange={(e) => setEndpointId(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tryon-submit">Submit job URL</Label>
          <Input id="tryon-submit" className={fieldClass} value={submitUrl} onChange={(e) => setSubmitUrl(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tryon-status">Check status URL</Label>
          <Input
            id="tryon-status"
            className={fieldClass}
            value={statusUrl}
            onChange={(e) => setStatusUrl(e.target.value)}
            placeholder="https://api.runpod.ai/v2/…/status/{jobId}"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tryon-timeout">Timeout (ms)</Label>
            <Input id="tryon-timeout" className={fieldClass} inputMode="numeric" value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tryon-retries">Max retries</Label>
            <Input id="tryon-retries" className={fieldClass} inputMode="numeric" value={maxRetries} onChange={(e) => setMaxRetries(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tryon-poll">Poll interval (ms)</Label>
            <Input id="tryon-poll" className={fieldClass} inputMode="numeric" value={pollMs} onChange={(e) => setPollMs(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tryon-prompt">Prompt override (optional)</Label>
          <p className="text-sm text-muted-foreground">
            Leave this empty to name the product category in the prompt, including categories added later. Use {"{piece}"} in a custom prompt for that name.
          </p>
          <Textarea id="tryon-prompt" className="min-h-24 rounded-xl bg-background px-3 py-2 text-base" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tryon-negative">Negative prompt override (optional)</Label>
          <Textarea id="tryon-negative" className="min-h-20 rounded-xl bg-background px-3 py-2 text-base" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={useStub} onChange={(e) => setUseStub(e.target.checked)} className="size-4 rounded border-border" />
          Use garment stub when RunPod is not configured (dev-friendly)
        </label>
        </div>
        ) : null}
      </div>

      <Dialog open={confirmRemove} onOpenChange={(next) => { if (!next && !removingKey) setConfirmRemove(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove the RunPod API key?</DialogTitle>
            <DialogDescription>
              Try-on stops using the key ending in …{settings?.apiKey.last4}. You can paste a new one afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="press h-11 rounded-full border border-foreground px-4 text-sm disabled:opacity-50"
              disabled={removingKey}
              onClick={() => setConfirmRemove(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="press h-11 rounded-full bg-destructive px-4 text-sm text-white"
              onClick={() => {
                setConfirmRemove(false);
                setConfirmSure(true);
              }}
            >
              Remove key
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSure} onOpenChange={(next) => { if (!next && !removingKey) setConfirmSure(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete?</DialogTitle>
            <DialogDescription>Virtual try-on will not work without the key.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="press h-11 rounded-full border border-foreground px-4 text-sm disabled:opacity-50"
              disabled={removingKey}
              onClick={() => setConfirmSure(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="press h-11 rounded-full bg-destructive px-4 text-sm text-white disabled:opacity-50"
              disabled={removingKey}
              onClick={() => void removeKey()}
            >
              {removingKey ? "Removing…" : "Delete key"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" className="h-12 rounded-full text-base" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        <Button type="button" variant="outline" className="h-12 rounded-full text-base" disabled={testing} onClick={() => void testConnection()}>
          {testing ? "Testing…" : "Test connection"}
        </Button>
      </div>
    </div>
  );
}
