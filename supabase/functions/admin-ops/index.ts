import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-superadmin-password',
}

serve(async (req) => {
  // Manejo de CORS para llamadas desde el navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. VALIDACIÓN DE SEGURIDAD (Solo el Superadmin conoce esta contraseña)
    const superadminPassword = req.headers.get('x-superadmin-password')
    const envPassword = Deno.env.get('SUPERADMIN_PASSWORD')
    
    if (!superadminPassword || superadminPassword !== envPassword) {
      return new Response(JSON.stringify({ error: 'No autorizado. Contraseña de superadmin inválida.' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 2. CREACIÓN DEL CLIENTE ADMIN (Solo vive en el backend)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { action, payload } = await req.json()

    // 3. ENRUTAMIENTO DE ACCIONES
    switch (action) {
      case 'get_metrics': {
        const [usersRes, productsRes, salesRes, bookingsRes] = await Promise.all([
          supabaseAdmin.from('client_users').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('sales').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true })
        ])
        return new Response(JSON.stringify({
          users: usersRes.count || 0,
          products: productsRes.count || 0,
          sales: salesRes.count || 0,
          bookings: bookingsRes.count || 0
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'list_clients': {
        const { data, error } = await supabaseAdmin
          .from('clients')
          .select('id, name, status, created_at, features')
          .order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify({ clients: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'list_users': {
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        if (authError) throw authError
        return new Response(JSON.stringify({ users: authUsers.users }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'create_client_and_user': {
        const { clientData, userData } = payload
        let clientId = clientData.id

        // A. Crear cliente si es necesario
        if (clientData.create_new) {
          const { data: newClient, error: clientError } = await supabaseAdmin
            .from('clients')
            .insert({
              name: clientData.name,
              complex_name: clientData.complex_name,
              phone: clientData.phone,
              address: clientData.address,
              status: 'active',
              enable_ranking: clientData.features.ranking,
              enable_sales: clientData.features.ventas,
              enable_reservations: clientData.features.reservas,
              features: clientData.features
            })
            .select()
            .single()
          if (clientError) throw clientError
          clientId = newClient.id

          // Crear cancha por defecto
          await supabaseAdmin.from('pitches').insert({
            name: 'Cancha 1', type: 'F5', price: 0, active: true, client_id: clientId
          })
        }

        // B. Crear usuario en Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            client_id: clientId,
            role: 'admin',
            name: userData.name
          }
        })
        if (authError) throw authError

        // C. Vincular en client_users
        const { error: membershipError } = await supabaseAdmin
          .from('client_users')
          .insert({ client_id: clientId, user_id: authUser.user.id, role: 'admin' })
        if (membershipError) throw membershipError

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'delete_user': {
        const { userId } = payload
        await supabaseAdmin.from('client_users').delete().eq('user_id', userId)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'reset_password': {
        const { userId, newPassword } = payload
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      default:
        throw new Error('Acción no válida')
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})