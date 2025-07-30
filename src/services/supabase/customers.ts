import { supabase } from './client';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  total_purchases: number;
  last_purchase_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('ws_customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCustomers:', error);
    throw error;
  }
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCustomer:', error);
    return null;
  }
};

export const createCustomer = async (customerData: CreateCustomerData): Promise<Customer | null> => {
  try {
    console.log('Creating customer:', customerData);
    
    const { data, error } = await supabase
      .from('ws_customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }

    console.log('Customer created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createCustomer:', error);
    throw error;
  }
};

export const updateCustomer = async (id: string, updates: UpdateCustomerData): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('ws_customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    return null;
  }
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ws_customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    return false;
  }
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('ws_customers')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching customers:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    throw error;
  }
}; 