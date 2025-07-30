import { supabase } from './client';

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  color: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    console.log('Fetching categories...');
    
    const { data, error } = await supabase
      .from('ws_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    console.log('Categories fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getCategories:', error);
    throw error;
  }
};

export const getCategory = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCategory:', error);
    return null;
  }
};

export const createCategory = async (categoryData: CreateCategoryData): Promise<Category | null> => {
  try {
    console.log('Creating category:', categoryData);
    
    const { data, error } = await supabase
      .from('ws_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    console.log('Category created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createCategory:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, updates: UpdateCategoryData): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ws_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return false;
  }
}; 