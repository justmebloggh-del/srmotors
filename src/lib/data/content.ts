import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export interface ContentBlock {
  key: string;
  title: string | null;
  body: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function getContentBlock(key: string): Promise<ContentBlock | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("content_blocks")
    .select("key, title, body, data, seo_title, seo_description, published")
    .eq("key", key)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    key: data.key,
    title: data.title,
    body: data.body,
    data: (data.data as Record<string, unknown>) ?? {},
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
  };
}

export async function getFaqs() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer, position")
    .eq("published", true)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export interface DutyChecker {
  name: string;
  url: string;
}

/** The configured third-party duty estimator, or null when switched off or misconfigured. */
export async function getDutyChecker(): Promise<DutyChecker | null> {
  const block = await getContentBlock("duty_checker");
  const url = block?.body?.trim();
  if (!block?.title || !url || !/^https:\/\/[^\s]+$/.test(url)) return null;
  return { name: block.title.trim(), url };
}
