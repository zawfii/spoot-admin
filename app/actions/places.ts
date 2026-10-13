'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPlace(name: string, city: string, category: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .insert({ name, city, category, district: '', address: '', status: 'pending' })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/places');
  return data.id;
}
