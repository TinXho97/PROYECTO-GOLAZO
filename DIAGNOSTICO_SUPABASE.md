# Diagnóstico: por qué la app cae a LocalStorage en vez de Supabase

> **Advertencia:** Documento histórico/desactualizado. No usar como guía de seguridad actual. Se conserva como contexto de diagnóstico; la autorización vigente de SuperAdmin depende de un JWT válido de Supabase y de `public.profiles.role === "superadmin"`.

## Hallazgos clave

1. La app **está diseñada para fallback automático** a LocalStorage si Supabase no está bien configurado o no responde.
2. El proyecto valida que existan `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, y que la key tenga formato válido (`eyJ...` legacy o `sb_publishable_...` nuevo formato) y que la URL no sea dummy.
3. Si falla el health check o hay error de red (`Failed to fetch`), marca Supabase como no alcanzable y activa fallback local.
4. Tu `.env.example` viene con variables vacías, por lo que si no creaste `.env` real con valores válidos, siempre usará LocalStorage.

## Dónde se activa el fallback

- `src/lib/supabase.ts`: crea un cliente mock/proxy cuando faltan variables o son inválidas.
- `src/services/dataService.ts`: `isSupabaseConfigured()` devuelve `false` si falta configuración o si `_supabaseReachable === false`.
- `src/services/dataService.ts`: la mayoría de métodos intentan Supabase y, si falla, retornan/guardan en LocalStorage (`golazo_*`).

## Cómo confirmarlo rápido

1. Revisar en navegador si aparecen warnings:
   - `[Supabase] Missing, invalid, or dummy environment variables...`
   - `[DataService] Supabase not configured or unreachable...`
2. Verificar `.env` con URL real y anon key real.
3. Comprobar Network al endpoint: `https://<tu-proyecto>.supabase.co/rest/v1/clients?select=id&limit=1`.

## Acción recomendada

1. Crear/actualizar `.env`:
   - `VITE_SUPABASE_URL=https://<tu-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<anon_key_real>`
2. Reiniciar Vite (`npm run dev`) para que tome variables.
3. Revisar que no haya AdBlock/proxy bloqueando peticiones a Supabase.
4. Confirmar que el proyecto de Supabase no esté pausado.

## Correcciones concretas para Super Admin

1. **Autorización SuperAdmin vigente**
   - En frontend se envía el JWT de Supabase en `Authorization: Bearer ...`, junto con la `apikey` anon y `Content-Type: application/json`.
   - En backend (`admin-ops`) se valida el JWT y luego se consulta `public.profiles`.
   - El acceso se concede solo si `profiles.role === "superadmin"`.
   - No se debe configurar ni exponer una contraseña SuperAdmin en variables `VITE_*`.

2. **Deploy de función Edge**
   - Desplegar `admin-ops` y configurar secrets en Supabase:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

3. **Usuario con perfil `superadmin`**
   - El login de Super Admin exige una fila válida en `public.profiles` con `role === "superadmin"`.
   - No usar `user_metadata.role` ni `app_metadata.role` como fuente de autorización crítica.

4. **Corregido bug en panel SaaS**
   - Se corrigió la carga de clientes para usar `data.clients` correctamente.
