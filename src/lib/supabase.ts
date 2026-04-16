import { createClient } from '@supabase/supabase-js';

// Sanitize URL to prevent common copy-paste errors
const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseUrl = rawUrl.trim().replace(/\/$/, ''); // Remove trailing spaces and slashes
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();


// Supabase supports legacy JWT anon keys (eyJ...) and newer publishable keys (sb_publishable_...)
const isValidKey = (key: string) =>
  !!key && (key.startsWith('eyJ') || key.startsWith('sb_publishable_'));

const isDummyUrl = supabaseUrl.includes('your-project.supabase.co') || supabaseUrl.includes('TODO_');
const hasHttpsUrl = supabaseUrl.startsWith('https://');
const hasUrl = !!supabaseUrl;
const hasKey = !!supabaseAnonKey;
const validKey = isValidKey(supabaseAnonKey);

export const getSupabaseDiagnostics = () => ({
  hasUrl,
  hasKey,
  validKey,
  isDummyUrl,
  hasHttpsUrl,
  urlPreview: hasUrl ? `${supabaseUrl.slice(0, 28)}...` : '(empty)',
  keyPreview: hasKey ? `${supabaseAnonKey.slice(0, 8)}...` : '(empty)',
});

if (!hasUrl || !validKey || isDummyUrl) {
  console.warn('[Supabase] Missing, invalid, or dummy environment variables. Falling back to local storage mode.', getSupabaseDiagnostics());
} else if (!hasHttpsUrl) {

  console.error('[Supabase] URL must start with https://. Current value:', supabaseUrl);
}

// Intercept fetch to provide better error messages for "Failed to fetch"
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  try {
    return await fetch(url, options);
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      if (!(window as any)._supabaseFetchErrorLogged) {
        console.error('🚨 [Supabase Network Error] Failed to fetch. Possible causes:\n1. AdBlocker is blocking the request.\n2. Supabase project is paused (Free Tier).\n3. Invalid Supabase URL.');
        (window as any)._supabaseFetchErrorLogged = true;
      }
      // Mark as unreachable so dataService falls back to local storage
      (window as any)._supabaseReachable = false;
      
      // Enhance the error message
      throw new Error('Network Error: Failed to connect to Supabase. Please check if your project is paused or disable your AdBlocker.');
    }
    throw error;
  }
};

// Singleton instance

export const supabase = (hasUrl && validKey && !isDummyUrl) 

  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: customFetch
      }
    })
  : new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'from') {
          return () => {
            let isSelect = false;
            const queryBuilder: any = {
              select: () => { isSelect = true; return queryBuilder; },
              order: () => queryBuilder,
              limit: () => queryBuilder,
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not configured' } }),
              insert: () => { isSelect = false; return queryBuilder; },
              update: () => { isSelect = false; return queryBuilder; },
              delete: () => { isSelect = false; return queryBuilder; },
              eq: () => queryBuilder,
              neq: () => queryBuilder,
              gt: () => queryBuilder,
              lt: () => queryBuilder,
              gte: () => queryBuilder,
              lte: () => queryBuilder,
              in: () => queryBuilder,
              then: (resolve: any) => resolve({ data: [], error: isSelect ? null : new Error('Supabase not configured') }),
              catch: (reject: any) => reject(new Error('Supabase not configured'))
            };
            return queryBuilder;
          };
        }
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            signOut: () => Promise.resolve({ error: null })
          };
        }
        return () => {
          throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
        };
      }
    });

export const getSupabaseUrl = () => supabaseUrl;

export const checkSupabaseConnection = async () => {

  if (!hasUrl || !validKey || isDummyUrl) {

    (window as any)._supabaseReachable = false;
    return false;
  }
  
  try {

    // Health check against a real table endpoint instead of REST root
    const res = await fetch(`${supabaseUrl}/rest/v1/clients?select=id&limit=1`, {

      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    const isReachable = res.ok || res.status === 401 || res.status === 403;

    (window as any)._supabaseReachable = isReachable;
    return isReachable;
  } catch (error) {
    console.error('[Supabase Health Check] Failed to connect:', error);
    (window as any)._supabaseReachable = false;
    return false;
  }
};
