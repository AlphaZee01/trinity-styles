import { categoryOptions, mergeCategoryNames } from "@/lib/demo-catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function listCategoryNames(extra: string[] = []) {
  if (!isSupabaseConfigured()) return categoryOptions(extra);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("categories").select("name").order("created_at");
    if (error || !data) return categoryOptions(extra);
    return mergeCategoryNames(data.map((row) => row.name), extra);
  } catch {
    return categoryOptions(extra);
  }
}
