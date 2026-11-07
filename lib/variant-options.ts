import { colors, mergeCategoryNames, sizes } from "@/lib/demo-catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function listNames(table: "sizes" | "colors", fallback: string[], extra: string[]) {
  if (!isSupabaseConfigured()) return mergeCategoryNames(fallback, extra);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).select("name").order("created_at");
    if (error || !data) return mergeCategoryNames(fallback, extra);
    return mergeCategoryNames(
      data.map((row) => row.name),
      extra,
    );
  } catch {
    return mergeCategoryNames(fallback, extra);
  }
}

export function listSizeNames(extra: string[] = []) {
  return listNames("sizes", sizes, extra);
}

export function listColorNames(extra: string[] = []) {
  return listNames("colors", colors, extra);
}
