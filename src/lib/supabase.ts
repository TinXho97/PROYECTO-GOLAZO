import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isValidKey = (key: string) =>
  !!key && (key.startsWith('eyJ') || key.startsWith('sb_publishable_'));

const hasUrl = supabaseUrl.startsWith('https://');
const hasKey = isValidKey(supabaseAnonKey);

export const getSupabaseUrl = () => supabaseUrl;
export const getSupabaseAnonKey = () => supabaseAnonKey;

export const getSupabaseDiagnostics = () => ({
  hasUrl,
  hasKey,
  urlPreview: hasUrl ? `${supabaseUrl.slice(0, 32)}...` : '(empty)',
  keyPreview: hasKey ? `${supabaseAnonKey.slice(0, 12)}...` : '(empty)',
});

const customFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error: any) {
    if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
      throw new Error(
        'No se pudo conectar con Supabase. Verifica la URL del proyecto, conectividad o bloqueos del navegador.',
      );
    }

    throw error;
  }
};

if (!hasUrl || !hasKey) {
  throw new Error(
    'Supabase no esta configurado correctamente. Defini VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
});

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch (error) {
    console.error('[Supabase Health Check] Error:', error);
    return false;
  }
};
