import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const bookingDurationMinutes = Number(Deno.env.get('PUBLIC_BOOKING_DURATION_MINUTES') ?? '60')
const defaultBookingStatus = (Deno.env.get('PUBLIC_BOOKING_DEFAULT_STATUS') ?? 'pending').toLowerCase()

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

const ok = (data: Record<string, unknown>) => json(200, { success: true, data })

const fail = (status: number, code: string, message: string, details?: unknown) =>
  json(status, {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  })

type RequestContext = {
  requestId: string
  path: string
  method: string
}

const createContext = (req: Request): RequestContext => ({
  requestId: crypto.randomUUID(),
  path: new URL(req.url).pathname,
  method: req.method,
})

const logInfo = (context: RequestContext, message: string, details?: Record<string, unknown>) => {
  console.log('[public-create-booking]', {
    level: 'info',
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    message,
    ...(details ?? {}),
  })
}

const logWarn = (context: RequestContext, message: string, details?: Record<string, unknown>) => {
  console.warn('[public-create-booking]', {
    level: 'warn',
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    message,
    ...(details ?? {}),
  })
}

const logError = (context: RequestContext, message: string, error?: unknown, details?: Record<string, unknown>) => {
  console.error('[public-create-booking]', {
    level: 'error',
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    message,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message }
        : (error ?? null),
    ...(details ?? {}),
  })
}

const parseBody = async (req: Request) => {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? body : {}
  } catch {
    return {}
  }
}

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const normalizeSlug = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const normalizeText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''

const normalizePhone = (value: unknown) =>
  typeof value === 'string' ? value.replace(/[^\d+]/g, '').slice(0, 20) : ''

const parseStartTime = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isMissingSchemaObjectError = (error: { code?: string; message?: string } | null | undefined) => {
  const message = error?.message ?? ''
  return (
    error?.code === 'PGRST204' ||
    error?.code === 'PGRST205' ||
    error?.code === '42703' ||
    error?.code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('Could not find the') ||
    message.includes('column')
  )
}

