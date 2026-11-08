import { demoCatalog } from "@/lib/demo-catalog";
import { isServiceRoleConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicEndpointSpend } from "@/lib/try-on-costs";
import { getResolvedTryOnSettings, listedTryOnRate } from "@/lib/try-on-settings";
import type { OrderStatus, Profile, ProductWithVariants, TryOnSession } from "@/lib/types";

const PRIVATE_TRY_ON_BUCKETS = new Set(["user-photos", "try-on-results"]);

function storageObject(stored: string) {
  const trimmed = stored.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    if (trimmed.includes("://")) return null;
    return { bucket: "user-photos", path: trimmed.replace(/^user-photos\//, "") };
  }
}

async function viewableTryOnImage(
  admin: ReturnType<typeof createAdminClient>,
  stored: string | null,
) {
  if (!stored) return null;
  const object = storageObject(stored);
  if (!object || !PRIVATE_TRY_ON_BUCKETS.has(object.bucket)) {
    return stored.startsWith("data:") ? null : stored;
  }
  const signed = await admin.storage.from(object.bucket).createSignedUrl(object.path, 60 * 60);
  return signed.data?.signedUrl ?? null;
}

export type TryOnHistoryItem = {
  id: string;
  status: TryOnSession["status"];
  created_at: string;
  productName: string | null;
  personImage: string | null;
  resultImage: string | null;
};

export type AdminOrderItem = {
  quantity: number;
  price_at_purchase: number;
  product_variants: {
    size: string;
    color: string;
    products: { name: string } | { name: string }[] | null;
  } | null;
};

export type AdminOrder = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_fee?: number;
  tracking_number?: string | null;
  paystack_reference: string;
  shipping_address: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name: string | null } | null;
  order_items?: AdminOrderItem[] | null;
};

function dayDelta(rows: { created_at: string; amount?: number }[]) {
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  let today = 0;
  let yesterday = 0;
  for (const row of rows) {
    const time = new Date(row.created_at).getTime();
    const value = row.amount ?? 1;
    if (time >= startToday.getTime()) today += value;
    else if (time >= startYesterday.getTime()) yesterday += value;
  }
  if (today === 0 && yesterday === 0) return null;
  if (yesterday === 0) return 100;
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

export async function getDashboardStats() {
  if (!isServiceRoleConfigured()) {
    return {
      demo: true,
      revenue: 0,
      orders: 0,
      tryOns: 0,
      revenueDelta: null as number | null,
      orderDelta: null as number | null,
      tryOnDelta: null as number | null,
      topProducts: demoCatalog.slice(0, 3).map((product) => ({
        id: product.id,
        name: product.name,
        revenue: 0,
      })),
    };
  }

  const admin = createAdminClient();
  const [{ data: paidOrders }, { count: orderCount }, { data: tryOnRows }, { data: items }] =
    await Promise.all([
      admin.from("orders").select("total_amount, status, created_at").in("status", ["paid", "processing", "shipped", "delivered"]),
      admin.from("orders").select("id", { count: "exact", head: true }),
      admin.from("try_on_sessions").select("created_at"),
      admin
        .from("order_items")
        .select("quantity, price_at_purchase, variant_id, product_variants(product_id, products(name))")
        .limit(500),
    ]);

  const revenue = (paidOrders ?? []).reduce((sum, order) => sum + Number(order.total_amount), 0);
  const revenueDelta = dayDelta((paidOrders ?? []).map((order) => ({ created_at: order.created_at, amount: Number(order.total_amount) })));
  const orderDelta = dayDelta((paidOrders ?? []).map((order) => ({ created_at: order.created_at })));
  const tryOnDelta = dayDelta(tryOnRows ?? []);
  const totals = new Map<string, { name: string; revenue: number }>();
  for (const item of items ?? []) {
    const variant = item.product_variants as unknown as {
      product_id: string;
      products: { name: string } | null;
    } | null;
    if (!variant) continue;
    const current = totals.get(variant.product_id) ?? { name: variant.products?.name ?? "Product", revenue: 0 };
    current.revenue += Number(item.price_at_purchase) * item.quantity;
    totals.set(variant.product_id, current);
  }

  return {
    demo: false,
    revenue,
    orders: orderCount ?? 0,
    tryOns: tryOnRows?.length ?? 0,
    revenueDelta,
    orderDelta,
    tryOnDelta,
    topProducts: [...totals.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, value]) => ({ id, name: value.name, revenue: value.revenue })),
  };
}

