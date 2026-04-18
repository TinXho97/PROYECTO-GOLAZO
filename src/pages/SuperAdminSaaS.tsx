import { useState, useEffect, type FormEvent } from 'react';
import { Users, Activity, X, Calendar, Power, Search, Trash2, Plus, LayoutDashboard, Building2, BarChart2, Settings, LogOut, MoreVertical, CheckCircle2, XCircle, ExternalLink, RefreshCw, Package, ShoppingCart, CircleDollarSign, Clock3, AlertTriangle, ShieldCheck, SlidersHorizontal, Gauge } from 'lucide-react';
import { getSupabaseAnonKey, getSupabaseUrl, supabase } from '../lib/supabase';
import { Client } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast, Toaster } from 'sonner';
import { dataService } from '../services/dataService';

type ClientFeatureKey = 'reservas' | 'ventas' | 'ranking' | 'estadisticas';

interface SuperAdminUser {
  id: string;
  email: string | null;
  created_at?: string;
  last_sign_in_at?: string;
  role?: string;
  client_id?: string;
  profile?: {
    name?: string;
    phone?: string | null;
  };
  client?: {
    id: string;
    name: string;
  } | null;
}

interface SuperAdminMetricsSummary {
  clients: number;
  users: number;
  products: number;
  sales: number;
  bookings: number;
  pitches: number;
  revenue_estimated_30d: number;
  booking_revenue_estimated_30d: number;
  sales_revenue_30d: number;
  occupancy_average_30d: number;
  average_price_per_booking_30d: number;
  peak_hour: number | null;
  low_hour: number | null;
}

interface SuperAdminRankedClient {
  client_id: string;
  client_name: string;
  status: 'active' | 'suspended';
  admin_count: number;
  product_count: number;
  pitch_count: number;
  active_pitch_count: number;
  bookings_30d: number;
  realized_bookings_30d: number;
  pipeline_bookings_30d: number;
  booked_hours_30d: number;
  occupancy_rate_estimated_30d: number;
  average_pitch_price: number;
  booking_revenue_estimated_30d: number;
  sales_revenue_30d: number;
  total_revenue_estimated_30d: number;
  average_price_per_booking_estimated_30d: number;
  unique_contacts_30d: number;
  alerts: string[];
}

interface SuperAdminRankedPitch {
  pitch_id: string;
  pitch_name: string;
  client_id: string;
  client_name: string;
  active: boolean;
  current_price: number;
  bookings_30d: number;
  realized_bookings_30d: number;
  booked_hours_30d: number;
  occupancy_rate_estimated_30d: number;
  revenue_estimated_30d: number;
}

interface SuperAdminAnalytics {
  generated_at: string;
  window_days: number;
  summary: {
    clients_total: number;
    clients_active: number;
    clients_suspended: number;
    tenant_admins_total: number;
    pitches_total: number;
    products_total: number;
    bookings_total_30d: number;
    bookings_realized_30d: number;
    bookings_pipeline_30d: number;
    booked_hours_30d: number;
    unique_booking_contacts_30d: number;
    sales_total_all_time: number;
    bookings_total_all_time: number;
  };
  clients: {
    ranking: SuperAdminRankedClient[];
    low_activity: SuperAdminRankedClient[];
    high_usage_low_price: SuperAdminRankedClient[];
    many_users_low_operation: SuperAdminRankedClient[];
  };
  pitches: {
    ranking: SuperAdminRankedPitch[];
    most_profitable: SuperAdminRankedPitch[];
    least_profitable: SuperAdminRankedPitch[];
  };
  reservations: {
    total_30d: number;
    realized_30d: number;
    pipeline_30d: number;
    peak_hours: Array<{ hour: number; count: number }>;
    low_hours: Array<{ hour: number; count: number }>;
  };
  revenue: {
    sales_30d: number;
    booking_estimated_30d: number;
    total_estimated_30d: number;
    average_price_per_booking_estimated_30d: number;
  };
  occupancy: {
    average_30d: number;
  };
  alerts: string[];
  data_quality: {
    booking_revenue_is_estimated: boolean;
    occupancy_is_estimated: boolean;
    legacy_memberships_without_profile: number;
    clients_with_empty_features: number;
    bookings_with_finished_status: number;
    notes: string[];
  };
}

interface ClientSettingsDraft {
  name: string;
  complex_name: string;
  phone: string;
  address: string;
  status: 'active' | 'suspended';
  expires_at: string;
  ranking_reset_date: string;
  features: Record<ClientFeatureKey, boolean>;
}

const DEFAULT_FEATURES: Record<ClientFeatureKey, boolean> = {
  reservas: true,
  ventas: true,
  ranking: true,
  estadisticas: true,
};

const FEATURE_LABELS: Record<ClientFeatureKey, string> = {
  reservas: 'Reservas',
  ventas: 'Ventas',
  ranking: 'Ranking',
  estadisticas: 'Estadísticas',
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const resolveClientFeatures = (client?: Partial<Client> | null): Record<ClientFeatureKey, boolean> => ({
  reservas: client?.features?.reservas ?? client?.enable_reservations ?? true,
  ventas: client?.features?.ventas ?? client?.enable_sales ?? true,
  ranking: client?.features?.ranking ?? client?.enable_ranking ?? true,
  estadisticas: client?.features?.estadisticas ?? client?.enable_statistics ?? true,
});

const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);
const formatPercent = (value: number) => `${percentFormatter.format(Number.isFinite(value) ? value : 0)}%`;
const formatHourLabel = (hour: number | null | undefined) =>
  typeof hour === 'number' ? `${String(hour).padStart(2, '0')}:00` : 'Sin dato';
const formatDateInputValue = (value?: string | null) => (value ? value.slice(0, 10) : '');
const hasLegacyFeatureDrift = (client: Client) =>
  (client as Client & { feature_drift_detected?: boolean }).feature_drift_detected === true ||
  !client.features ||
  Object.keys(client.features).length === 0;
