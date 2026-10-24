import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getAllContentBlocks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_blocks")
    .select("key, title, body, published")
    .order("key");
  if (error) throw error;
  return data ?? [];
}

export async function getAllFaqs() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("faqs").select("id, question, answer").order("position");
  if (error) throw error;
  return data ?? [];
}