export async function getSiteAnalytics() {
  const empty = {
    views: 0,
    visitors: 0,
    viewDelta: null as number | null,
    visitorDelta: null as number | null,
    pages: [] as { path: string; views: number }[],
  };
  if (!isServiceRoleConfigured()) return empty;

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  const admin = createAdminClient();
  const { data } = await admin
    .from("page_views")
    .select("path, visitor_id, created_at")
    .gte("created_at", startYesterday.toISOString());
  const rows = (data ?? []) as { path: string; visitor_id: string; created_at: string }[];
  const today = rows.filter((row) => new Date(row.created_at).getTime() >= startToday.getTime());
  const yesterday = rows.filter((row) => new Date(row.created_at).getTime() < startToday.getTime());
  const visitors = new Set(today.map((row) => row.visitor_id)).size;
  const yesterdayVisitors = new Set(yesterday.map((row) => row.visitor_id)).size;
  const counts = new Map<string, number>();
  for (const row of today) counts.set(row.path, (counts.get(row.path) ?? 0) + 1);

  return {
    views: today.length,
    visitors,
    viewDelta: dayDelta(rows),
    visitorDelta: percentChange(visitors, yesterdayVisitors),
    pages: [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([path, views]) => ({ path, views })),
  };
}

function percentChange(today: number, yesterday: number) {
  if (today === 0 && yesterday === 0) return null;
  if (yesterday === 0) return 100;
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

export async function listAdminOrders(status?: OrderStatus) {
  if (!isServiceRoleConfigured()) return [] as AdminOrder[];
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("*, profiles(full_name), order_items(quantity, price_at_purchase, product_variants(size, color, products(name)))")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []) as AdminOrder[];
}

export type AdminCustomer = Profile & {
  orders: number;
  tryOns: number;
};

export async function listCustomers() {
  if (!isServiceRoleConfigured()) return [] as AdminCustomer[];
  const admin = createAdminClient();
  const [{ data }, { data: orderRows }, { data: tryRows }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("orders").select("user_id"),
    admin.from("try_on_sessions").select("user_id"),
  ]);
  const orders = new Map<string, number>();
  for (const row of orderRows ?? []) {
    const userId = (row as { user_id?: string | null }).user_id;
    if (!userId) continue;
    orders.set(userId, (orders.get(userId) ?? 0) + 1);
  }
  const tryOns = new Map<string, number>();
  for (const row of tryRows ?? []) {
    const userId = (row as { user_id?: string | null }).user_id;
    if (!userId) continue;
    tryOns.set(userId, (tryOns.get(userId) ?? 0) + 1);
  }
  return ((data ?? []) as Profile[]).map((profile) => ({
    ...profile,
    orders: orders.get(profile.id) ?? 0,
    tryOns: tryOns.get(profile.id) ?? 0,
  }));
}

export async function getCustomerDetail(id: string) {
  if (!isServiceRoleConfigured()) {
    return { profile: null as Profile | null, orders: [] as AdminOrder[], tryOns: [] as TryOnHistoryItem[] };
  }
  const admin = createAdminClient();
  const [{ data: profile }, { data: orders }, { data: tryOns }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    admin
      .from("try_on_sessions")
      .select("*, products(name)")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);
  const sessions = (tryOns ?? []) as (TryOnSession & { products?: { name?: string } | null })[];
  const history = await Promise.all(
    sessions.map(async (session) => ({
      id: session.id,
      status: session.status,
      created_at: session.created_at,
      productName: session.products?.name ?? null,
      personImage: await viewableTryOnImage(admin, session.person_image_url),
      resultImage: await viewableTryOnImage(admin, session.result_image_url),
    })),
  );
  return {
    profile: (profile as Profile | null) ?? null,
    orders: (orders ?? []) as AdminOrder[],
    tryOns: history,
  };
}

