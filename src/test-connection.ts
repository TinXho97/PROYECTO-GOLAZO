import { supabase } from './lib/supabase';

export const runConnectionTest = async () => {
  console.log('🔍 Iniciando test de conexión a Supabase...');
  try {
    const { data, error, status, statusText } = await supabase
      .from('pitches')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error exacto de Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status,
        statusText
      });
      return { success: false, error };
    }

    console.log('✅ Conexión y permisos OK. Datos:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Error de red o ejecución:', err);
    return { success: false, error: err };
  }
};