import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY')
}

const createAuthClient = (req: Request) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: getAuthorizationHeader(req),
      },
    },
  })

const createAdminClient = () =>
  createClient(supabaseUrl, supabaseServiceRoleKey, {
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

const ok = (data: Record<string, unknown> = {}) => json(200, { success: true, data })

const fail = (status: number, code: string, message: string, details?: unknown) =>
  json(status, {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  })

class HttpError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestLogContext = {
  requestId: string
  action: string
  method: string
  path: string
}

const getRequestContext = (req: Request, action: string): RequestLogContext => ({
  requestId: crypto.randomUUID(),
  action: action || 'unknown',
  method: req.method,
  path: new URL(req.url).pathname,
})

const formatErrorDetails = (error: unknown) => {
  if (!error) return null
  if (error instanceof HttpError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    }
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }
  if (typeof error === 'object') return error
  return { message: String(error) }
}

const logInfo = (context: RequestLogContext, message: string, details?: Record<string, unknown>) => {
  console.log('[admin-ops]', {
    level: 'info',
    requestId: context.requestId,
    action: context.action,
    method: context.method,
    path: context.path,
    message,
    ...(details ?? {}),
  })
}

const logWarn = (context: RequestLogContext, message: string, details?: Record<string, unknown>) => {
  console.warn('[admin-ops]', {
    level: 'warn',
    requestId: context.requestId,
    action: context.action,
    method: context.method,
    path: context.path,
    message,
    ...(details ?? {}),
  })
}

const logError = (context: RequestLogContext, message: string, error?: unknown, details?: Record<string, unknown>) => {
  console.error('[admin-ops]', {
    level: 'error',
    requestId: context.requestId,
    action: context.action,
    method: context.method,
    path: context.path,
    message,
    error: formatErrorDetails(error),
    ...(details ?? {}),
  })
}

const CLIENT_SELECT_FIELDS = `
  id,
  name,
  complex_name,
  status,
  created_at,
  expires_at,
  ranking_reset_date,
  phone,
  address,
  enable_ranking,
  enable_sales,
  enable_reservations,
  enable_statistics,
  features
`

const DEFAULT_OPERATING_HOURS_PER_DAY = 14
const REALIZED_BOOKING_STATUSES = new Set(['completed', 'finished'])
const PIPELINE_BOOKING_STATUSES = new Set(['confirmed', 'pending'])

const getAuthorizationHeader = (req: Request) =>
  req.headers.get('authorization') || req.headers.get('Authorization') || ''

const resolveFeatureFlag = (
  explicitValue: unknown,
  fallbackValue: unknown,
  defaultValue = true,
) => {
  if (typeof explicitValue === 'boolean') return explicitValue
  if (typeof fallbackValue === 'boolean') return fallbackValue
  return defaultValue
}

const normalizeFeatures = (
  features?: Record<string, boolean>,
  fallback?: Record<string, unknown>,
) => ({
  reservas: resolveFeatureFlag(features?.reservas, fallback?.enable_reservations),
  ventas: resolveFeatureFlag(features?.ventas, fallback?.enable_sales),
  ranking: resolveFeatureFlag(features?.ranking, fallback?.enable_ranking),
  estadisticas: resolveFeatureFlag(features?.estadisticas, fallback?.enable_statistics),
})

const mapClientRecord = (client: Record<string, any> | null | undefined) => {
  if (!client) return client

  const features = normalizeFeatures(client.features, client)
  const featureDriftDetected =
    !client.features || (typeof client.features === 'object' && Object.keys(client.features).length === 0)

  return {
    ...client,
    features,
    enable_ranking: features.ranking,
    enable_sales: features.ventas,
    enable_reservations: features.reservas,
    enable_statistics: features.estadisticas,
    feature_drift_detected: featureDriftDetected,
  }
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

const toDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getDurationHours = (startAt: Date | null, endAt: Date | null) => {
  if (!startAt || !endAt) return 0
  const diff = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60)
  return diff > 0 ? diff : 0
}

const normalizeBookingStatus = (status: unknown, endAt: Date | null) => {
  const rawStatus = typeof status === 'string' ? status.toLowerCase() : 'pending'
  const baseStatus = rawStatus === 'finished' ? 'completed' : rawStatus

  if ((baseStatus === 'confirmed' || baseStatus === 'pending') && endAt && endAt < new Date()) {
    return 'completed'
  }

  return baseStatus
}

const extractBearerToken = (req: Request) => {
  const authHeader = getAuthorizationHeader(req).trim()
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

const parseBody = async (req: Request) => {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? body : {}
  } catch {
    return {}
  }
}

const isMissingSchemaObjectError = (error: { code?: string; message?: string } | null | undefined) => {
  const message = error?.message ?? ''
  return (
    error?.code === 'PGRST205' ||
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    error?.code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('Could not find the table') ||
    message.includes('Could not find the')
  )
}

const isRelationshipSchemaError = (error: { code?: string; message?: string } | null | undefined) => {
  const message = error?.message ?? ''
  return (
    error?.code === 'PGRST200' ||
    error?.code === 'PGRST201' ||
    message.includes('Could not find a relationship') ||
    message.includes('schema cache')
  )
}

const raiseIfQueryError = (
  error: { code?: string; message?: string; details?: string; hint?: string } | null,
  options: { status?: number; code: string; message: string; details?: Record<string, unknown> },
) => {
  if (!error) return

  throw new HttpError(
    options.status ?? 500,
    options.code,
    options.message,
    {
      query_error: {
        code: error.code ?? null,
        message: error.message ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
      ...(options.details ?? {}),
    },
  )
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const deleteByClientId = async (
  adminClient: ReturnType<typeof createAdminClient>,
  table: string,
  clientId: string,
  options?: { optional?: boolean },
) => {
  const { error } = await adminClient.from(table).delete().eq('client_id', clientId)
  if (error) {
    if (options?.optional && isMissingSchemaObjectError(error)) {
      console.warn(`[admin-ops] optional delete skipped for ${table}: ${error.message}`)
      return
    }
    throw new Error(`${table}: ${error.message}`)
  }
}

const deleteAuthUserCascade = async (
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
) => {
  // auth.users is the source of truth. Deleting there cascades to profiles and client_users.
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    throw new Error(`auth.users(${userId}): ${error.message}`)
  }
}

const getAuthUserById = async (
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
) => {
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const batch = data.users ?? []
    const found = batch.find((user: any) => user.id === userId)
    if (found) return found

    if (batch.length < perPage) break
    page += 1
  }

  return null
}

const logAdminAudit = async (
  adminClient: ReturnType<typeof createAdminClient>,
  actor: { id: string; email?: string | null; profile?: { full_name?: string | null } | null },
  entry: {
    action: string
    entity: string
    entityId?: string | null
    clientId?: string | null
    description: string
    metadata?: Record<string, unknown>
  },
) => {
  const payload = {
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    user_id: actor.id,
    user_name: actor.profile?.full_name || actor.email || 'Superadmin',
    client_id: entry.clientId ?? null,
    description: entry.description,
    details: entry.description,
    metadata: entry.metadata ?? {},
    created_at: new Date().toISOString(),
  }

  const { error } = await adminClient.from('audit_logs').insert(payload)
  if (error) {
    console.error('[admin-ops] audit log failed:', error, payload)
  }
}

const requireSuperadmin = async (req: Request, context: RequestLogContext) => {
  const token = extractBearerToken(req)

  if (!token) {
    logWarn(context, 'missing bearer token')
    return { error: fail(401, 'invalid_jwt', 'Falta el token JWT del usuario autenticado.') }
  }

  const authClient = createAuthClient(req)
  const adminClient = createAdminClient()

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token)

  if (authError || !user) {
    logWarn(context, 'jwt validation failed', {
      auth_error: authError?.message ?? null,
    })
  } else {
    logInfo(context, 'jwt validated', {
      userId: user.id,
      email: user.email ?? null,
    })
  }

  if (authError || !user) {
    return { error: fail(401, 'invalid_jwt', 'No se pudo validar la sesión del usuario.', authError?.message) }
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, client_id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    logError(context, 'profile lookup failed', profileError, {
      userId: user.id,
    })
    return {
      error: fail(
        500,
        'profile_lookup_failed',
        'No se pudo consultar el perfil del usuario autenticado.',
        profileError.message,
      ),
    }
  }

  if (!profile?.role) {
    const metadataRole =
      (typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null) ??
      (typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : null)

    logWarn(context, 'profile missing for authenticated user', {
      userId: user.id,
      metadataRole,
    })
    return {
      error: fail(
        401,
        'profile_missing',
        'El usuario autenticado no tiene perfil válido en public.profiles.',
        { user_id: user.id, metadata_role: metadataRole },
      ),
    }
  }

  if (profile.role !== 'superadmin') {
    logWarn(context, 'forbidden: non-superadmin user', {
      userId: user.id,
      profileRole: profile.role,
    })
    return {
      error: fail(403, 'forbidden', 'Acceso restringido a superadmins.', {
        user_id: user.id,
        profile_role: profile.role,
      }),
    }
  }

  logInfo(context, 'superadmin access granted', {
    userId: user.id,
    profileRole: profile.role,
  })

  return {
    adminClient,
    user,
    profile,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return ok({
      name: 'admin-ops',
      status: 'ok',
      method: 'GET',
      message: 'Use POST with { action, payload } to invoke admin operations.',
    })
  }

  if (req.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Método no permitido.')
  }

  const body = await parseBody(req)
  const action = typeof body.action === 'string' ? body.action : ''
  const payload =
    body.payload && typeof body.payload === 'object'
      ? (body.payload as Record<string, unknown>)
      : {}
  const context = getRequestContext(req, action)

  logInfo(context, 'request started', {
    hasAuthorizationHeader: Boolean(getAuthorizationHeader(req)),
    payloadKeys: Object.keys(payload),
  })

  try {
    const authContext = await requireSuperadmin(req, context)
    if ('error' in authContext) {
      return authContext.error
    }

    const { adminClient, user, profile } = authContext

    switch (action) {
      case 'get_metrics': {
        const now = new Date()
        const windowDays = 30
        const windowStart = new Date(now)
        windowStart.setUTCDate(windowStart.getUTCDate() - windowDays)
        const windowStartIso = windowStart.toISOString()

        const [
          clientsRes,
          membershipsRes,
          profilesRes,
          productsRes,
          pitchesRes,
          bookingsCountRes,
          bookingsWindowRes,
          salesCountRes,
          salesWindowRes,
          legacyFinishedBookingsRes,
        ] = await Promise.all([
          adminClient.from('clients').select(CLIENT_SELECT_FIELDS),
          adminClient.from('client_users').select('client_id, user_id, role, created_at'),
          adminClient.from('profiles').select('id, role, client_id'),
          adminClient.from('products').select('id, client_id, price, active'),
          adminClient.from('pitches').select('id, client_id, name, price, active'),
          adminClient.from('bookings').select('*', { count: 'exact', head: true }),
          adminClient
            .from('bookings')
            .select('id, client_id, pitch_id, client_phone, start_time, end_time, status, is_paid, deposit_amount, created_at')
            .gte('start_time', windowStartIso),
          adminClient.from('sales').select('*', { count: 'exact', head: true }),
          adminClient
            .from('sales')
            .select('id, client_id, total_price, created_at')
            .gte('created_at', windowStartIso),
          adminClient
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'finished'),
        ])

        const metricsQueryErrors = [
          ['clients', clientsRes.error],
          ['client_users', membershipsRes.error],
          ['profiles', profilesRes.error],
          ['products', productsRes.error],
          ['pitches', pitchesRes.error],
          ['bookings_count', bookingsCountRes.error],
          ['bookings_window', bookingsWindowRes.error],
          ['sales_count', salesCountRes.error],
          ['sales_window', salesWindowRes.error],
          ['legacy_finished_bookings', legacyFinishedBookingsRes.error],
        ].find(([, error]) => Boolean(error))

        if (metricsQueryErrors) {
          const [queryName, queryError] = metricsQueryErrors
          throw new HttpError(500, 'metrics_query_failed', 'No se pudieron cargar las métricas globales.', {
            query: queryName,
            error: formatErrorDetails(queryError),
          })
        }

        const rawClients = clientsRes.data ?? []
        const rawClientsById = new Map(rawClients.map((client: any) => [client.id, client]))
        const clients = rawClients.map((client: any) => mapClientRecord(client))
        const memberships = membershipsRes.data ?? []
        const profiles = profilesRes.data ?? []
        const products = productsRes.data ?? []
        const pitches = pitchesRes.data ?? []
        const bookings = bookingsWindowRes.data ?? []
        const sales = salesWindowRes.data ?? []

        const profilesById = new Map(profiles.map((profile: any) => [profile.id, profile]))
        const clientsById = new Map(clients.map((client: any) => [client.id, client]))
        const pitchesById = new Map(pitches.map((pitch: any) => [pitch.id, pitch]))

        const membershipsWithoutProfiles = [...new Set(
          memberships
            .map((membership: any) => membership.user_id)
            .filter((userId: string) => !profilesById.has(userId)),
        )]

        const adminsByClient = new Map<string, Set<string>>()
        for (const membership of memberships) {
          const userRole = profilesById.get(membership.user_id)?.role ?? membership.role
          if (userRole === 'superadmin') continue
          if (!membership.client_id) continue
          if (!adminsByClient.has(membership.client_id)) {
            adminsByClient.set(membership.client_id, new Set())
          }
          adminsByClient.get(membership.client_id)?.add(membership.user_id)
        }

        const tenantAdminIds = [...new Set(
          memberships
            .filter((membership: any) => (profilesById.get(membership.user_id)?.role ?? membership.role) !== 'superadmin')
            .map((membership: any) => membership.user_id),
        )]

        const summaryByClient = new Map<string, any>()
        for (const client of clients) {
          summaryByClient.set(client.id, {
            client_id: client.id,
            client_name: client.complex_name || client.name,
            status: client.status,
            admin_count: adminsByClient.get(client.id)?.size ?? 0,
            product_count: 0,
            pitch_count: 0,
            active_pitch_count: 0,
            bookings_30d: 0,
            realized_bookings_30d: 0,
            pipeline_bookings_30d: 0,
            booked_hours_30d: 0,
            occupancy_rate_estimated_30d: 0,
            average_pitch_price: 0,
            booking_revenue_estimated_30d: 0,
            sales_revenue_30d: 0,
            total_revenue_estimated_30d: 0,
            average_price_per_booking_estimated_30d: 0,
            unique_contacts_30d: 0,
            alerts: [] as string[],
          })
        }

        const pitchSummaryById = new Map<string, any>()
        for (const pitch of pitches) {
          const clientSummary = summaryByClient.get(pitch.client_id)
          if (clientSummary) {
            clientSummary.pitch_count += 1
            if (pitch.active !== false) {
              clientSummary.active_pitch_count += 1
            }
          }

          pitchSummaryById.set(pitch.id, {
            pitch_id: pitch.id,
            pitch_name: pitch.name,
            client_id: pitch.client_id,
            client_name: clientsById.get(pitch.client_id)?.complex_name || clientsById.get(pitch.client_id)?.name || 'Cliente',
            active: pitch.active !== false,
            current_price: toNumber(pitch.price),
            bookings_30d: 0,
            realized_bookings_30d: 0,
            booked_hours_30d: 0,
            occupancy_rate_estimated_30d: 0,
            revenue_estimated_30d: 0,
          })
        }

        for (const product of products) {
          const clientSummary = summaryByClient.get(product.client_id)
          if (clientSummary) {
            clientSummary.product_count += 1
          }
        }

        const bookingsByHour = new Map<number, number>()
        let realizedBookings30d = 0
        let pipelineBookings30d = 0
        let bookedHours30d = 0
        let bookingRevenueEstimated30d = 0
        let salesRevenue30d = 0
        const uniqueBookingContacts = new Set<string>()

        for (const booking of bookings) {
          const startAt = toDate(booking.start_time)
          const endAt = toDate(booking.end_time)
          const normalizedStatus = normalizeBookingStatus(booking.status, endAt)
          const durationHours = getDurationHours(startAt, endAt)
          const clientSummary = summaryByClient.get(booking.client_id)
          const pitchSummary = pitchSummaryById.get(booking.pitch_id)
          const pitch = pitchesById.get(booking.pitch_id)
          const pitchPrice = toNumber(pitch?.price)
          const startHour = startAt?.getUTCHours()

          if (typeof startHour === 'number') {
            bookingsByHour.set(startHour, (bookingsByHour.get(startHour) ?? 0) + 1)
          }

          if (booking.client_phone) {
            uniqueBookingContacts.add(`${booking.client_id}:${booking.client_phone}`)
          }

          if (clientSummary) {
            clientSummary.bookings_30d += 1
            clientSummary.booked_hours_30d += durationHours
          }

          if (pitchSummary) {
            pitchSummary.bookings_30d += 1
            pitchSummary.booked_hours_30d += durationHours
          }

          bookedHours30d += durationHours

          if (REALIZED_BOOKING_STATUSES.has(normalizedStatus)) {
            realizedBookings30d += 1
            bookingRevenueEstimated30d += pitchPrice
            if (clientSummary) {
              clientSummary.realized_bookings_30d += 1
              clientSummary.booking_revenue_estimated_30d += pitchPrice
            }
            if (pitchSummary) {
              pitchSummary.realized_bookings_30d += 1
              pitchSummary.revenue_estimated_30d += pitchPrice
            }
          } else if (PIPELINE_BOOKING_STATUSES.has(normalizedStatus)) {
            pipelineBookings30d += 1
            if (clientSummary) {
              clientSummary.pipeline_bookings_30d += 1
            }
          }
        }

        for (const sale of sales) {
          const saleAmount = toNumber(sale.total_price)
          salesRevenue30d += saleAmount

          const clientSummary = summaryByClient.get(sale.client_id)
          if (clientSummary) {
            clientSummary.sales_revenue_30d += saleAmount
          }
        }

        for (const clientSummary of summaryByClient.values()) {
          const averagePitchPrice =
            clientSummary.pitch_count > 0
              ? pitches
                  .filter((pitch: any) => pitch.client_id === clientSummary.client_id)
                  .reduce((acc: number, pitch: any) => acc + toNumber(pitch.price), 0) / clientSummary.pitch_count
              : 0

          const possibleHours30d =
            Math.max(clientSummary.active_pitch_count, 1) * windowDays * DEFAULT_OPERATING_HOURS_PER_DAY

          clientSummary.average_pitch_price = averagePitchPrice
          clientSummary.occupancy_rate_estimated_30d =
            possibleHours30d > 0 ? (clientSummary.booked_hours_30d / possibleHours30d) * 100 : 0
          clientSummary.total_revenue_estimated_30d =
            clientSummary.booking_revenue_estimated_30d + clientSummary.sales_revenue_30d
          clientSummary.average_price_per_booking_estimated_30d =
            clientSummary.realized_bookings_30d > 0
              ? clientSummary.booking_revenue_estimated_30d / clientSummary.realized_bookings_30d
              : 0
          clientSummary.unique_contacts_30d = uniqueBookingContacts.size === 0
            ? 0
            : [...uniqueBookingContacts].filter((contactKey) =>
                contactKey.startsWith(`${clientSummary.client_id}:`),
              ).length

          const client = clientsById.get(clientSummary.client_id)
          const rawClient = rawClientsById.get(clientSummary.client_id)
          const features = normalizeFeatures(rawClient?.features, rawClient)
          const featuresWereEmpty =
            !rawClient?.features ||
            (typeof rawClient.features === 'object' && Object.keys(rawClient.features).length === 0)

          if (client?.status === 'suspended' && clientSummary.bookings_30d > 0) {
            clientSummary.alerts.push('Cliente suspendido con actividad reciente.')
          }

          if (client?.expires_at) {
            const expiresAt = toDate(client.expires_at)
            const diffDays = expiresAt ? (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : null
            if (diffDays !== null && diffDays <= 7) {
              clientSummary.alerts.push('Vence en menos de 7 días.')
            }
          }

          if (featuresWereEmpty) {
            clientSummary.alerts.push('Features sin normalizar; se derivan desde toggles legacy.')
          }

          if (clientSummary.admin_count === 0) {
            clientSummary.alerts.push('Sin administrador asignado.')
          }

          if (features.estadisticas === false) {
            clientSummary.alerts.push('Módulo de estadísticas deshabilitado.')
          }
        }

        const pitchRanking = [...pitchSummaryById.values()].map((pitchSummary) => {
          const possibleHours30d = windowDays * DEFAULT_OPERATING_HOURS_PER_DAY
          return {
            ...pitchSummary,
            occupancy_rate_estimated_30d:
              possibleHours30d > 0 ? (pitchSummary.booked_hours_30d / possibleHours30d) * 100 : 0,
          }
        })

        const clientRanking = [...summaryByClient.values()].sort(
          (a, b) => b.total_revenue_estimated_30d - a.total_revenue_estimated_30d,
        )

        const occupancyAverage30d =
          pitchRanking.length > 0
            ? pitchRanking.reduce((acc, pitch) => acc + pitch.occupancy_rate_estimated_30d, 0) / pitchRanking.length
            : 0

        const averagePricePerBooking30d =
          realizedBookings30d > 0 ? bookingRevenueEstimated30d / realizedBookings30d : 0

        const hourRanking = [...bookingsByHour.entries()]
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => b.count - a.count)

        const peakHours = hourRanking.slice(0, 4)
        const lowHours = [...hourRanking]
          .filter((entry) => entry.count > 0)
          .slice(-4)
          .reverse()

        const averageClientPrice =
          clientRanking.length > 0
            ? clientRanking.reduce((acc, client) => acc + client.average_pitch_price, 0) / clientRanking.length
            : 0
        const averageClientUsage =
          clientRanking.length > 0
            ? clientRanking.reduce((acc, client) => acc + client.booked_hours_30d, 0) / clientRanking.length
            : 0
        const averageBookingsPerClient =
          clientRanking.length > 0
            ? clientRanking.reduce((acc, client) => acc + client.bookings_30d, 0) / clientRanking.length
            : 0
        const averageUniqueContacts =
          clientRanking.length > 0
            ? clientRanking.reduce((acc, client) => acc + client.unique_contacts_30d, 0) / clientRanking.length
            : 0

        const highUsageLowPrice = clientRanking.filter(
          (client) =>
            client.booked_hours_30d >= averageClientUsage &&
            client.average_pitch_price > 0 &&
            client.average_pitch_price <= averageClientPrice,
        )

        const lowActivityClients = clientRanking.filter(
          (client) => client.bookings_30d === 0 && client.sales_revenue_30d === 0,
        )

        const manyUsersLowOperationClients = clientRanking.filter(
          (client) =>
            client.unique_contacts_30d >= averageUniqueContacts &&
            client.bookings_30d <= Math.max(1, averageBookingsPerClient / 2),
        )

        const alerts = [
          membershipsWithoutProfiles.length > 0
            ? `${membershipsWithoutProfiles.length} administradores siguen sin fila en profiles.`
            : null,
          (legacyFinishedBookingsRes.count ?? 0) > 0
            ? `${legacyFinishedBookingsRes.count ?? 0} reservas siguen con estado legacy "finished".`
            : null,
          clientRanking.some((client) => client.alerts.length > 0)
            ? `${clientRanking.filter((client) => client.alerts.length > 0).length} clientes requieren revisión operativa.`
            : null,
        ].filter(Boolean)

        return ok({
          metrics: {
            clients: clients.length,
            users: tenantAdminIds.length,
            products: products.length,
            sales: salesCountRes.count || 0,
            bookings: bookingsCountRes.count || 0,
            pitches: pitches.length,
            revenue_estimated_30d: bookingRevenueEstimated30d + salesRevenue30d,
            booking_revenue_estimated_30d: bookingRevenueEstimated30d,
            sales_revenue_30d: salesRevenue30d,
            occupancy_average_30d: occupancyAverage30d,
            average_price_per_booking_30d: averagePricePerBooking30d,
            peak_hour: peakHours[0]?.hour ?? null,
            low_hour: lowHours[0]?.hour ?? null,
          },
          analytics: {
            generated_at: now.toISOString(),
            window_days: windowDays,
            summary: {
              clients_total: clients.length,
              clients_active: clients.filter((client: any) => client.status === 'active').length,
              clients_suspended: clients.filter((client: any) => client.status === 'suspended').length,
              tenant_admins_total: tenantAdminIds.length,
              pitches_total: pitches.length,
              products_total: products.length,
              bookings_total_30d: bookings.length,
              bookings_realized_30d: realizedBookings30d,
              bookings_pipeline_30d: pipelineBookings30d,
              booked_hours_30d: bookedHours30d,
              unique_booking_contacts_30d: uniqueBookingContacts.size,
              sales_total_all_time: salesCountRes.count || 0,
              bookings_total_all_time: bookingsCountRes.count || 0,
            },
            clients: {
              ranking: clientRanking,
              low_activity: lowActivityClients,
              high_usage_low_price: highUsageLowPrice,
              many_users_low_operation: manyUsersLowOperationClients,
            },
            pitches: {
              ranking: [...pitchRanking].sort((a, b) => b.revenue_estimated_30d - a.revenue_estimated_30d),
              most_profitable: [...pitchRanking]
                .sort((a, b) => b.revenue_estimated_30d - a.revenue_estimated_30d)
                .slice(0, 5),
              least_profitable: [...pitchRanking]
                .sort((a, b) => a.revenue_estimated_30d - b.revenue_estimated_30d)
                .slice(0, 5),
            },
            reservations: {
              total_30d: bookings.length,
              realized_30d: realizedBookings30d,
              pipeline_30d: pipelineBookings30d,
              peak_hours: peakHours,
              low_hours: lowHours,
            },
            revenue: {
              sales_30d: salesRevenue30d,
              booking_estimated_30d: bookingRevenueEstimated30d,
              total_estimated_30d: bookingRevenueEstimated30d + salesRevenue30d,
              average_price_per_booking_estimated_30d: averagePricePerBooking30d,
            },
            occupancy: {
              average_30d: occupancyAverage30d,
            },
            alerts,
            data_quality: {
              booking_revenue_is_estimated: true,
              occupancy_is_estimated: true,
              legacy_memberships_without_profile: membershipsWithoutProfiles.length,
              clients_with_empty_features:
                rawClients.filter(
                  (client: any) =>
                    !client.features || (typeof client.features === 'object' && Object.keys(client.features).length === 0),
                ).length,
              bookings_with_finished_status: legacyFinishedBookingsRes.count || 0,
              notes: [
                'La facturación por turnos se estima con el precio actual de la cancha porque bookings no guarda snapshot de precio.',
                `La ocupación usa una ventana estándar de ${DEFAULT_OPERATING_HOURS_PER_DAY} horas por día porque no existen horarios operativos por cliente/cancha.`,
              ],
            },
          },
        })
      }

      case 'list_clients': {
        const { data, error } = await adminClient
          .from('clients')
          .select(CLIENT_SELECT_FIELDS)
          .order('created_at', { ascending: false })

        raiseIfQueryError(error, {
          code: 'list_clients_query_failed',
          message: 'No se pudieron cargar los clientes.',
        })

        return ok({ clients: (data ?? []).map((client: any) => mapClientRecord(client)) })
      }

      case 'list_users': {
        let memberships: any[] = []
        let membershipsIncludeClient = true

        const membershipRes = await adminClient
          .from('client_users')
          .select(`
            user_id,
            role,
            created_at,
            client_id,
            clients (
              id,
              name,
              complex_name
            )
          `)
          .order('created_at', { ascending: false })

        if (membershipRes.error) {
          if (isRelationshipSchemaError(membershipRes.error)) {
            logWarn(context, 'list_users relation lookup failed, using fallback query', {
              relationError: membershipRes.error.message,
            })
            membershipsIncludeClient = false

            const fallbackMembershipRes = await adminClient
              .from('client_users')
              .select('user_id, role, created_at, client_id')
              .order('created_at', { ascending: false })

            raiseIfQueryError(fallbackMembershipRes.error, {
              code: 'list_users_query_failed',
              message: 'No se pudieron cargar los usuarios administradores.',
              details: { step: 'client_users_fallback' },
            })

            memberships = fallbackMembershipRes.data ?? []
          } else {
            raiseIfQueryError(membershipRes.error, {
              code: 'list_users_query_failed',
              message: 'No se pudieron cargar los usuarios administradores.',
              details: { step: 'client_users_primary' },
            })
          }
        } else {
          memberships = membershipRes.data ?? []
        }

        const userIds = [...new Set(memberships.map((membership: any) => membership.user_id).filter(Boolean))]

        if (userIds.length === 0) {
          return ok({ users: [] })
        }

        const { data: profiles, error: profilesError } = await adminClient
          .from('profiles')
          .select('id, role, client_id, full_name, phone')
          .in('id', userIds)

        raiseIfQueryError(profilesError, {
          code: 'list_users_profiles_query_failed',
          message: 'No se pudieron cargar los perfiles asociados a los usuarios.',
        })

        const authUsers: any[] = []
        let page = 1
        const perPage = 1000

        while (true) {
          const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
          raiseIfQueryError(error, {
            code: 'list_users_auth_query_failed',
            message: 'No se pudieron cargar los usuarios de auth.',
            details: { page },
          })

          const batch = data.users ?? []
          authUsers.push(...batch)

          if (batch.length < perPage) break
          page += 1
        }

        const authUsersById = new Map(authUsers.map((item) => [item.id, item]))
        const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))
        const clientIds = [...new Set(memberships.map((membership: any) => membership.client_id).filter(Boolean))]
        const fallbackClientsById = new Map<string, { id: string; name: string; complex_name: string | null }>()

        if (!membershipsIncludeClient && clientIds.length > 0) {
          const { data: clients, error: clientsError } = await adminClient
            .from('clients')
            .select('id, name, complex_name')
            .in('id', clientIds)

          raiseIfQueryError(clientsError, {
            code: 'list_users_clients_query_failed',
            message: 'No se pudieron cargar los clientes asociados a los usuarios.',
          })

          for (const client of clients ?? []) {
            fallbackClientsById.set(client.id, client)
          }
        }

        const users = memberships
          .map((membership: any) => {
            const authUser = authUsersById.get(membership.user_id)
            const profile = profilesById.get(membership.user_id)
            const membershipClient = membership.clients ?? fallbackClientsById.get(membership.client_id)

            if (!profile?.role || profile.role === 'superadmin') {
              return null
            }

            return {
              id: membership.user_id,
              email: authUser?.email ?? null,
              created_at: authUser?.created_at ?? membership.created_at ?? null,
              last_sign_in_at: authUser?.last_sign_in_at ?? null,
              role: profile.role,
              membership_role: membership.role,
              client_id: profile.client_id ?? null,
              client: membershipClient
                ? {
                    id: membershipClient.id,
                    name: membershipClient.complex_name || membershipClient.name,
                  }
                : null,
              profile: {
                name: profile.full_name ?? authUser?.email ?? 'Administrador',
                phone: profile?.phone ?? authUser?.phone ?? null,
              },
            }
          })
          .filter(Boolean)

        return ok({ users })
      }

      case 'list_audit_logs': {
        try {
          const rawClientId = payload.clientId
          if (rawClientId !== undefined && typeof rawClientId !== 'string') {
            return fail(400, 'validation_error', 'clientId debe ser string cuando se envia.')
          }

          const clientId = typeof rawClientId === 'string' ? rawClientId.trim() : ''
          if (clientId && !isUuid(clientId)) {
            return fail(400, 'validation_error', 'clientId no es un UUID valido.')
          }

          const rawLimit = payload.limit
          if (rawLimit !== undefined && (typeof rawLimit !== 'number' || !Number.isFinite(rawLimit))) {
            return fail(400, 'validation_error', 'limit debe ser numerico cuando se envia.')
          }

          const limit =
            typeof rawLimit === 'number'
              ? Math.min(Math.max(Math.trunc(rawLimit), 1), 500)
              : 300

          let query = adminClient
            .from('audit_logs')
            .select(`
              id,
              action,
              entity,
              entity_id,
              user_id,
              user_name,
              details,
              description,
              metadata,
              created_at,
              client_id,
              clients (
                id,
                name,
                complex_name
              )
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

          if (clientId) {
            query = query.eq('client_id', clientId)
          }

          const { data, error } = await query
          if (!error) {
            return ok({ logs: data ?? [] })
          }

          logWarn(context, 'list_audit_logs primary query failed, using fallback query', {
            queryError: error.message,
          })

          let fallbackQuery = adminClient
            .from('audit_logs')
            .select(`
              id,
              action,
              entity,
              entity_id,
              user_id,
              user_name,
              details,
              description,
              metadata,
              created_at,
              client_id
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

          if (clientId) {
            fallbackQuery = fallbackQuery.eq('client_id', clientId)
          }

          const { data: fallbackData, error: fallbackError } = await fallbackQuery
          if (fallbackError) {
            logError(context, 'list_audit_logs fallback query failed', fallbackError)
            return fail(500, 'audit_logs_query_failed', 'No se pudo consultar audit_logs.', fallbackError.message)
          }

          return ok({ logs: fallbackData ?? [] })
        } catch (error) {
          logError(context, 'list_audit_logs unexpected error', error)
          return fail(
            500,
            'audit_logs_unexpected_error',
            'Fallo inesperado al cargar auditorias.',
            formatErrorDetails(error),
          )
        }
      }

      case 'create_client': {
        const clientInput = ((payload.client as Record<string, unknown>) ?? payload) as Record<string, any>
        const name = typeof clientInput.name === 'string' ? clientInput.name.trim() : ''
        const complexName =
          typeof clientInput.complex_name === 'string' && clientInput.complex_name.trim()
            ? clientInput.complex_name.trim()
            : name

        if (!name) {
          return fail(400, 'validation_error', 'El nombre del cliente es obligatorio.')
        }

        const features = normalizeFeatures(clientInput.features)

        const { data, error } = await adminClient
          .from('clients')
          .insert({
            name,
            complex_name: complexName,
            status: clientInput.status ?? 'active',
            expires_at: clientInput.expires_at ?? null,
            ranking_reset_date: clientInput.ranking_reset_date ?? null,
            phone: clientInput.phone ?? null,
            address: clientInput.address ?? null,
            enable_ranking: features.ranking,
            enable_sales: features.ventas,
            enable_reservations: features.reservas,
            enable_statistics: features.estadisticas,
            features,
          })
          .select(CLIENT_SELECT_FIELDS)
          .maybeSingle()

        if (error) throw error

        await logAdminAudit(adminClient, {
          id: user.id,
          email: user.email ?? null,
          profile,
        }, {
          action: 'Cliente creado',
          entity: 'client',
          entityId: data?.id,
          clientId: data?.id,
          description: `Se creo el cliente ${complexName}`,
          metadata: {
            name,
            complex_name: complexName,
            phone: clientInput.phone ?? null,
            address: clientInput.address ?? null,
            features,
          },
        })

        return ok({ client: mapClientRecord(data as Record<string, any>) })
      }

      case 'update_client': {
        const clientId = typeof payload.clientId === 'string' ? payload.clientId : ''
        const updates =
          payload.updates && typeof payload.updates === 'object'
            ? ({ ...payload.updates } as Record<string, any>)
            : {}

        if (!clientId) {
          return fail(400, 'validation_error', 'clientId es obligatorio.')
        }

        if (updates.features) {
          const features = normalizeFeatures(updates.features)
          updates.features = features
          updates.enable_ranking = features.ranking
          updates.enable_sales = features.ventas
          updates.enable_reservations = features.reservas
          updates.enable_statistics = features.estadisticas
        }

        const { data, error } = await adminClient
          .from('clients')
          .update(updates)
          .eq('id', clientId)
          .select(CLIENT_SELECT_FIELDS)
          .single()

        if (error) throw error

        await logAdminAudit(adminClient, {
          id: user.id,
          email: user.email ?? null,
          profile,
        }, {
          action: 'Cliente actualizado',
          entity: 'client',
          entityId: data?.id,
          clientId: data?.id,
          description: `Se actualizo la configuracion del cliente ${data?.complex_name || data?.name || clientId}`,
          metadata: {
            changes: updates,
          },
        })

        return ok({ client: mapClientRecord(data as Record<string, any>) })
      }

      case 'delete_client': {
        const clientId = typeof payload.clientId === 'string' ? payload.clientId : ''

        if (!clientId) {
          return fail(400, 'validation_error', 'clientId es obligatorio.')
        }

        const { data: clientBeforeDelete, error: clientReadError } = await adminClient
          .from('clients')
          .select('id, name, complex_name, status')
          .eq('id', clientId)
          .maybeSingle()

        if (clientReadError) throw clientReadError

        const { data: memberships, error: membershipError } = await adminClient
          .from('client_users')
          .select('user_id')
          .eq('client_id', clientId)

        if (membershipError) throw membershipError

        await Promise.all([
          deleteByClientId(adminClient, 'notifications', clientId),
          deleteByClientId(adminClient, 'audit_logs', clientId),
          deleteByClientId(adminClient, 'stock_movements', clientId),
          deleteByClientId(adminClient, 'sales', clientId),
          deleteByClientId(adminClient, 'products', clientId),
          deleteByClientId(adminClient, 'bookings', clientId),
          deleteByClientId(adminClient, 'players', clientId, { optional: true }),
          deleteByClientId(adminClient, 'deactivated_slots', clientId),
          deleteByClientId(adminClient, 'pitches', clientId),
        ])

        const userIds = [...new Set((memberships ?? []).map((membership: any) => membership.user_id).filter(Boolean))]

        for (const userId of userIds) {
          const { data: membershipProfile, error: membershipProfileError } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', userId as string)
            .maybeSingle()

          if (membershipProfileError) throw membershipProfileError

          if (membershipProfile?.role === 'superadmin') {
            console.warn(`[admin-ops] skipping superadmin user during client delete: ${userId}`)
            continue
          }
          await deleteAuthUserCascade(adminClient, userId as string)
        }

        const { error: deleteClientError } = await adminClient
          .from('clients')
          .delete()
          .eq('id', clientId)

        if (deleteClientError) throw deleteClientError

        await logAdminAudit(adminClient, {
          id: user.id,
          email: user.email ?? null,
          profile,
        }, {
          action: 'Cliente eliminado',
          entity: 'client',
          entityId: clientId,
          clientId: null,
          description: `Se elimino el cliente ${clientBeforeDelete?.complex_name || clientBeforeDelete?.name || clientId}`,
          metadata: {
            deleted_client_id: clientId,
            deleted_client_name: clientBeforeDelete?.complex_name || clientBeforeDelete?.name || null,
            deleted_client_status: clientBeforeDelete?.status || null,
            deleted_admins: userIds.length,
          },
        })

        return ok({ deleted: true, clientId })
      }

      case 'create_admin': {
        const clientId =
          typeof payload.clientId === 'string'
            ? payload.clientId
            : typeof payload.client_id === 'string'
              ? payload.client_id
              : ''
        const email = typeof payload.email === 'string' ? payload.email.trim() : ''
        const password = typeof payload.password === 'string' ? payload.password : ''
        const name =
          typeof payload.name === 'string'
            ? payload.name
            : typeof payload.full_name === 'string'
              ? payload.full_name
              : email

        if (!clientId || !email || !password) {
          return fail(400, 'validation_error', 'clientId, email y password son obligatorios.')
        }

        const { data: authResult, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        })

        if (authError || !authResult.user) {
          throw authError ?? new Error('No se pudo crear el usuario administrador.')
        }

        const createdUser = authResult.user

        const { error: profileError } = await adminClient.from('profiles').insert({
          id: createdUser.id,
          role: 'admin',
          client_id: clientId,
          full_name: name,
          phone: null,
        })

        const profileCreated = !profileError

        if (profileError) {
          await adminClient.auth.admin.deleteUser(createdUser.id)
          throw profileError
        }

        const { error: membershipError } = await adminClient.from('client_users').insert({
          client_id: clientId,
          user_id: createdUser.id,
          role: 'admin',
        })

        if (membershipError) {
          if (profileCreated) {
            await adminClient.from('profiles').delete().eq('id', createdUser.id)
          }
          await adminClient.auth.admin.deleteUser(createdUser.id)
          throw membershipError
        }

        await logAdminAudit(adminClient, {
          id: user.id,
          email: user.email ?? null,
          profile,
        }, {
          action: 'Admin creado',
          entity: 'admin',
          entityId: createdUser.id,
          clientId,
          description: `Se creo el admin ${email}`,
          metadata: {
            email,
            client_id: clientId,
            name,
          },
        })

        return ok({
          user: {
            id: createdUser.id,
            email: createdUser.email ?? email,
            role: 'admin',
            client_id: clientId,
            created_at: createdUser.created_at,
            last_sign_in_at: createdUser.last_sign_in_at ?? null,
          },
        })
      }

      case 'delete_admin': {
        const userId =
          typeof payload.userId === 'string'
            ? payload.userId
            : typeof payload.user_id === 'string'
              ? payload.user_id
              : ''

        if (!userId) {
          return fail(400, 'validation_error', 'userId es obligatorio.')
        }

        const { data: targetProfile, error: profileReadError } = await adminClient
          .from('profiles')
          .select('role, client_id')
          .eq('id', userId)
          .maybeSingle()

        if (profileReadError) throw profileReadError

        const { data: memberships, error: membershipReadError } = await adminClient
          .from('client_users')
          .select('user_id, role, client_id')
          .eq('user_id', userId)

        if (membershipReadError) throw membershipReadError

        const authUser = await getAuthUserById(adminClient, userId)
        const derivedRole =
          targetProfile?.role ??
          null
        if (!derivedRole) {
          return fail(404, 'not_found', 'No se encontró el usuario administrador.')
        }

        if (derivedRole === 'superadmin') {
          return fail(403, 'forbidden', 'No se puede eliminar un superadmin desde este panel.')
        }

        if (derivedRole !== 'admin') {
          return fail(403, 'forbidden', 'Solo se pueden eliminar administradores desde este panel.')
        }

        const targetClientId =
          (memberships ?? [])[0]?.client_id ??
          targetProfile?.client_id ??
          null

        await deleteAuthUserCascade(adminClient, userId)

        await logAdminAudit(adminClient, {
          id: user.id,
          email: user.email ?? null,
          profile,
        }, {
          action: 'Admin eliminado',
          entity: 'admin',
          entityId: userId,
          clientId: targetClientId,
          description: `Se elimino el admin ${authUser?.email ?? userId}`,
          metadata: {
            deleted_user_id: userId,
            deleted_email: authUser?.email ?? null,
            client_id: targetClientId,
          },
        })

        return ok({ deleted: true, userId })
      }

      default:
        return fail(400, 'invalid_action', 'Acción no válida.', action)
    }
  } catch (error) {
    if (error instanceof HttpError) {
      logError(context, 'request failed with handled error', error)
      return fail(error.status, error.code, error.message, error.details)
    }

    logError(context, 'unhandled request error', error)
    return fail(500, 'internal_error', 'Error inesperado en admin-ops.', formatErrorDetails(error))
  }
})
