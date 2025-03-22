import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Receipt = {
  id: string;
  user_id: string;
  date: string;
  time: string | null;
  amount: number;
  category: "GAS" | "FOOD" | "TRAVEL" | "OTHER";
  location: string | null;
  vendor: string | null;
  notes: string | null;
  image_path: string | null; 
  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  categories: string[];
  created_at: string;
};
