'use client';

import { supabase } from './supabase-browser';

export const createClient = () => {
  return supabase;
}; 