"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OfferPrice } from "@/components/product/offer-price";
import { categoryOptions, colors as defaultColors, mergeCategoryNames, sizes as defaultSizes } from "@/lib/demo-catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { ProductGender, ProductWithVariants } from "@/lib/types";

type VariantDraft = {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  price_override: string;
};

type ProductDraft = {
  name: string;
  description: string;
  category: string;
  gender: ProductGender;
  base_price: string;
  images: string;
  is_active: boolean;
  variants: VariantDraft[];
};

const fieldClass = "h-11 rounded-xl bg-background px-3 text-base";

function toDraft(product?: ProductWithVariants): ProductDraft {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? categoryOptions()[0],
    gender: product?.gender ?? "unisex",
    base_price: product ? String(product.base_price) : "",
    images: product?.images.join("\n") ?? "",
    is_active: product?.is_active ?? true,
    variants:
      product?.product_variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        stock: String(variant.stock),
        price_override: variant.price_override == null ? "" : String(variant.price_override),
      })) ?? [{ id: undefined, size: "M", color: "Ivory", sku: "", stock: "0", price_override: "" }],
  };
}

function imageUrls(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function CategoryField({
  value,
  options,
  onChange,
  onAdd,
  onDelete,
  addLabel = "Add category",
  placeholder = "Category name",
  inputLabel = "New category",
  noun = "category",
  inUse = "This category is still on a product.",
  id,
}: {
  value: string;
  options: string[];
  onChange: (category: string) => void;
  onAdd: (category: string) => Promise<void> | void;
  onDelete: (category: string) => Promise<void> | void;
  addLabel?: string;
  placeholder?: string;
  inputLabel?: string;
  noun?: string;
  inUse?: string;
  id?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const confirmName = useRef("");
  if (pendingDelete) confirmName.current = pendingDelete;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  async function addCategory() {
    const next = name.trim();
    if (!next) return;
    await onAdd(next);
    setName("");
    setAdding(false);
  }

  return (
    <div ref={rootRef} className="relative z-30">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${fieldClass} flex w-full items-center justify-between border border-input text-left`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{value}</span>
        <span className="text-muted-foreground" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-background p-2 shadow-[var(--shadow-card)]">
          <ul role="listbox" className="max-h-52 overflow-y-auto">
            {options.map((category) => (
              <li key={category} className="flex items-center gap-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={category === value}
                  className={`press flex h-11 min-w-0 flex-1 items-center rounded-xl px-3 text-left text-sm ${category === value ? "bg-primary/10 text-primary" : ""}`}
                  onClick={() => {
                    onChange(category);
                    setOpen(false);
                    setAdding(false);
                  }}
                >
                  <span className="truncate">{category}</span>
                </button>
                <button
                  type="button"
                  className="press h-11 shrink-0 px-3 text-sm text-destructive"
                  onClick={() => setPendingDelete(category)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {adding ? (
            <div className="mt-2 flex gap-2 border-t border-border pt-2">
              <Input
                value={name}
                aria-label={inputLabel}
                placeholder={placeholder}
                className={fieldClass}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCategory();
                  }
                }}
              />
              <button type="button" className="press h-11 shrink-0 rounded-full bg-primary px-4 text-sm text-primary-foreground" onClick={addCategory}>
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="press mt-1 flex h-11 w-full items-center rounded-xl px-3 text-left text-sm text-primary"
              onClick={() => setAdding(true)}
            >
              {addLabel}
            </button>
          )}
        </div>
      ) : null}
      <Dialog open={pendingDelete !== null} onOpenChange={(next) => { if (!next) setPendingDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {confirmName.current}?</DialogTitle>
            <DialogDescription>This removes the {noun}. {inUse}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button type="button" className="press h-11 rounded-full border border-foreground px-4 text-sm" onClick={() => setPendingDelete(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="press h-11 rounded-full bg-destructive px-4 text-sm text-white"
              onClick={() => {
                const category = pendingDelete;
                setPendingDelete(null);
                if (category) void onDelete(category);
              }}
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProductForm({
  product,
  categories = categoryOptions(),
  sizes = defaultSizes,
  colors = defaultColors,
}: {
  product?: ProductWithVariants;
  categories?: string[];
  sizes?: string[];
  colors?: string[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const usedSizes = product?.product_variants.map((variant) => variant.size) ?? [];
  const usedColors = product?.product_variants.map((variant) => variant.color) ?? [];
  const startingCategories = mergeCategoryNames(categories, [product?.category ?? ""]);
  const startingSizes = mergeCategoryNames(sizes, usedSizes);
  const startingColors = mergeCategoryNames(colors, usedColors);
  const [draft, setDraft] = useState<ProductDraft>(() => {
    const next = toDraft(product);
    return { ...next, category: product?.category || startingCategories[0] || next.category };
  });
  const [categoryList, setCategoryList] = useState(startingCategories);
  const [sizeList, setSizeList] = useState(startingSizes);
  const [colorList, setColorList] = useState(startingColors);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photos = imageUrls(draft.images);

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  }

  function setPhotos(urls: string[]) {
    setDraft((current) => ({ ...current, images: urls.join("\n") }));
  }

  async function saveCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase.from("categories").insert({ name: trimmed });
      if (error && error.code !== "23505") {
        toast.error(error.message);
        return;
      }
    }
    setCategoryList((current) => mergeCategoryNames(current, [trimmed]));
    setDraft((current) => ({ ...current, category: trimmed }));
    toast.success("Category saved");
  }

  async function deleteCategory(name: string) {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", name);
      if (count) {
        toast.error("This category is still on a product.");
        return;
      }
      const { error } = await supabase.from("categories").delete().eq("name", name);
      if (error) {
        toast.error(error.message.includes("still on a product") ? "This category is still on a product." : error.message);
        return;
      }
    }
    const remaining = categoryList.filter((item) => item.toLowerCase() !== name.toLowerCase());
    setCategoryList(remaining);
    setDraft((current) => (current.category.toLowerCase() === name.toLowerCase() ? { ...current, category: remaining[0] ?? "" } : current));
    toast.success("Category deleted");
  }

  async function saveNamedOption(table: "sizes" | "colors", name: string, onSaved: (name: string) => void) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase.from(table).insert({ name: trimmed });
      if (error && error.code !== "23505") {
        toast.error(error.message);
        return;
      }
    }
    onSaved(trimmed);
    toast.success(table === "colors" ? "Colour saved" : "Size saved");
  }

  async function deleteNamedOption(
    table: "sizes" | "colors",
    column: "size" | "color",
    name: string,
    list: string[],
    setList: (names: string[]) => void,
  ) {
    const inUse = table === "colors" ? "This colour is still on a product." : "This size is still on a product.";
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { count } = await supabase.from("product_variants").select("id", { count: "exact", head: true }).eq(column, name);
      if (count) {
        toast.error(inUse);
        return;
      }
      const { error } = await supabase.from(table).delete().eq("name", name);
      if (error) {
        toast.error(error.message.includes("still on a product") ? inUse : error.message);
        return;
      }
    }
    const remaining = list.filter((item) => item.toLowerCase() !== name.toLowerCase());
    setList(remaining);
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant[column].toLowerCase() === name.toLowerCase()
          ? { ...variant, [column]: remaining[0] ?? "" }
          : variant,
      ),
    }));
    toast.success(table === "colors" ? "Colour deleted" : "Size deleted");
  }

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          const response = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: product?.id ?? null,
              name: draft.name,
              slug: product?.slug || slugify(draft.name),
              description: draft.description,
              category: draft.category,
              gender: draft.gender,
              base_price: Number(draft.base_price),
              images: photos,
              is_active: draft.is_active,
              variants: draft.variants.map((variant) => ({
                id: variant.id,
                size: variant.size,
                color: variant.color,
                sku: variant.sku,
                stock: Number(variant.stock),
                price_override: variant.price_override ? Number(variant.price_override) : null,
              })),
            }),
          });
          const json = await response.json();
          if (!response.ok) throw new Error(json.error ?? "Could not save");
          toast.success("Product saved");
          router.push("/admin/products");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not save");
        } finally {
          setPending(false);
        }
      }}
    >
      <section className="glass space-y-4 rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">Photos</h2>
          <button
            type="button"
            className="press inline-flex h-11 items-center rounded-full border border-foreground px-4 text-sm disabled:opacity-50"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Upload photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setUploading(true);
              try {
                const body = new FormData();
                body.set("file", file);
                const response = await fetch("/api/admin/upload", { method: "POST", body });
                const json = await response.json();
                if (!response.ok) throw new Error(json.error ?? "Upload failed");
                setPhotos([...photos, json.url]);
                toast.success("Image uploaded");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Upload failed");
              } finally {
                setUploading(false);
              }
            }}
          />
        </div>
        {photos.length ? (
          <ul className="grid grid-cols-3 gap-3">
            {photos.map((url, index) => (
              <li key={`${url}-${index}`} className="space-y-2">
                {/* Admin photos can be any uploaded URL, so this stays a plain image. */}
                <img src={url} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
                <button
                  type="button"
                  className="press h-11 w-full text-sm text-destructive"
                  onClick={() => setPhotos(photos.filter((_, photoIndex) => photoIndex !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No photos yet. Upload one to show it on the shop.</p>
        )}
      </section>

      <section className="glass space-y-4 rounded-3xl p-5">
        <h2 className="font-heading text-2xl tracking-tight">Details</h2>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={draft.name}
            className={fieldClass}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={draft.description}
            className="min-h-28 rounded-xl bg-background px-3 text-base"
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </div>
      </section>

      <section className="glass relative z-10 space-y-4 rounded-3xl p-5">
        <h2 className="font-heading text-2xl tracking-tight">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <CategoryField
              value={draft.category}
              options={categoryList}
              onChange={(category) => setDraft((current) => ({ ...current, category }))}
              onAdd={saveCategory}
              onDelete={deleteCategory}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className={`${fieldClass} w-full border border-input`}
              value={draft.gender}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  gender: event.target.value as "women" | "men" | "unisex",
                }))
              }
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="price">Base price (GHS)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={draft.base_price}
              className={fieldClass}
              onChange={(event) => setDraft((current) => ({ ...current, base_price: event.target.value }))}
              required
            />
          </div>
        </div>
        <label className="flex min-h-12 items-center justify-between gap-4 rounded-2xl bg-background px-4">
          <span>
            <span className="block text-sm font-medium">Show on the shop</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Hidden pieces stay here in admin.</span>
          </span>
          <input
            type="checkbox"
            className="size-5 shrink-0 accent-primary"
            checked={draft.is_active}
            onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.checked }))}
          />
        </label>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">Sizes</h2>
          <button
            type="button"
            className="press inline-flex h-11 items-center rounded-full border border-foreground px-4 text-sm"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                variants: [...current.variants, { id: undefined, size: sizeList[0] ?? "M", color: colorList[0] ?? "Ivory", sku: "", stock: "0", price_override: "" }],
              }))
            }
          >
            Add size
          </button>
        </div>
        {draft.variants.map((variant, index) => (
          <div key={variant.id ?? index} className="glass space-y-3 rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Size {index + 1}</p>
              {draft.variants.length > 1 ? (
                <button
                  type="button"
                  className="press h-11 px-2 text-sm text-destructive"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
                    }))
                  }
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`size-${index}`}>Size</Label>
                <CategoryField
                  id={`size-${index}`}
                  value={variant.size}
                  options={sizeList}
                  onChange={(size) => updateVariant(index, { size })}
                  onAdd={(size) =>
                    saveNamedOption("sizes", size, (saved) => {
                      setSizeList((current) => mergeCategoryNames(current, [saved]));
                      updateVariant(index, { size: saved });
                    })
                  }
                  onDelete={(size) => deleteNamedOption("sizes", "size", size, sizeList, setSizeList)}
                  addLabel="Add size"
                  placeholder="Size name"
                  inputLabel="New size"
                  noun="size"
                  inUse="It stays if a product still uses it."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`color-${index}`}>Colour</Label>
                <CategoryField
                  id={`color-${index}`}
                  value={variant.color}
                  options={colorList}
                  onChange={(color) => updateVariant(index, { color })}
                  onAdd={(color) =>
                    saveNamedOption("colors", color, (saved) => {
                      setColorList((current) => mergeCategoryNames(current, [saved]));
                      updateVariant(index, { color: saved });
                    })
                  }
                  onDelete={(color) => deleteNamedOption("colors", "color", color, colorList, setColorList)}
                  addLabel="Add colour"
                  placeholder="Colour name"
                  inputLabel="New colour"
                  noun="colour"
                  inUse="It stays if a product still uses it."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`sku-${index}`}>SKU</Label>
                <Input id={`sku-${index}`} value={variant.sku} className={fieldClass} onChange={(event) => updateVariant(index, { sku: event.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`stock-${index}`}>Stock</Label>
                <Input id={`stock-${index}`} type="number" inputMode="numeric" value={variant.stock} className={fieldClass} onChange={(event) => updateVariant(index, { stock: event.target.value })} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`price-${index}`}>Price override (GHS)</Label>
                <Input
                  id={`price-${index}`}
                  inputMode="decimal"
                  value={variant.price_override}
                  placeholder="Leave empty to use the base price"
                  className={fieldClass}
                  onChange={(event) => updateVariant(index, { price_override: event.target.value })}
                />
                {(() => {
                  const override = Number(variant.price_override);
                  const base = Number(draft.base_price);
                  if (variant.price_override === "" || !Number.isFinite(override) || !Number.isFinite(base) || override >= base) return null;
                  return <OfferPrice price={override} compareAt={base} saleClassName="text-base text-rose" />;
                })()}
              </div>
            </div>
          </div>
        ))}
      </section>

      <button type="submit" disabled={pending} className="press h-12 w-full rounded-full bg-primary text-sm text-primary-foreground disabled:opacity-50 sm:w-auto sm:px-6">
        {pending ? "Saving…" : product ? "Save changes" : "Add product"}
      </button>
    </form>
  );
}