export async function getTryOnAnalytics() {
  if (!isServiceRoleConfigured()) {
    return demoCatalog.map((product) => ({
      productId: product.id,
      name: product.name,
      tries: 0,
      customers: 0,
      purchases: 0,
      conversion: 0,
    }));
  }

  const admin = createAdminClient();
  const [{ data: sessions }, { data: paidItems }] = await Promise.all([
    admin.from("try_on_sessions").select("user_id, product_id, products(name)"),
    admin
      .from("order_items")
      .select("variant_id, orders!inner(user_id, status), product_variants(product_id)")
      .in("orders.status", ["paid", "processing", "shipped", "delivered"]),
  ]);

  const tries = new Map<string, { name: string; count: number; users: Set<string> }>();
  for (const session of sessions ?? []) {
    const product = session.products as unknown as { name?: string } | null;
    const entry = tries.get(session.product_id) ?? {
      name: product?.name ?? "Product",
      count: 0,
      users: new Set<string>(),
    };
    entry.count += 1;
    if (session.user_id) entry.users.add(session.user_id);
    tries.set(session.product_id, entry);
  }

  const buyers = new Map<string, Set<string>>();
  for (const item of paidItems ?? []) {
    const productId = (item.product_variants as { product_id?: string } | null)?.product_id;
    const userId = (item.orders as { user_id?: string } | null)?.user_id;
    if (!productId || !userId) continue;
    const set = buyers.get(productId) ?? new Set<string>();
    set.add(userId);
    buyers.set(productId, set);
  }

  return [...tries.entries()].map(([productId, value]) => {
    const converted = [...value.users].filter((userId) => buyers.get(productId)?.has(userId)).length;
    return {
      productId,
      name: value.name,
      tries: value.count,
      customers: value.users.size,
      purchases: converted,
      conversion: value.users.size ? converted / value.users.size : 0,
    };
  }).sort((a, b) => b.tries - a.tries);
}

export type ProductPayload = {
  name: string;
  slug: string;
  description: string;
  category: string;
  gender: "women" | "men" | "unisex";
  base_price: number;
  images: string[];
  is_active: boolean;
  variants: {
    id?: string;
    size: string;
    color: string;
    sku: string;
    stock: number;
    price_override: number | null;
  }[];
};

export async function upsertProduct(id: string | null, payload: ProductPayload) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Connect Supabase with a service role key to manage products.");
  }
  const admin = createAdminClient();
  const productRow = {
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    category: payload.category,
    gender: payload.gender,
    base_price: payload.base_price,
    images: payload.images,
    is_active: payload.is_active,
  };

  let productId = id;
  if (id) {
    const { error } = await admin.from("products").update(productRow).eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await admin.from("products").insert(productRow).select("id").single();
    if (error || !data) throw error ?? new Error("Could not create product");
    productId = data.id;
  }

  const { data: existing } = await admin.from("product_variants").select("id").eq("product_id", productId);
  const keepIds = payload.variants.map((variant) => variant.id).filter(Boolean) as string[];
  const toDelete = (existing ?? []).map((row) => row.id).filter((variantId) => !keepIds.includes(variantId));
  if (toDelete.length) {
    await admin.from("product_variants").delete().in("id", toDelete);
  }

  for (const variant of payload.variants) {
    const row = {
      product_id: productId,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: variant.stock,
      price_override: variant.price_override,
    };
    if (variant.id) {
      const { error } = await admin.from("product_variants").update(row).eq("id", variant.id);
      if (error) throw error;
    } else {
      const { error } = await admin.from("product_variants").insert(row);
      if (error) throw error;
    }
  }

  return productId;
}

type TryOnUsageRow = {
  status: TryOnSession["status"];
  user_id: string | null;
  product_id: string;
  runpod_job_id: string | null;
  runpod_cost_usd: number | string | null;
  runpod_endpoint_mode: "qwen_image_edit" | "seedream_v4_edit" | null;
  created_at: string;
  products: { name: string } | { name: string }[] | null;
};

function productName(products: TryOnUsageRow["products"]) {
  if (Array.isArray(products)) return products[0]?.name ?? "Product";
  return products?.name ?? "Product";
}

