"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { usePresence } from "@/hooks/use-presence";
import { Camera, Expand, ImagePlus, Loader2, Lock, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type { ProductWithVariants } from "@/lib/types";

type SessionState = {
  sessionId: string;
  status: string;
  resultImageUrl: string | null;
};

const GENERATING_MESSAGES = [
  "Applying the garment to your photo…",
  "This usually takes 10–30 seconds.",
  "RunPod is generating your look.",
  "Keep this screen open until it finishes.",
];

export function TryOnPanel({
  product,
  open,
  onOpenChange,
}: {
  product: ProductWithVariants;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [busy, setBusy] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [compare, setCompare] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [fullPicture, setFullPicture] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [garmentIndex, setGarmentIndex] = useState(0);
  const [consent, setConsent] = useState(false);
  const sheet = usePresence(open, 220);
  const garment = product.images[garmentIndex] ?? product.images[0];

  const ready = session?.status === "completed" && session.resultImageUrl;
  const generating = busy || session?.status === "processing";

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOn || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [cameraOn]);

  useEffect(() => {
    if (!generating) {
      setMessageIndex(0);
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const tick = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return () => window.clearInterval(tick);
    const id = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % GENERATING_MESSAGES.length);
    }, 3000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(tick);
    };
  }, [generating]);

  useEffect(() => {
    if (!sheet.present) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || generating) return;
      if (fullPicture) {
        setFullPicture(null);
        return;
      }
      onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet.present, onOpenChange, generating, fullPicture]);

  if (!sheet.present) return null;

  async function poll(sessionId: string, pollIntervalMs = 2000, maxPollAttempts = 45) {
    let lastError: string | undefined;
    for (let i = 0; i < maxPollAttempts; i += 1) {
      const response = await fetch(`/api/try-on/${sessionId}`);
      const json = (await response.json()) as { id?: string; status: string; resultImageUrl: string | null; error?: string };
      if (!response.ok) throw new Error(json.error ?? "Try-on failed");
      if (json.error) lastError = json.error;
      const next = {
        sessionId: json.id || sessionId,
        status: json.status,
        resultImageUrl: json.resultImageUrl,
        error: json.error,
      };
      setSession(next);
      if (json.status === "completed" || json.status === "failed") {
        return { ...next, error: json.error ?? lastError };
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new Error("Timed out waiting for the look");
  }

  function choosePhoto() {
    if (!consent) {
      toast.error("Agree to the privacy notice before adding a photo.");
      return;
    }
    inputRef.current?.click();
  }

  async function startCamera() {
    if (!consent) {
      toast.error("Agree to the privacy notice before using the camera.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("This browser cannot open the camera.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({ audio: false, video: { facingMode: "user" } })
        .catch(() => navigator.mediaDevices.getUserMedia({ audio: false, video: true }));
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      toast.error("Allow camera access to take a photo.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onFile(new File([blob], "try-on-photo.jpg", { type: "image/jpeg" }));
      stopCamera();
    }, "image/jpeg", 0.92);
  }

  function onFile(next: File | undefined) {
    if (!next) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setSession(null);
    setSaved(false);
    setNotice(null);
    setCompare(false);
  }

  async function startTryOn() {
    if (!file) {
      toast.error("Add a full-body photo first.");
      return;
    }
    setBusy(true);
    setNotice(null);
    setSaved(false);
    setSession({ sessionId: "", status: "processing", resultImageUrl: null });
    try {
      const body = new FormData();
      body.set("productId", product.id);
      body.set("personImage", file);
      if (garment) body.set("garmentImageUrl", garment);
      const response = await fetch("/api/try-on", { method: "POST", body });
      const json = (await response.json()) as {
        sessionId?: string;
        error?: string;
        pollIntervalMs?: number;
        maxPollAttempts?: number;
      };
      if (!response.ok) throw new Error(json.error ?? "Could not start try-on");
      if (!json.sessionId) throw new Error("Could not start try-on");
      setSession({ sessionId: json.sessionId, status: "processing", resultImageUrl: null });
      const result = await poll(
        json.sessionId,
        json.pollIntervalMs ?? 2000,
        json.maxPollAttempts ?? 45,
      );
      if (result.status === "failed") {
        throw new Error(result.error ?? "The model could not finish this look.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Try-on failed";
      setSession(null);
      setNotice(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLook() {
    if (!session?.sessionId) {
      toast.error("Generate a look before saving.");
      return;
    }
    const response = await fetch("/api/try-on/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.sessionId, productId: product.id }),
    });
    const json = await response.json();
    if (!response.ok) {
      toast.error(json.error ?? "Sign in to save looks.");
      return;
    }
    setSaved(true);
    toast.success("Saved to My Looks");
  }

  function reset() {
    stopCamera();
    if (preview) URL.revokeObjectURL(preview);
    setSession(null);
    setFile(null);
    setPreview(null);
    setSaved(false);
    setNotice(null);
    setCompare(false);
    setFullPicture(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const statusLine = ready
    ? saved
      ? "Saved to My Looks"
      : "Hold the photo to compare with yours"
    : generating
      ? `${elapsed}s · usually under a minute`
      : cameraOn
        ? "Stand back so the outfit is in frame"
        : preview
          ? "Ready to generate this look"
          : "A clear, full-body photo works best";

  const rightLabel = ready ? "Your look" : generating ? "Generating" : "Piece to try";

  return createPortal(
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close try-on"
        disabled={generating}
        data-closed={sheet.shown ? undefined : ""}
        className="side-scrim absolute inset-0 bg-foreground/40 disabled:cursor-default"
        onClick={() => {
          if (generating) return;
          stopCamera();
          onOpenChange(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="try-on-title"
        aria-busy={generating}
        data-closed={sheet.shown ? undefined : ""}
        className="try-on-modal relative z-10 flex max-h-[min(44rem,calc(100dvh-1.5rem))] w-full max-w-lg flex-col overscroll-contain rounded-3xl border border-border bg-background px-4 pt-3 pb-4 shadow-card"
      >
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          disabled={generating}
          className="press grid size-11 place-items-center disabled:opacity-40"
          onClick={() => {
            if (generating) return;
            stopCamera();
            onOpenChange(false);
          }}
        >
          <X className="size-5" />
        </button>
        <div className="text-center">
          <h2 id="try-on-title" className="font-heading text-2xl tracking-tight">
            Virtual Try-On
          </h2>
          <p className="truncate text-sm text-muted-foreground">{product.name}</p>
        </div>
        <span />
      </div>

      <ol className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] tracking-wide text-muted-foreground uppercase">
        {[
          { label: "Photo", done: Boolean(preview || generating || ready) },
          { label: "Generate", done: Boolean(generating || ready) },
          { label: "Save", done: Boolean(ready) },
        ].map((step, index) => (
          <li key={step.label} className={step.done ? "text-foreground" : ""}>
            <span className={`mb-1 block h-0.5 rounded-full ${step.done ? "bg-primary" : "bg-border"}`} />
            {index + 1} · {step.label}
          </li>
        ))}
      </ol>

      {notice ? (
        <p role="alert" className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {notice}
        </p>
      ) : null}

      <div className={`mt-4 grid gap-3 ${cameraOn || generating || ready ? "grid-cols-1" : "grid-cols-2"}`}>
        {cameraOn ? (
          <figure className="glass relative h-64 overflow-hidden rounded-2xl bg-muted">
            <span className="glass absolute top-2 left-2 z-10 rounded-full px-2 py-1 text-[10px] tracking-wide uppercase">
              Camera
            </span>
            <video ref={videoRef} className="size-full object-cover" autoPlay muted playsInline />
          </figure>
        ) : generating ? (
          <figure className="glass relative h-64 overflow-hidden rounded-2xl bg-muted">
            {garment ? <Image src={garment} alt="" fill sizes="100vw" className="object-cover opacity-25" /> : null}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm text-foreground" aria-live="polite">
                {GENERATING_MESSAGES[messageIndex]}
              </p>
              <div
                className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={60}
                aria-valuenow={Math.min(elapsed, 60)}
                aria-label="Generating your look"
              >
                <span
                  className="block h-full origin-left bg-primary"
                  style={{ transform: `scaleX(${Math.min(0.12 + elapsed / 70, 0.92)})` }}
                />
              </div>
            </div>
          </figure>
        ) : ready ? (
          <figure
            className="glass relative h-64 overflow-hidden rounded-2xl bg-muted select-none"
            onPointerDown={() => preview && setCompare(true)}
            onPointerUp={() => setCompare(false)}
            onPointerLeave={() => setCompare(false)}
            onPointerCancel={() => setCompare(false)}
          >
            <span className="glass absolute top-2 left-2 z-10 rounded-full px-2 py-1 text-[10px] tracking-wide uppercase">
              {compare ? "Your photo" : "Your look"}
            </span>
            <img
              src={compare && preview ? preview : (session.resultImageUrl ?? "")}
              alt={compare ? "Your photo" : "Try-on result"}
              className="photo-in size-full object-cover"
              draggable={false}
            />
            {session.resultImageUrl ? (
              <button
                type="button"
                aria-label="View full picture"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setFullPicture(compare && preview ? preview : session.resultImageUrl)}
                className="press glass absolute right-2 bottom-2 z-10 grid size-9 place-items-center rounded-full"
              >
                <Expand className="size-4" strokeWidth={1.75} />
              </button>
            ) : null}
          </figure>
        ) : (
          <>
            <figure className="glass relative h-52 overflow-hidden rounded-2xl bg-muted">
              <span className="glass absolute top-2 left-2 z-10 rounded-full px-2 py-1 text-[10px] tracking-wide uppercase">
                Your photo
              </span>
              {preview ? (
                <>
                  <img src={preview} alt="Your photo" className="photo-in size-full object-cover" />
                  <button
                    type="button"
                    aria-label="View full picture"
                    onClick={() => setFullPicture(preview)}
                    className="press glass absolute right-2 bottom-2 z-10 grid size-9 place-items-center rounded-full"
                  >
                    <Expand className="size-4" strokeWidth={1.75} />
                  </button>
                </>
              ) : (
                <button type="button" className="press grid size-full place-items-center" onClick={choosePhoto}>
                  <span className="flex flex-col items-center px-3 text-center">
                    <ImagePlus className="size-5 text-primary" strokeWidth={1.75} />
                    <span className="mt-2 text-sm">Add a photo</span>
                    <span className="mt-1 text-xs text-muted-foreground">Full body, even light</span>
                  </span>
                </button>
              )}
            </figure>
            <figure className="glass relative h-52 overflow-hidden rounded-2xl bg-muted">
              <span className="glass absolute top-2 left-2 z-10 rounded-full px-2 py-1 text-[10px] tracking-wide uppercase">
                {rightLabel}
              </span>
              {garment ? <Image src={garment} alt="" fill sizes="50vw" className="object-cover" /> : null}
              {!preview && garment ? (
                <button
                  type="button"
                  aria-label="View full picture"
                  onClick={() => setFullPicture(garment)}
                  className="press glass absolute right-2 bottom-2 z-10 grid size-9 place-items-center rounded-full"
                >
                  <Expand className="size-4" strokeWidth={1.75} />
                </button>
              ) : null}
            </figure>
          </>
        )}
      </div>

      {product.images.length > 1 ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Garment photo for try-on</p>
          <div role="radiogroup" aria-label="Garment photo" className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {product.images.map((src, itemIndex) => (
              <button
                key={src}
                type="button"
                role="radio"
                aria-checked={src === garment}
                aria-label={`Garment photo ${itemIndex + 1}`}
                disabled={generating}
                onClick={() => {
                  setGarmentIndex(itemIndex);
                  setSession(null);
                  setSaved(false);
                  setNotice(null);
                }}
                className={`press relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-muted disabled:opacity-50 ${
                  src === garment ? "ring-2 ring-foreground" : "opacity-70"
                }`}
              >
                <Image src={src} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="glass mt-4 flex items-center gap-3 rounded-2xl p-3">
        {garment ? (
          <Image src={garment} alt="" width={48} height={48} className="size-12 rounded-xl object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {statusLine}
          </p>
        </div>
        {generating ? (
          <Sparkles className="size-5 shrink-0 text-primary motion-safe:animate-pulse" aria-hidden="true" />
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0])}
      />

      {!ready && !consent ? (
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>
            I agree to use my photo only for this try-on.{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy
            </Link>
          </span>
        </label>
      ) : null}

      {!ready ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {cameraOn && !preview ? (
            <>
              <button type="button" onClick={capturePhoto} className="press h-12 rounded-full bg-primary text-sm text-primary-foreground">
                Capture
              </button>
              <button type="button" onClick={stopCamera} className="press glass h-12 rounded-full text-sm">
                Cancel
              </button>
            </>
          ) : preview ? (
            <>
              <button
                type="button"
                disabled={generating}
                onClick={startTryOn}
                className="press col-span-2 h-12 rounded-full bg-primary text-sm text-primary-foreground disabled:opacity-50"
              >
                {generating ? "Generating…" : "Generate look"}
              </button>
              <button type="button" disabled={generating} onClick={choosePhoto} className="press glass h-12 rounded-full text-sm disabled:opacity-50">
                Change photo
              </button>
              <button type="button" disabled={generating} onClick={reset} className="press glass h-12 rounded-full text-sm disabled:opacity-50">
                Start over
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={choosePhoto} className="press flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm text-primary-foreground">
                <ImagePlus className="size-4" strokeWidth={1.75} />
                Add photo
              </button>
              <button type="button" onClick={startCamera} className="press glass flex h-12 items-center justify-center gap-2 rounded-full text-sm">
                <Camera className="size-4" strokeWidth={1.75} />
                Take photo
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={saveLook} disabled={saved} className="press h-12 rounded-full bg-foreground text-background disabled:opacity-60">
            {saved ? "Saved" : "Save look"}
          </button>
          <button type="button" onClick={reset} className="press h-12 rounded-full border border-primary text-primary">
            Try another
          </button>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        AI try-on is a preview only — fit and colour may differ from the real garment.
      </p>
      <p className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3" />
        Your photo is uploaded privately for this session
      </p>
      </div>
    </div>
      {fullPicture ? (
        <div role="dialog" aria-modal="true" aria-label="Full picture" className="fixed inset-0 z-[70] flex flex-col bg-background">
          <div className="flex justify-end px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <button type="button" aria-label="Close full picture" className="press grid size-11 place-items-center" onClick={() => setFullPicture(null)}>
              <X className="size-5" />
            </button>
          </div>
          <img src={fullPicture} alt="Full picture" className="min-h-0 flex-1 object-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" />
        </div>
      ) : null}
    </>,
    document.body,
  );
}
