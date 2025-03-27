import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

// Log initialization for debugging
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[Supabase] Missing environment variables for Supabase initialization");
  console.error(`URL defined: ${Boolean(SUPABASE_URL)}, Key defined: ${Boolean(SUPABASE_ANON_KEY)}`);
}

// Create a custom storage object that safely checks for localStorage availability
const customStorage = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  ? {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: (key: string) => window.localStorage.removeItem(key),
    }
  : undefined;

// Create client with proper options for web and native
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: customStorage,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web' && typeof window !== 'undefined',
  },
});

// Log successful initialization
console.log(`[Supabase] Client initialized on ${Platform.OS} platform`);

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