const createClientSettingsDraft = (client: Client): ClientSettingsDraft => ({
  name: client.name || '',
  complex_name: client.complex_name || client.name || '',
  phone: client.phone || '',
  address: client.address || '',
  status: client.status,
  expires_at: formatDateInputValue(client.expires_at),
  ranking_reset_date: formatDateInputValue(client.ranking_reset_date),
  features: resolveClientFeatures(client),
});

export default function SuperAdminSaaS() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'users' | 'metrics' | 'settings'>('dashboard');
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLoginAsClient = (client: Client) => {
    dataService.setSelectedClientContext(client.id);
    window.location.href = '/dashboard';
  };

  // User creation state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<SuperAdminMetricsSummary>({
    clients: 0,
    users: 0,
    products: 0,
    sales: 0,
    bookings: 0,
    pitches: 0,
    revenue_estimated_30d: 0,
    booking_revenue_estimated_30d: 0,
    sales_revenue_30d: 0,
    occupancy_average_30d: 0,
    average_price_per_booking_30d: 0,
    peak_hour: null,
    low_hour: null,
  });
  const [metricsAnalytics, setMetricsAnalytics] = useState<SuperAdminAnalytics | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [selectedSettingsClientId, setSelectedSettingsClientId] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<ClientSettingsDraft | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    client_id: '',
    create_new_client: true,
    client_name: '',
    complex_name: '',
    phone: '',
    address: '',
    features: { ...DEFAULT_FEATURES }
  });

  const invokeAdminOpViaFetch = async <T,>(action: string, payload: Record<string, unknown> = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Sesion expirada. Inicia sesion nuevamente.');
    }

    const adminOpsUrl = `${getSupabaseUrl()}/functions/v1/admin-ops`;

    const response = await fetch(adminOpsUrl, {
      method: 'POST',
      headers: {
        apikey: getSupabaseAnonKey(),
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({ action, payload }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const code = data?.error?.code;
      const message = data?.error?.message || data?.error;

      if (code === 'invalid_jwt' || code === 'profile_missing') {
        await dataService.logout();
        window.location.href = '/panel-interno-golazo-admin';
        throw new Error('Sesion invalida. Volve a iniciar sesion.');
      }

      if (code === 'forbidden') {
        throw new Error('No tenes permisos de superadmin.');
      }

      if (response.status === 404) {
        throw new Error('La funcion admin-ops no esta disponible en Supabase.');
      }

      throw new Error(message || `admin-ops devolvio ${response.status}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || 'Error inesperado en admin-ops');
    }

    return data.data as T;
  };

  const invokeAdminOp = async <T,>(action: string, payload: Record<string, unknown> = {}) => {
    return invokeAdminOpViaFetch<T>(action, payload);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const response = await fetch(`${getSupabaseUrl()}/functions/v1/admin-ops`, {
      method: 'POST',
      headers: {
        apikey: getSupabaseAnonKey(),
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const code = data?.error?.code;
      const message = data?.error?.message || data?.error;

      if (code === 'invalid_jwt' || code === 'profile_missing') {
          await dataService.logout();
          window.location.href = '/panel-interno-golazo-admin';
          throw new Error('Tu sesión ya no es válida. Volvé a iniciar sesión.');
        }

      if (code === 'forbidden') {
          throw new Error('No tenés permisos de superadmin.');
        }

      if (response.status === 404) {
        throw new Error('La funciÃ³n admin-ops no estÃ¡ disponible en Supabase.');
      }

      throw new Error(message || `admin-ops devolviÃ³ ${response.status}`);
    }

    if (!data?.success) throw new Error(data?.error?.message || 'Error inesperado en admin-ops');
    return data.data as T;
  };

  const resetNewUser = () => {
    setNewUser({
      email: '',
      password: '',
      client_id: '',
      create_new_client: true,
      client_name: '',
      complex_name: '',
      phone: '',
      address: '',
      features: { ...DEFAULT_FEATURES }
    });
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const currentUser = await dataService.login(email, password);

      if (!currentUser || currentUser.role !== 'superadmin') {
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de superadmin');
      }

      setIsAuthenticated(true);
      await Promise.all([fetchClients(), fetchUsers(), fetchMetrics()]);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setIsMetricsLoading(true);
    try {
      const data = await invokeAdminOp<{ metrics: SuperAdminMetricsSummary; analytics: SuperAdminAnalytics }>('get_metrics');
      setMetrics(data.metrics);
      setMetricsAnalytics(data.analytics);
    } catch (e) {
      console.error('Error fetching metrics:', e);
      toast.error('No se pudieron cargar las métricas globales');
    } finally {
      setIsMetricsLoading(false);
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await invokeAdminOp<{ clients: Client[] }>('list_clients');
      setClients(data.clients || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast.error('No se pudieron cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    const data = await invokeAdminOp<{ client: Client }>('update_client', { clientId, updates });
    setClients((prev) => prev.map((client) => (client.id === clientId ? data.client : client)));
    return data.client;
  };

  const toggleClientStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'suspended' : 'active';
    try {
      await updateClient(client.id, { status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('No se pudo actualizar el estado del cliente');
    }
  };

  const extendExpiration = async (client: Client, days: number) => {
    const currentExp = client.expires_at ? new Date(client.expires_at) : new Date();
    const newExp = new Date(currentExp);
    newExp.setDate(newExp.getDate() + days);
    
    try {
      await updateClient(client.id, { expires_at: newExp.toISOString() });
    } catch (err) {
      console.error('Error extending expiration:', err);
      toast.error('No se pudo extender el vencimiento');
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!window.confirm(`¿Estás seguro de eliminar el cliente ${client.complex_name || client.name}? Esta acción borrará también sus administradores y datos asociados.`)) return;

    try {
      setOpenMenuId(null);
      await invokeAdminOp('delete_client', { clientId: client.id });
      toast.success('Cliente eliminado');
      await Promise.all([fetchClients(), fetchUsers(), fetchMetrics()]);
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar cliente');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await invokeAdminOp<{ users: SuperAdminUser[] }>('list_users');
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error.message || error);
      toast.error('Error al cargar usuarios: ' + (error.message || 'Error desconocido'));
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      const currentUser = await dataService.getCurrentUser();
      const isSuperadmin = currentUser?.role === 'superadmin';
      setIsAuthenticated(!!isSuperadmin);

      if (isSuperadmin) {
        await Promise.all([fetchClients(), fetchUsers(), fetchMetrics()]);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!clients.length) {
      setSelectedSettingsClientId('');
      setSettingsDraft(null);
      return;
    }

    if (!selectedSettingsClientId || !clients.some((client) => client.id === selectedSettingsClientId)) {
      setSelectedSettingsClientId(clients[0].id);
      return;
    }

    const selectedClient = clients.find((client) => client.id === selectedSettingsClientId);
    if (selectedClient) {
      setSettingsDraft(createClientSettingsDraft(selectedClient));
    }
  }, [clients, selectedSettingsClientId]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let clientId = newUser.client_id;

      if (newUser.create_new_client) {
        const clientResponse = await invokeAdminOp<{ client: Client }>('create_client', {
          client: {
            name: newUser.client_name || newUser.complex_name,
            complex_name: newUser.complex_name,
            phone: newUser.phone,
            address: newUser.address,
            features: newUser.features
          }
        });
        clientId = clientResponse.client.id;
      }

      await invokeAdminOp('create_admin', {
        clientId,
        email: newUser.email,
        password: newUser.password,
        name: newUser.client_name || newUser.complex_name
      });

      toast.success('Usuario y cliente creados exitosamente');
      setIsUserModalOpen(false);
      resetNewUser();
      await Promise.all([fetchClients(), fetchUsers(), fetchMetrics()]);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      await invokeAdminOp('delete_admin', { userId });
      toast.success('Usuario eliminado');
      await Promise.all([fetchUsers(), fetchMetrics()]);
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  const resetRanking = async (client: Client) => {
    if (!window.confirm(`¿Estás seguro de que deseas resetear el ranking para el cliente ${client.name}?`)) return;
    
    try {
      const resetDate = new Date().toISOString();
      await updateClient(client.id, { ranking_reset_date: resetDate });
    } catch (error) {
      console.error('Error resetting ranking:', error);
      toast.error('No se pudo resetear el ranking');
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedSettingsClientId || !settingsDraft) {
      toast.error('Selecciona un cliente para editar su configuración.');
      return;
    }

    setIsSavingSettings(true);
    try {
      const updatedClient = await updateClient(selectedSettingsClientId, {
        name: settingsDraft.name.trim() || settingsDraft.complex_name.trim(),
        complex_name: settingsDraft.complex_name.trim() || settingsDraft.name.trim(),
        phone: settingsDraft.phone.trim() || null,
        address: settingsDraft.address.trim() || null,
        status: settingsDraft.status,
        expires_at: settingsDraft.expires_at ? new Date(`${settingsDraft.expires_at}T00:00:00`).toISOString() : null,
        ranking_reset_date: settingsDraft.ranking_reset_date
          ? new Date(`${settingsDraft.ranking_reset_date}T00:00:00`).toISOString()
          : null,
        features: settingsDraft.features,
      });

      setSettingsDraft(createClientSettingsDraft(updatedClient));
      toast.success('Configuración del cliente actualizada');
      await fetchMetrics();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar la configuración');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePanelLogout = async () => {
    await dataService.logout();
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
        
        <div className="bg-[#111827]/80 backdrop-blur-xl p-10 rounded-[32px] w-full max-w-md border border-white/5 shadow-2xl relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20 p-2">
              <img src="https://i.postimg.cc/2y1YR7V8/Logo-de-SUR-Byte-S-con-robot-naranja.png" alt="SUR ByteS Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">SUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FF8F00]">ByteS</span></h1>
            <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">SaaS Control Panel</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email de superadmin"
                className="w-full bg-[#0B0F19] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#FF6B00] transition-colors placeholder:text-slate-600 mb-4"
                autoFocus
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full bg-[#0B0F19] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#FF6B00] transition-colors placeholder:text-slate-600"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-xl border border-red-400/20">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8F00] hover:from-[#FF8F00] hover:to-[#FF6B00] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#FF6B00]/25 uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.status === 'active').length;
  const suspendedClients = clients.filter(c => c.status === 'suspended').length;
  const tenantUsers = users.filter((user) => user.role !== 'superadmin');
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.complex_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedSettingsClient = clients.find((client) => client.id === selectedSettingsClientId) || null;
  const expiringSoonClients = clients.filter((client) => {
    if (!client.expires_at) return false;
    const expiresAt = new Date(client.expires_at);
    const diffMs = expiresAt.getTime() - Date.now();
    return diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24 * 7;
  });
  const clientsWithoutAdmins = clients.filter((client) => !tenantUsers.some((user) => user.client_id === client.id));
  const clientsWithLegacyFeatures = clients.filter(hasLegacyFeatureDrift);
  const topClientMetrics = metricsAnalytics?.clients.ranking.slice(0, 6) ?? [];
  const topPitchMetrics = metricsAnalytics?.pitches.most_profitable ?? [];
  const weakestPitchMetrics = metricsAnalytics?.pitches.least_profitable ?? [];
  const systemScope = [
    'Altas, bajas y suspensión de clientes.',
    'Vencimientos, extensión de servicio y saneamiento de features.',
    'Módulos habilitados y consistencia del esquema multicliente.',
    'Métricas globales, rentabilidad, alertas y trazabilidad.',
  ];
  const clientPanelScope = [
    'Precios operativos por cancha y gestión diaria del calendario.',
    'Altas de productos, stock y ventas del complejo.',
    'Atención de reservas, cobros y operación del ranking.',
    'Configuración visual y operación interna del negocio.',
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Building2 },
    { id: 'users', label: 'Administradores', icon: Users },
    { id: 'metrics', label: 'Métricas', icon: BarChart2 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ] as const;

  const panelNavItems = navItems.map((item) => {
    if (item.id === 'metrics') return { ...item, label: 'Metricas' };
    if (item.id === 'settings') return { ...item, label: 'Configuracion' };
    return item;
  });

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-white/5 flex flex-col shrink-0 z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-[#FF6B00]/20 p-1">
              <img src="https://i.postimg.cc/2y1YR7V8/Logo-de-SUR-Byte-S-con-robot-naranja.png" alt="SUR ByteS Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">SUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FF8F00]">ByteS</span></span>
          </div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {panelNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id ? 'bg-gradient-to-r from-[#FF6B00]/10 to-transparent text-[#FF6B00] border border-[#FF6B00]/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#FF6B00]' : ''}`} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handlePanelLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            Salir del Panel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-20 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 w-80 focus-within:border-[#FF6B00]/50 transition-colors">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Buscar cliente o complejo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none text-sm w-full placeholder:text-slate-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[#111827] border border-white/5 px-4 py-2 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border border-blue-500/30">
                <span className="text-xs font-bold text-white">SA</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">Super Admin</span>
                <span className="text-[10px] text-slate-500 font-medium mt-1">Global Access</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Visión General</h2>
                  <p className="text-slate-400 text-sm mt-1">Métricas principales de la plataforma SaaS</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-[#FF6B00]/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6B00]/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#1F2937] flex items-center justify-center border border-white/5">
                      <Building2 className="w-6 h-6 text-slate-300" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-slate-400 font-medium mb-1">Total Clientes</h3>
                    <p className="text-4xl font-black text-white">{clients.length}</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Activity className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-slate-400 font-medium mb-1">Clientes Activos</h3>
                    <p className="text-4xl font-black text-white">{activeClients}</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <Power className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-slate-400 font-medium mb-1">Suspendidos</h3>
                    <p className="text-4xl font-black text-white">{suspendedClients}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Gestión de Clientes</h2>
                  <p className="text-slate-400 text-sm mt-1">Administra los complejos y sus accesos</p>
                </div>
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="bg-gradient-to-r from-[#FF6B00] to-[#FF8F00] hover:from-[#FF8F00] hover:to-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#FF6B00]/20"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Cliente
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-20 bg-[#111827] rounded-[32px] border border-white/5">
                  <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No se encontraron clientes</h3>
                  <p className="text-slate-400">Intenta con otra búsqueda o crea un nuevo cliente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredClients.map(client => {
                    const clientAdmins = tenantUsers.filter(u => u.client_id === client.id);
                    return (
                      <div key={client.id} className="bg-[#111827] border border-white/5 rounded-[32px] p-6 flex flex-col hover:border-[#FF6B00]/30 transition-all duration-300 shadow-xl shadow-black/20 group">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{client.complex_name || client.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                               <span className="font-mono bg-[#1F2937] px-2 py-0.5 rounded-md text-slate-400">ID: {client.id.substring(0,8)}</span>
                               <span>•</span>
                               <span>{client.phone || 'Sin teléfono'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {client.status === 'active' ? 'Activo' : 'Suspendido'}
                            </span>
                            <div className="relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === client.id ? null : client.id); }} 
                                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                              </button>
                              {openMenuId === client.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#1F2937] border border-white/10 rounded-xl shadow-2xl z-50 py-2 overflow-hidden">
                                  <button 
                                    onClick={() => {
                                      handleLoginAsClient(client);
                                    }} 
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-white font-medium flex items-center gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" /> Entrar al Panel
                                  </button>
                                  <button onClick={() => { toggleClientStatus(client); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-white font-medium flex items-center gap-2">
                                    <Power className="w-4 h-4" /> {client.status === 'active' ? 'Suspender Cliente' : 'Activar Cliente'}
                                  </button>
                                  <button onClick={() => { resetRanking(client); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-white font-medium flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Resetear Ranking
                                  </button>
                                  <button onClick={() => { extendExpiration(client, 30); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-white font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Extender 30 días
                                  </button>
                                  <button onClick={() => { handleDeleteClient(client); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors text-red-400 font-medium flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Eliminar Cliente
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Modules */}
                        <div className="mb-6">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Módulos Habilitados</h4>
                          <div className="flex flex-wrap gap-2">
                            {(['reservas', 'ventas', 'ranking', 'estadisticas'] as ClientFeatureKey[]).map((mod) => {
                              const isEnabled = resolveClientFeatures(client)[mod];
                              return (
                                <div key={mod} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${isEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                  {isEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                  <span>{FEATURE_LABELS[mod]}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Admins */}
                        <div className="flex-1 mb-6">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Administradores ({clientAdmins.length})</span>
                          </h4>
                          <div className="space-y-2">
                            {clientAdmins.length > 0 ? clientAdmins.map(admin => (
                              <div key={admin.id} className="flex items-center justify-between bg-[#0B0F19] rounded-xl p-3 border border-white/5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
                                    <span className="text-xs font-bold text-white">{(admin.email || admin.profile?.name || 'AD').substring(0,2).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-200">{admin.email || admin.profile?.name || 'Sin email'}</p>
                                    <p className="text-[10px] text-slate-500">Último acceso: {admin.last_sign_in_at ? format(new Date(admin.last_sign_in_at), "dd/MM/yy", { locale: es }) : 'Nunca'}</p>
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="text-sm text-slate-500 italic p-4 text-center bg-[#0B0F19] rounded-xl border border-white/5 border-dashed">
                                No hay administradores asignados
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-auto pt-4 border-t border-white/5">
                          <button 
                            onClick={() => handleLoginAsClient(client)}
                            className="w-full py-3 rounded-xl bg-[#1F2937] hover:bg-[#FF6B00] text-white text-sm font-bold transition-all flex items-center justify-center gap-2 group/btn"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-colors" />
                            Entrar al panel del cliente
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Administradores por Cliente</h2>
                  <p className="text-slate-400 text-sm mt-1">Gestión real de los accesos operativos del sistema</p>
                </div>
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="bg-gradient-to-r from-[#FF6B00] to-[#FF8F00] hover:from-[#FF8F00] hover:to-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#FF6B00]/20"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Admin
                </button>
              </div>
              <div className="bg-[#111827] border border-white/5 rounded-[32px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider text-[10px] font-black">
                      <tr>
                        <th className="px-6 py-5">Email / Admin</th>
                        <th className="px-6 py-5">Complejo / Cliente</th>
                        <th className="px-6 py-5">Contacto / Dirección</th>
                        <th className="px-6 py-5">Último Acceso</th>
                        <th className="px-6 py-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tenantUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay administradores registrados</td>
                        </tr>
                      ) : (
                        tenantUsers.map(user => {
                          const client = clients.find(c => c.id === user.client_id);
                          return (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-white">{user.email || 'Sin email'}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                    {user.role || 'admin'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {client ? (
                                  <div className="space-y-1">
                                    <div className="text-white font-bold">{client.complex_name || client.name}</div>
                                    <div className="text-slate-500 text-xs flex items-center gap-1">
                                      <span className="bg-[#1F2937] px-1.5 py-0.5 rounded text-[9px] font-mono">ID: {client.id.substring(0, 8)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs italic">Sin cliente vinculado</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {client ? (
                                  <div className="space-y-1">
                                    <div className="text-slate-300 text-xs">{user.profile?.phone || client.phone || 'Sin teléfono'}</div>
                                    <div className="text-slate-500 text-[10px] truncate max-w-[150px]">{client.address || 'Sin dirección'}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs">
                                {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: es }) : 'Nunca'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Eliminar Usuario"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Metricas de negocio y operacion</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Vista consolidada de uso, ingresos y salud del SaaS en los ultimos {metricsAnalytics?.window_days ?? 30} dias.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500">
                    {metricsAnalytics?.generated_at ? `Actualizado: ${format(new Date(metricsAnalytics.generated_at), 'dd/MM/yyyy HH:mm', { locale: es })}` : 'Sin sincronizar'}
                  </div>
                  <button
                    onClick={fetchMetrics}
                    disabled={isMetricsLoading}
                    className="p-2 bg-[#1F2937] text-slate-400 hover:text-white hover:bg-[#374151] rounded-lg transition-colors disabled:opacity-50"
                    title="Actualizar metricas"
                  >
                    <RefreshCw className={`w-5 h-5 ${isMetricsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  {
                    label: 'Ingreso estimado 30d',
                    value: formatCurrency(metrics.revenue_estimated_30d),
                    hint: 'Turnos estimados + ventas reales',
                    icon: CircleDollarSign,
                    accent: 'from-[#FF6B00]/20 to-transparent border-[#FF6B00]/20',
                  },
                  {
                    label: 'Facturacion por turnos',
                    value: formatCurrency(metrics.booking_revenue_estimated_30d),
                    hint: 'Estimado con precio actual por cancha',
                    icon: Calendar,
                    accent: 'from-blue-500/20 to-transparent border-blue-500/20',
                  },
                  {
                    label: 'Ventas registradas',
                    value: formatCurrency(metrics.sales_revenue_30d),
                    hint: `${metrics.sales} ventas historicas`,
                    icon: ShoppingCart,
                    accent: 'from-emerald-500/20 to-transparent border-emerald-500/20',
                  },
                  {
                    label: 'Ocupacion promedio',
                    value: formatPercent(metrics.occupancy_average_30d),
                    hint: 'Estimado sobre una ventana de 14h por dia',
                    icon: Gauge,
                    accent: 'from-purple-500/20 to-transparent border-purple-500/20',
                  },
                ].map((card) => (
                  <div key={card.label} className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden">
                    <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${card.accent} blur-2xl`} />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">{card.label}</p>
                        <p className="text-3xl font-black text-white mt-2">{card.value}</p>
                        <p className="text-xs text-slate-500 mt-2">{card.hint}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-white/5 flex items-center justify-center">
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Clientes activos', value: `${activeClients}/${clients.length}`, icon: Building2 },
                  { label: 'Admins operativos', value: String(metrics.users), icon: Users },
                  { label: 'Reservas 30d', value: String(metricsAnalytics?.reservations.total_30d ?? 0), icon: Clock3 },
                  { label: 'Precio promedio por turno', value: formatCurrency(metrics.average_price_per_booking_30d), icon: SlidersHorizontal },
                ].map((card) => (
                  <div key={card.label} className="bg-[#111827] border border-white/5 rounded-[24px] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-400">{card.label}</span>
                      <card.icon className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-2xl font-black text-white">{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.4fr,0.9fr] gap-6">
                <section className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-black text-white">Clientes: ingresos, uso y precio</h3>
                      <p className="text-sm text-slate-400 mt-1">Sirve para detectar clientes rentables, subaprovechados o con pricing desalineado.</p>
                    </div>
                    <div className="text-xs text-slate-500">30d</div>
                  </div>
                  {topClientMetrics.length === 0 ? (
                    <div className="text-sm text-slate-500">Todavia no hay datos suficientes para mostrar comparativas por cliente.</div>
                  ) : (
                    <div className="space-y-3">
                      {topClientMetrics.map((clientMetric) => (
                        <div key={clientMetric.client_id} className="bg-[#0B0F19] border border-white/5 rounded-2xl p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white">{clientMetric.client_name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${clientMetric.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {clientMetric.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {clientMetric.pitch_count} canchas, {clientMetric.admin_count} admins, {clientMetric.unique_contacts_30d} contactos activos
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Ingreso estimado</p>
                              <p className="text-2xl font-black text-white">{formatCurrency(clientMetric.total_revenue_estimated_30d)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                            <div className="bg-white/5 rounded-xl p-3">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500">Reservas</div>
                              <div className="text-lg font-bold text-white">{clientMetric.bookings_30d}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500">Horas usadas</div>
                              <div className="text-lg font-bold text-white">{clientMetric.booked_hours_30d.toFixed(1)}h</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500">Ocupacion</div>
                              <div className="text-lg font-bold text-white">{formatPercent(clientMetric.occupancy_rate_estimated_30d)}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500">Precio medio</div>
                              <div className="text-lg font-bold text-white">{formatCurrency(clientMetric.average_pitch_price)}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500">Ventas</div>
                              <div className="text-lg font-bold text-white">{formatCurrency(clientMetric.sales_revenue_30d)}</div>
                            </div>
                          </div>
                          {clientMetric.alerts.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {clientMetric.alerts.map((alert) => (
                                <span key={alert} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {alert}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-6">
                  <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                    <h3 className="text-xl font-black text-white">Alertas y anomalías</h3>
                    <div className="space-y-3 mt-5">
                      {(metricsAnalytics?.alerts?.length ? metricsAnalytics.alerts : ['Sin alertas globales críticas por ahora.']).map((alert) => (
                        <div key={alert} className="flex items-start gap-3 bg-[#0B0F19] border border-white/5 rounded-2xl p-4">
                          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-300">{alert}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                    <h3 className="text-xl font-black text-white">Calidad del dato</h3>
                    <div className="space-y-3 mt-5 text-sm text-slate-300">
                      <div className="flex items-center justify-between bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3">
                        <span>Admins sin profile</span>
                        <span className="font-black text-white">{metricsAnalytics?.data_quality.legacy_memberships_without_profile ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3">
                        <span>Clientes con features vacios</span>
                        <span className="font-black text-white">{metricsAnalytics?.data_quality.clients_with_empty_features ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3">
                        <span>Reservas con estado legacy</span>
                        <span className="font-black text-white">{metricsAnalytics?.data_quality.bookings_with_finished_status ?? 0}</span>
                      </div>
                      <div className="pt-2 space-y-2">
                        {(metricsAnalytics?.data_quality.notes ?? []).map((note) => (
                          <div key={note} className="text-xs text-slate-500 flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-xl font-black text-white">Canchas más rentables</h3>
                      <p className="text-sm text-slate-400 mt-1">Rentabilidad estimada por turnos sobre precio actual.</p>
                    </div>
                    <CircleDollarSign className="w-6 h-6 text-[#FF6B00]" />
                  </div>
                  <div className="space-y-3">
                    {topPitchMetrics.length === 0 ? (
                      <div className="text-sm text-slate-500">No hay canchas suficientes para comparar.</div>
                    ) : (
                      topPitchMetrics.map((pitchMetric) => (
                        <div key={pitchMetric.pitch_id} className="flex items-center justify-between gap-4 bg-[#0B0F19] border border-white/5 rounded-2xl px-4 py-3">
                          <div>
                            <div className="font-bold text-white">{pitchMetric.pitch_name}</div>
                            <div className="text-xs text-slate-500">{pitchMetric.client_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">{formatCurrency(pitchMetric.revenue_estimated_30d)}</div>
                            <div className="text-xs text-slate-500">{pitchMetric.booked_hours_30d.toFixed(1)}h • {formatPercent(pitchMetric.occupancy_rate_estimated_30d)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-xl font-black text-white">Canchas menos rentables</h3>
                      <p className="text-sm text-slate-400 mt-1">Útil para decidir cambios de precio, promos o revisión operativa.</p>
                    </div>
                    <BarChart2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    {weakestPitchMetrics.length === 0 ? (
                      <div className="text-sm text-slate-500">No hay canchas suficientes para comparar.</div>
                    ) : (
                      weakestPitchMetrics.map((pitchMetric) => (
                        <div key={pitchMetric.pitch_id} className="flex items-center justify-between gap-4 bg-[#0B0F19] border border-white/5 rounded-2xl px-4 py-3">
                          <div>
                            <div className="font-bold text-white">{pitchMetric.pitch_name}</div>
                            <div className="text-xs text-slate-500">{pitchMetric.client_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">{formatCurrency(pitchMetric.revenue_estimated_30d)}</div>
                            <div className="text-xs text-slate-500">{pitchMetric.bookings_30d} reservas • {formatCurrency(pitchMetric.current_price)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <h3 className="text-lg font-black text-white">Horarios pico</h3>
                  <div className="space-y-3 mt-5">
                    {(metricsAnalytics?.reservations.peak_hours ?? []).map((entry) => (
                      <div key={`peak-${entry.hour}`} className="flex items-center justify-between bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3">
                        <span className="text-slate-300">{formatHourLabel(entry.hour)}</span>
                        <span className="font-black text-white">{entry.count} reservas</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <h3 className="text-lg font-black text-white">Horarios vacíos</h3>
                  <div className="space-y-3 mt-5">
                    {(metricsAnalytics?.reservations.low_hours ?? []).map((entry) => (
                      <div key={`low-${entry.hour}`} className="flex items-center justify-between bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3">
                        <span className="text-slate-300">{formatHourLabel(entry.hour)}</span>
                        <span className="font-black text-white">{entry.count} reservas</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <h3 className="text-lg font-black text-white">Clientes a vigilar</h3>
                  <div className="space-y-3 mt-5">
                    {[...(metricsAnalytics?.clients.low_activity ?? []).slice(0, 2), ...(metricsAnalytics?.clients.many_users_low_operation ?? []).slice(0, 2)]
                      .slice(0, 4)
                      .map((clientMetric) => (
                        <div key={`watch-${clientMetric.client_id}`} className="bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3">
                          <div className="font-bold text-white">{clientMetric.client_name}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {clientMetric.bookings_30d} reservas • {clientMetric.unique_contacts_30d} contactos • {formatCurrency(clientMetric.total_revenue_estimated_30d)}
                          </div>
                        </div>
                      ))}
                    {(!metricsAnalytics || ((metricsAnalytics.clients.low_activity.length + metricsAnalytics.clients.many_users_low_operation.length) === 0)) && (
                      <div className="text-sm text-slate-500">No aparecen clientes críticos bajo estas reglas.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Configuracion de supervision</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Esta vista concentra las reglas que si corresponden al Super Admin: servicio, vencimientos, modulos y consistencia del cliente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Vencen en 7 dias', value: String(expiringSoonClients.length), icon: Calendar },
                  { label: 'Sin admins', value: String(clientsWithoutAdmins.length), icon: Users },
                  { label: 'Features legacy', value: String(clientsWithLegacyFeatures.length), icon: AlertTriangle },
                  { label: 'Suspendidos', value: String(suspendedClients), icon: Power },
                ].map((card) => (
                  <div key={card.label} className="bg-[#111827] border border-white/5 rounded-[24px] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-400">{card.label}</span>
                      <card.icon className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-3xl font-black text-white">{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <h3 className="text-xl font-black text-white">Que si pertenece al Super Admin</h3>
                  <div className="space-y-3 mt-5">
                    {systemScope.map((item) => (
                      <div key={item} className="flex items-start gap-3 bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3 text-sm text-slate-300">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <h3 className="text-xl font-black text-white">Que debe quedar en el panel del cliente</h3>
                  <div className="space-y-3 mt-5">
                    {clientPanelScope.map((item) => (
                      <div key={item} className="flex items-start gap-3 bg-[#0B0F19] rounded-2xl border border-white/5 px-4 py-3 text-sm text-slate-300">
                        <XCircle className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr,0.9fr] gap-6">
                <section className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-white">Configuracion por cliente</h3>
                      <p className="text-sm text-slate-400 mt-1">Edicion segura sobre el esquema ya soportado hoy.</p>
                    </div>
                    <select
                      value={selectedSettingsClientId}
                      onChange={(e) => setSelectedSettingsClientId(e.target.value)}
                      className="bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                    >
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.complex_name || client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {settingsDraft && selectedSettingsClient ? (
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Cliente legal / cuenta</label>
                          <input
                            value={settingsDraft.name}
                            onChange={(e) => setSettingsDraft((current) => current ? { ...current, name: e.target.value } : current)}
                            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Complejo visible</label>
                          <input
                            value={settingsDraft.complex_name}
                            onChange={(e) => setSettingsDraft((current) => current ? { ...current, complex_name: e.target.value } : current)}
                            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Telefono</label>
                          <input
                            value={settingsDraft.phone}
                            onChange={(e) => setSettingsDraft((current) => current ? { ...current, phone: e.target.value } : current)}
                            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Direccion</label>
                          <input
                            value={settingsDraft.address}
                            onChange={(e) => setSettingsDraft((current) => current ? { ...current, address: e.target.value } : current)}
                            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Estado del servicio</label>
                          <select
                            value={settingsDraft.status}
                            onChange={(e) => setSettingsDraft((current) => current ? { ...current, status: e.target.value as Client['status'] } : current)}
                            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                          >
                            <option value="active">Activo</option>
                            <option value="suspended">Suspendido</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Vence el</label>
                          <input
                            type="date"
                            value={settingsDraft.expires_at}
                            onChange={(e) => setSettingsDraft((current) => current ? { ...current, expires_at: e.target.value } : current)}
                            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Modulos / features habilitados</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(Object.keys(settingsDraft.features) as ClientFeatureKey[]).map((featureKey) => (
                            <label key={featureKey} className="flex items-center justify-between gap-3 bg-[#0B0F19] border border-white/5 rounded-2xl px-4 py-3 cursor-pointer">
                              <div>
                                <div className="font-bold text-white">{FEATURE_LABELS[featureKey]}</div>
                                <div className="text-xs text-slate-500">Control central del modulo para este cliente</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={settingsDraft.features[featureKey]}
                                onChange={(e) =>
                                  setSettingsDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          features: {
                                            ...current.features,
                                            [featureKey]: e.target.checked,
                                          },
                                        }
                                      : current,
                                  )
                                }
                                className="w-5 h-5 rounded border-white/10 bg-[#111827] text-[#FF6B00] focus:ring-[#FF6B00]"
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => extendExpiration(selectedSettingsClient, 30)}
                          className="bg-[#1F2937] hover:bg-[#374151] text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Extender 30 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => resetRanking(selectedSettingsClient)}
                          className="bg-[#1F2937] hover:bg-[#374151] text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Resetear ranking
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          className="bg-gradient-to-r from-[#FF6B00] to-[#FF8F00] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                        >
                          {isSavingSettings ? 'Guardando...' : 'Guardar configuracion'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-sm text-slate-500">No hay clientes disponibles para configurar.</div>
                  )}
                </section>

                <section className="space-y-6">
                  <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                    <h3 className="text-xl font-black text-white">Estado del cliente seleccionado</h3>
                    {selectedSettingsClient ? (
                      <div className="space-y-3 mt-5 text-sm">
                        <div className="flex items-center justify-between bg-[#0B0F19] border border-white/5 rounded-2xl px-4 py-3">
                          <span className="text-slate-400">Servicio</span>
                          <span className={`font-black ${selectedSettingsClient.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{selectedSettingsClient.status}</span>
                        </div>
                        <div className="flex items-center justify-between bg-[#0B0F19] border border-white/5 rounded-2xl px-4 py-3">
                          <span className="text-slate-400">Admins asignados</span>
                          <span className="font-black text-white">{tenantUsers.filter((user) => user.client_id === selectedSettingsClient.id).length}</span>
                        </div>
                        <div className="flex items-center justify-between bg-[#0B0F19] border border-white/5 rounded-2xl px-4 py-3">
                          <span className="text-slate-400">Ultimo reset ranking</span>
                          <span className="font-black text-white">{selectedSettingsClient.ranking_reset_date ? format(new Date(selectedSettingsClient.ranking_reset_date), 'dd/MM/yyyy', { locale: es }) : 'Sin definir'}</span>
                        </div>
                        <div className="flex items-center justify-between bg-[#0B0F19] border border-white/5 rounded-2xl px-4 py-3">
                          <span className="text-slate-400">Features legacy</span>
                          <span className={`font-black ${hasLegacyFeatureDrift(selectedSettingsClient) ? 'text-amber-300' : 'text-emerald-400'}`}>
                            {hasLegacyFeatureDrift(selectedSettingsClient) ? 'Si' : 'No'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 mt-4">Selecciona un cliente para ver su estado.</div>
                    )}
                  </div>

                  <div className="bg-[#111827] border border-white/5 rounded-[28px] p-6">
                    <h3 className="text-xl font-black text-white">Modelo final recomendado</h3>
                    <div className="space-y-3 mt-5">
                      {[
                        'Comercial / planes: nombre del plan, fee mensual, fecha de cobro y estado de facturacion.',
                        'Limites por cliente: admins maximos, canchas maximas y umbral de reservas/ventas.',
                        'Alertas: inactividad, vencimiento, caida de ingresos o desvio de precio/uso.',
                        'Observaciones administrativas y trazabilidad de revision por cuenta.',
                      ].map((item) => (
                        <div key={item} className="bg-[#0B0F19] border border-dashed border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-300">
                          {item}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                      Esta capa avanzada conviene persistirla recien despues de aplicar la normalizacion de esquema y eliminar compatibilidades legacy.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          )}

          {false && activeTab === 'metrics' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Métricas Globales</h2>
                  <p className="text-slate-400 text-sm mt-1">Datos reales de toda la plataforma</p>
                </div>
                <button
                  onClick={fetchMetrics}
                  className="p-2 bg-[#1F2937] text-slate-400 hover:text-white hover:bg-[#374151] rounded-lg transition-colors"
                  title="Actualizar Métricas"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-[#FF6B00]/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF6B00]/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#1F2937] flex items-center justify-center border border-white/5">
                      <Users className="w-6 h-6 text-slate-300" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-slate-400 font-medium mb-1">Total Usuarios</h3>
                    <p className="text-4xl font-black text-white">{metrics.users}</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Package className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-slate-400 font-medium mb-1">Total Productos</h3>
                    <p className="text-4xl font-black text-white">{metrics.products}</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <ShoppingCart className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-slate-400 font-medium mb-1">Total Ventas</h3>
                    <p className="text-4xl font-black text-white">{metrics.sales}</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Calendar className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-slate-400 font-medium mb-1">Total Reservas</h3>
                    <p className="text-4xl font-black text-white">{metrics.bookings}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {false && activeTab === 'settings' && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-[#111827] rounded-full flex items-center justify-center border border-white/5 mb-6">
                <Settings className="w-10 h-10 text-slate-600" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Próximamente</h2>
              <p className="text-slate-400 max-w-md">Este módulo está en desarrollo y estará disponible en la próxima actualización del sistema.</p>
            </div>
          )}
        </div>
      </main>


      {/* Create User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-white/10 rounded-[32px] w-full max-w-2xl p-8 shadow-2xl my-8">
             <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white tracking-tight">Nuevo Administrador SaaS</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-500 hover:text-white bg-[#1F2937] p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Info */}
                <div className="space-y-5">
                  <h4 className="text-[#FF6B00] font-black uppercase tracking-widest text-[10px] border-b border-white/5 pb-3">Datos de Acceso</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                      placeholder="admin@cliente.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={newUser.create_new_client}
                        onChange={(e) => setNewUser({...newUser, create_new_client: e.target.checked})}
                        className="w-5 h-5 rounded border-white/10 bg-[#0B0F19] text-[#FF6B00] focus:ring-[#FF6B00]"
                      />
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Crear nuevo cliente (SaaS)</span>
                    </label>
                  </div>

                  {!newUser.create_new_client && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Vincular a Cliente Existente</label>
                      <select
                        required
                        value={newUser.client_id}
                        onChange={(e) => setNewUser({...newUser, client_id: e.target.value})}
                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                      >
                        <option value="">Seleccionar cliente...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Client Info */}
                {newUser.create_new_client && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                    <h4 className="text-[#FF6B00] font-black uppercase tracking-widest text-[10px] border-b border-white/5 pb-3">Datos del Complejo</h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nombre del Complejo</label>
                      <input
                        type="text"
                        required
                        value={newUser.complex_name}
                        onChange={(e) => setNewUser({...newUser, complex_name: e.target.value, client_name: e.target.value})}
                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                        placeholder="Ej: Golazo FC"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Teléfono</label>
                      <input
                        type="text"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                        placeholder="Ej: +54 9 11 2233-4455"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Dirección</label>
                      <input
                        type="text"
                        value={newUser.address}
                        onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                        placeholder="Ej: Av. Siempre Viva 742"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Servicios Habilitados</label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(newUser.features).map(([key, val]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer p-3 bg-[#0B0F19] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={val}
                              onChange={(e) => setNewUser({
                                ...newUser, 
                                features: { ...newUser.features, [key]: e.target.checked }
                              })}
                              className="w-4 h-4 rounded border-white/10 bg-[#111827] text-[#FF6B00] focus:ring-[#FF6B00]"
                            />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{FEATURE_LABELS[key as ClientFeatureKey]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-8 flex gap-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-white font-bold py-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-[#FF6B00] to-[#FF8F00] hover:from-[#FF8F00] hover:to-[#FF6B00] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#FF6B00]/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {newUser.create_new_client ? 'Crear SaaS y Admin' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
}
