import Constants from 'expo-constants';

// Get environment variables from Constants.expoConfig.extra
// This approach works in both development and production builds
const extra = Constants.expoConfig?.extra || {};

// Environment variables
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || '';
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || extra.openaiApiKey || '';

// Log configuration status for debugging
const logConfigStatus = () => {
  const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  const openaiConfigured = Boolean(OPENAI_API_KEY);
  
  console.log(`[Config] Supabase configured: ${supabaseConfigured}`);
  console.log(`[Config] OpenAI configured: ${openaiConfigured}`);
  
  if (!supabaseConfigured) {
    console.warn('[Config] Supabase is not properly configured. Database features will not work.');
  }
  
  if (!openaiConfigured) {
    console.warn('[Config] OpenAI API key is not configured. AI receipt scanning will not work.');
  }
};

// Call this function when the app starts
logConfigStatus();
