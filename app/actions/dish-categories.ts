'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateCategoryIcons, loadReferenceIcons } from '@/lib/image-gen';
import { openCategoryPR } from '@/lib/github';

async function assertAdminRole(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Unauthorized';
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'editor'].includes(profile?.role ?? '')) return 'Forbidden';
  return null;
}

// Musi odzwierciedlać ALL_CATEGORIES id-y z data/mockData.ts w repo spotto.
const EXISTING_CATEGORY_IDS = [
  'burger', 'pizza', 'sushi', 'ramen', 'sniadania', 'kawa', 'kebab', 'pierogi',
  'pasta', 'pho', 'tacos', 'lody', 'wino', 'koktajle', 'steak', 'wegetarianskie',
  'brunch', 'bar_mleczny',
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

async function uniqueSlug(base: string, supabase: ReturnType<typeof createClient>): Promise<string> {
  let slug = base;
  let suffix = 2;
  // Small, fixed set of existing ids + rarely-taken suggestions table — a short loop is enough.
  while (true) {
    const taken = EXISTING_CATEGORY_IDS.includes(slug);
    const { data } = await supabase
      .from('dish_category_suggestions')
      .select('id')
      .eq('resolved_category_id', slug)
      .maybeSingle();
    if (!taken && !data) return slug;
    slug = `${base}_${suffix}`;
    suffix += 1;
  }
}

export async function approveDishCategorySuggestion(id: string): Promise<{ error?: string; prUrl?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };

  const supabase = createClient();
  const { data: suggestion, error: fetchErr } = await supabase
    .from('dish_category_suggestions')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single();
  if (fetchErr || !suggestion) return { error: fetchErr?.message ?? 'Not found or already resolved' };

  const categoryId = await uniqueSlug(slugify(suggestion.suggested_name), supabase);

  try {
    const referenceImages = loadReferenceIcons();
    const { flatPng, topPng } = await generateCategoryIcons({
      categoryName: suggestion.suggested_name,
      categoryId,
      referenceImages,
    });

    const { prUrl } = await openCategoryPR({
      categoryId,
      categoryName: suggestion.suggested_name,
      flatIconBase64: flatPng.toString('base64'),
      topIconBase64: topPng.toString('base64'),
      reasoning: suggestion.ai_verdict?.reasoning ?? '',
      occurrenceCount: suggestion.occurrence_count,
      exampleDishName: suggestion.dish_name,
    });

    const { error } = await supabase
      .from('dish_category_suggestions')
      .update({ status: 'approved', pr_url: prUrl, resolved_category_id: categoryId })
      .eq('id', id)
      .eq('status', 'pending');
    if (error) return { error: error.message };

    revalidatePath('/dashboard/dish-categories');
    return { prUrl };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function rejectDishCategorySuggestion(id: string, adminNote: string): Promise<{ error?: string }> {
  const authError = await assertAdminRole();
  if (authError) return { error: authError };

  const supabase = createClient();
  const { error } = await supabase
    .from('dish_category_suggestions')
    .update({ status: 'rejected', admin_note: adminNote || null })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) return { error: error.message };

  revalidatePath('/dashboard/dish-categories');
  return {};
}