function storedCharge(row: TryOnUsageRow) {
  if (!row.runpod_job_id || row.runpod_job_id.startsWith("stub-") || row.status !== "completed") return null;
  const stored = row.runpod_cost_usd == null ? null : Number(row.runpod_cost_usd);
  if (stored == null || !Number.isFinite(stored)) return null;
  return stored;
}

export async function getTryOnManagement() {
  const empty = {
    demo: true,
    workerLabel: null as string | null,
    listPriceUsd: null as number | null,
    spendUsd: 0,
    monthSpendUsd: 0,
    fromBill: false,
    dailySpendUsd: null as number | null,
    paceSince: null as string | null,
    balanceUsd: null as number | null,
    unpriced: 0,
    completed: 0,
    failed: 0,
    running: 0,
    real: 0,
    stub: 0,
    customers: 0,
    signedInRuns: 0,
    guestRuns: 0,
    savedLooks: 0,
    successRate: null as number | null,
    topProducts: [] as { id: string; name: string; count: number }[],
  };
  if (!isServiceRoleConfigured()) return empty;

  const settings = await getResolvedTryOnSettings();
  const rate = listedTryOnRate(settings.configuredMode, settings.submitJobUrl);
  const admin = createAdminClient();
  const [bill, sessionsResult, savedResult] = await Promise.all([
    getPublicEndpointSpend(settings.apiKey),
    admin
      .from("try_on_sessions")
      .select("status, user_id, product_id, runpod_job_id, runpod_cost_usd, runpod_endpoint_mode, created_at, products(name)"),
    admin.from("saved_looks").select("id", { count: "exact", head: true }),
  ]);
  const sessions = sessionsResult.data;
  const savedLooks = savedResult.count;

  const monthStart = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1);
  let spendUsd = 0;
  let monthSpendUsd = 0;
  let unpriced = 0;
  let completed = 0;
  let failed = 0;
  let running = 0;
  let real = 0;
  let stub = 0;
  let signedInRuns = 0;
  let guestRuns = 0;
  const customerIds = new Set<string>();
  let realCompleted = 0;
  let realFailed = 0;
  const products = new Map<string, { name: string; count: number }>();

  for (const row of (sessions ?? []) as TryOnUsageRow[]) {
    const isStub = Boolean(row.runpod_job_id?.startsWith("stub-"));
    if (isStub) {
      stub += 1;
      continue;
    }
    real += 1;
    if (row.user_id) {
      signedInRuns += 1;
      customerIds.add(row.user_id);
    } else guestRuns += 1;
    if (row.status === "completed") {
      completed += 1;
      realCompleted += 1;
    } else if (row.status === "failed") {
      failed += 1;
      realFailed += 1;
    } else running += 1;

    if (row.status === "completed") {
      const current = products.get(row.product_id) ?? { name: productName(row.products), count: 0 };
      current.count += 1;
      products.set(row.product_id, current);
    }

    const charge = storedCharge(row);
    if (row.status === "completed" && charge == null) unpriced += 1;
    if (charge == null) continue;
    spendUsd += charge;
    if (new Date(row.created_at).getTime() >= monthStart) monthSpendUsd += charge;
  }

  const decided = realCompleted + realFailed;
  return {
    ...empty,
    demo: false,
    workerLabel: rate?.label ?? null,
    listPriceUsd: rate?.priceUsd ?? null,
    spendUsd: bill?.spendUsd ?? spendUsd,
    monthSpendUsd: bill?.monthSpendUsd ?? monthSpendUsd,
    fromBill: bill != null,
    dailySpendUsd: bill?.dailySpendUsd ?? null,
    paceSince: bill?.paceSince ?? null,
    balanceUsd: settings.balanceUsd,
    unpriced: bill != null ? 0 : unpriced,
    completed,
    failed,
    running,
    real,
    stub,
    customers: customerIds.size,
    signedInRuns,
    guestRuns,
    savedLooks: savedLooks ?? 0,
    successRate: decided === 0 ? null : Math.round((realCompleted / decided) * 1000) / 10,
    topProducts: [...products.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name))
      .map(([id, value]) => ({ id, name: value.name, count: value.count })),
  };
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Connect Supabase to update orders.");
  }
  const admin = createAdminClient();
  const { error } = await admin.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

export type { ProductWithVariants };