serve(async (req) => {
  const context = createContext(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return ok({
      name: 'public-create-booking',
      status: 'ok',
      method: 'POST',
      message: 'Send POST with { client_slug, pitch_id, start_time, client_name, client_phone, notes? }',
    })
  }

  if (req.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Método no permitido.')
  }

  const body = await parseBody(req)
  const clientSlug = normalizeSlug(body.client_slug)
  const pitchId = body.pitch_id
  const startAt = parseStartTime(body.start_time)
  const clientName = normalizeText(body.client_name, 120)
  const clientPhone = normalizePhone(body.client_phone)
  const notes = normalizeText(body.notes, 1000)

  logInfo(context, 'request received', {
    clientSlug,
    pitchId: typeof pitchId === 'string' ? pitchId : null,
    hasNotes: Boolean(notes),
  })

  if (!clientSlug || !isUuid(pitchId) || !startAt || !clientName || !clientPhone) {
    return fail(
      400,
      'validation_error',
      'Debes enviar client_slug, pitch_id, start_time, client_name y client_phone válidos.',
    )
  }

  if (!Number.isFinite(bookingDurationMinutes) || bookingDurationMinutes <= 0) {
    return fail(500, 'server_config_error', 'La duración pública de reserva está mal configurada.')
  }

  if (!['pending', 'confirmed'].includes(defaultBookingStatus)) {
    return fail(500, 'server_config_error', 'El estado por defecto de reserva es inválido.')
  }

  if (startAt.getTime() < Date.now() - 60_000) {
    return fail(400, 'past_booking_not_allowed', 'No se pueden crear reservas en horarios pasados.')
  }

  const endAt = new Date(startAt.getTime() + bookingDurationMinutes * 60 * 1000)
  const dateStr = startAt.toISOString().slice(0, 10)
  const timeStr = startAt.toTimeString().slice(0, 8)

  try {
    const { data: client, error: clientError } = await adminClient
      .from('clients')
      .select(`
        id,
        name,
        complex_name,
        status,
        expires_at,
        public_slug,
        public_booking_enabled
      `)
      .eq('public_slug', clientSlug)
      .maybeSingle()

    if (clientError) {
      logError(context, 'client lookup failed', clientError, { clientSlug })
      return fail(500, 'client_lookup_failed', 'No se pudo validar el complejo.')
    }

    if (!client) {
      return fail(404, 'client_not_found', 'No encontramos el complejo solicitado.')
    }

    const clientExpired = client.expires_at ? new Date(client.expires_at).getTime() < Date.now() : false
    if (client.status !== 'active' || clientExpired || client.public_booking_enabled === false) {
      return fail(403, 'client_not_publicly_bookable', 'Este complejo no acepta reservas públicas en este momento.')
    }

    const { data: pitch, error: pitchError } = await adminClient
      .from('pitches')
      .select('id, client_id, name, active, is_public')
      .eq('id', pitchId)
      .eq('client_id', client.id)
      .maybeSingle()

    if (pitchError) {
      logError(context, 'pitch lookup failed', pitchError, {
        clientId: client.id,
        pitchId,
      })
      return fail(500, 'pitch_lookup_failed', 'No se pudo validar la cancha.')
    }

    if (!pitch || pitch.active === false || pitch.is_public === false) {
      return fail(404, 'pitch_not_available', 'La cancha solicitada no está disponible para reservas públicas.')
    }

    const { data: overlappingBookings, error: overlapError } = await adminClient
      .from('bookings')
      .select('id, start_time, end_time, status')
      .eq('client_id', client.id)
      .eq('pitch_id', pitch.id)
      .in('status', ['pending', 'confirmed', 'completed'])
      .lt('start_time', endAt.toISOString())
      .gt('end_time', startAt.toISOString())

    if (overlapError) {
      logError(context, 'overlap lookup failed', overlapError, {
        clientId: client.id,
        pitchId: pitch.id,
      })
      return fail(500, 'booking_conflict_check_failed', 'No se pudo validar la disponibilidad.')
    }

    if ((overlappingBookings ?? []).length > 0) {
      return fail(409, 'slot_occupied', 'Ese horario ya no está disponible.')
    }

    const insertPayload: Record<string, unknown> = {
      pitch_id: pitch.id,
      user_id: null,
      client_name: clientName,
      client_phone: clientPhone,
      date: dateStr,
      time: timeStr,
      start_time: startAt.toISOString(),
      end_time: endAt.toISOString(),
      status: defaultBookingStatus,
      deposit_amount: 0,
      is_paid: false,
      receipt_url: null,
      payment_url: null,
      client_id: client.id,
    }

    if (notes) {
      insertPayload.notes = notes
    }

    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .insert(insertPayload)
      .select('id, pitch_id, client_id, client_name, client_phone, start_time, end_time, status, created_at')
      .single()

    if (bookingError) {
      logError(context, 'booking insert failed', bookingError, {
        clientId: client.id,
        pitchId: pitch.id,
      })
      return fail(500, 'booking_insert_failed', 'No se pudo crear la reserva.')
    }

    const auditPayload: Record<string, unknown> = {
      action: 'Reserva publica creada',
      entity: 'booking',
      entity_id: booking.id,
      user_id: null,
      user_name: clientName,
      client_id: client.id,
      description: `Reserva pública creada para ${pitch.name}`,
      details: `Reserva pública creada para ${pitch.name}`,
      metadata: {
        source: 'public-create-booking',
        client_slug: clientSlug,
        pitch_id: pitch.id,
        pitch_name: pitch.name,
        start_time: booking.start_time,
        end_time: booking.end_time,
        client_phone: clientPhone,
        ...(notes ? { notes } : {}),
      },
      created_at: new Date().toISOString(),
    }

    const { error: auditError } = await adminClient.from('audit_logs').insert(auditPayload)
    if (auditError) {
      if (isMissingSchemaObjectError(auditError)) {
        logWarn(context, 'audit log skipped due to missing schema object', {
          auditError: auditError.message,
        })
      } else {
        logWarn(context, 'audit log insert failed', {
          auditError: auditError.message,
          bookingId: booking.id,
        })
      }
    }

    logInfo(context, 'public booking created', {
      bookingId: booking.id,
      clientId: client.id,
      pitchId: pitch.id,
      status: booking.status,
    })

    return ok({
      booking: {
        id: booking.id,
        client_id: booking.client_id,
        pitch_id: booking.pitch_id,
        client_name: booking.client_name,
        client_phone: booking.client_phone,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        created_at: booking.created_at,
      },
      message:
        booking.status === 'confirmed'
          ? 'Reserva creada correctamente.'
          : 'Reserva creada y pendiente de confirmación.',
    })
  } catch (error) {
    logError(context, 'unexpected error', error, {
      clientSlug,
      pitchId,
    })
    return fail(
      500,
      'internal_error',
      'Ocurrió un error inesperado al crear la reserva.',
      error instanceof Error ? error.message : String(error),
    )
  }
})
