import { supabase } from '@/services/supabase/client';

export async function getCategoryNameById(categoryId: string): Promise<string | undefined> {
  if (!categoryId) return undefined;
  const { data, error } = await supabase
    .from('ws_categories')
    .select('name')
    .eq('id', categoryId)
    .maybeSingle();
  if (error) {
    console.error('Error fetching category name:', error);
    return undefined;
  }
  return data?.name;
}
