import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Home, 
  Building2,
  Calendar as CalendarIcon, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Trophy, 
  ShoppingBag, 
  LogOut,
  BarChart3,
  User as UserIcon,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Zap,
  Target,
  Activity,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  Search,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { ArgentinaLogo } from './components/ArgentinaLogo';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { ConfirmModal } from './components/ConfirmModal';
import { ArgentinaConfettiIntro } from './components/public/ArgentinaConfettiIntro';
import { WorldCupCountdownCard } from './components/world-cup/WorldCupCountdownCard';
import { cn } from './lib/utils';
import { getEffectiveClientId } from './lib/tenant';
import { dataService } from './services/dataService';
import { User, Client } from './types';
import { supabase, checkSupabaseConnection } from './lib/supabase';

type Page = 'dashboard' | 'bookings' | 'calendar' | 'sales' | 'admin' | 'ranking' | 'stats';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const BookingsList = lazy(() => import('./pages/BookingsList'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const SalesPage = lazy(() => import('./pages/Sales'));
const RankingPage = lazy(() => import('./pages/Ranking'));
const SmartStats = lazy(() => import('./pages/SmartStats'));
const SuperAdminSaaS = lazy(() => import('./pages/SuperAdminSaaS'));
const AIChatFloating = lazy(() => import('./components/AIChatFloating'));

const PageFallback = () => (
  <div className="flex min-h-[240px] w-full items-center justify-center">
    <span className="text-sm font-bold text-zinc-500">Cargando...</span>
  </div>
);

const PUBLIC_SELECTION_BACKGROUND = 'https://iili.io/q6oJgJ2.jpg';
const PUBLIC_COMPLEX_ROUTE_PATTERN = /^\/complejo\/([^/]+)\/?$/i;
const PUBLIC_CAROUSEL_ITEMS = [
  {
    title: 'Elegí complejo',
    description: 'Encontrá canchas disponibles cerca de tu zona.',
    icon: Building2,
    accent: 'from-sky-300 via-white to-sky-500',
  },
  {
    title: 'Reservá horario',
    description: 'Elegí día, cancha y turno en segundos.',
    icon: CalendarIcon,
    accent: 'from-white via-sky-200 to-emerald-300',
  },
  {
    title: 'Coordiná la seña',
    description: 'Consultá los datos de pago del complejo.',
    icon: ShieldCheck,
    accent: 'from-emerald-300 via-white to-amber-300',
  },
  {
    title: 'Jugá',
    description: 'Llegá al turno y disfrutá el partido.',
    icon: Trophy,
    accent: 'from-yellow-300 via-amber-200 to-sky-300',
  },
];

type PublicEntryMode = 'catalog' | 'shared-link';

const normalizePublicSlug = (value: string) => {
  try {
    return decodeURIComponent(value).trim().toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
};

const getPublicComplexSlugFromPath = (pathname: string) => {
  const match = pathname.match(PUBLIC_COMPLEX_ROUTE_PATTERN);
  return match?.[1] ? normalizePublicSlug(match[1]) : null;
};

const getClientSlug = (client: Client | null | undefined) => client?.slug?.trim() || '';

const getNormalizedClientSlug = (client: Client | null | undefined) => {
  const slug = getClientSlug(client);
  return slug ? normalizePublicSlug(slug) : null;
};

const buildPublicComplexPath = (client: Client) => {
  const slug = getClientSlug(client);
  return slug ? `/complejo/${encodeURIComponent(slug)}` : null;
};

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const isSuperAdminRoute = pathname.startsWith('/panel-interno-golazo-');
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isPublicRoute = !isSuperAdminRoute && !isAdminRoute;
  const publicComplexSlug = getPublicComplexSlugFromPath(pathname);
  const isPublicComplexRoute = !!publicComplexSlug;
  const isPublicCatalogRoute = pathname === '/';
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [customLogo, setCustomLogo] = useState<string | null>((selectedClientId ? localStorage.getItem('golazo_client_logo_' + selectedClientId) : localStorage.getItem('golazo_custom_logo')));
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [clientConfig, setClientConfig] = useState<Client | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [publicClients, setPublicClients] = useState<Client[]>([]);
  const [isPublicClientsLoading, setIsPublicClientsLoading] = useState(true);
  const [selectedPublicClientId, setSelectedPublicClientId] = useState<string | null>(
    isPublicComplexRoute || isPublicCatalogRoute ? null : dataService.getPublicClientSelectionId()
  );
  const [publicEntryMode, setPublicEntryMode] = useState<PublicEntryMode>(isPublicComplexRoute ? 'shared-link' : 'catalog');
  const [invalidPublicSlug, setInvalidPublicSlug] = useState<string | null>(null);
  const [publicSearchTerm, setPublicSearchTerm] = useState('');
  const [publicGuestName, setPublicGuestName] = useState(localStorage.getItem('golazo_guest_name') || 'Jugador');
  const [publicGuestPhone, setPublicGuestPhone] = useState(localStorage.getItem('golazo_guest_phone') || '');
  const [publicCarouselIndex, setPublicCarouselIndex] = useState(0);

  const loadPublicClients = async () => {
    if (isSuperAdminRoute) return;

    setIsPublicClientsLoading(true);
    try {
      const clients = await dataService.getPublicClients();
      setPublicClients(clients);
    } catch (error) {
      console.error('Error fetching public clients catalog:', error);
      setPublicClients([]);
      toast.error('No se pudo cargar el listado de complejos.');
    } finally {
      setIsPublicClientsLoading(false);
    }
  };

  const refreshSessionState = async () => {
    setIsClientLoading(true);

    try {
      const currentUser = await dataService.getCurrentUser();

      if (!currentUser) {
        const publicClientId = isPublicRoute && !isPublicCatalogRoute && !isPublicComplexRoute
          ? dataService.getPublicClientSelectionId()
          : null;
        setUser(null);
        setSelectedClientId(null);
        setSelectedPublicClientId(publicClientId);

        if (publicClientId && isPublicRoute) {
          const publicClientConfig = await dataService.getPublicClientConfig(publicClientId);
          setClientConfig(publicClientConfig);
        } else {
          setClientConfig(null);
        }
        return;
      }

      if (!isSuperAdminRoute && !isPublicRoute && currentUser.role === 'superadmin') {
        await dataService.logout();
        setUser(null);
        setSelectedClientId(null);
        setClientConfig(null);
        setLoginError('Este acceso no corresponde a este usuario');
        return;
      }

      if (isAdminRoute && currentUser.role !== 'admin') {
        await dataService.logout();
        setUser(null);
        setSelectedClientId(null);
        setClientConfig(null);
        setLoginError('Este acceso es solo para administradores');
        return;
      }

      setUser(currentUser);
      setSelectedClientId(currentUser.client_id || null);

      if (isPublicRoute) {
        if (isPublicCatalogRoute) {
          dataService.clearPublicClientSelection();
          setSelectedPublicClientId(null);
          setClientConfig(null);
        }
        return;
      }

      // Procesar reserva pendiente si existe (Post-Login OAuth)
      if (currentUser) {
        const pending = dataService.getPendingBooking();
        if (pending) {
          try {
            const [h, m] = pending.time.split(':').map(Number);
            const startTime = new Date(pending.date);
            startTime.setHours(h, m, 0, 0);
            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 1);

            await api.addBooking({
              pitchId: pending.pitchId,
              userId: currentUser.id,
              clientName: pending.clientName,
              clientPhone: pending.clientPhone,
              startTime,
              endTime,
              status: 'confirmed',
              depositAmount: Number(pending.depositAmount) || 0,
              client_id: pending.clientId
            }, pending.clientId);

            toast.success('¡Reserva confirmada con éxito!', {
              description: 'Tu turno fue agendado correctamente tras iniciar sesión.'
            });
          } catch (error: any) {
            toast.error('Error al procesar tu reserva pendiente', {
              description: error.message
            });
          } finally {
            dataService.clearPendingBooking();
          }
        }
      }

      if (!isSuperAdminRoute && currentUser.client_id) {
        dataService.setPublicClientSelection(currentUser.client_id);
        setSelectedPublicClientId(currentUser.client_id);
      }

      const targetClientId = getEffectiveClientId(currentUser);
      if (targetClientId) {
        const data = await dataService.getClientConfig(targetClientId);
        setClientConfig(data);
      } else {
        setClientConfig(null);
      }
    } catch (err) {
      console.error('Error refreshing session state:', err);
      setUser(null);
      setSelectedClientId(null);
      setClientConfig(null);
    } finally {
      setIsClientLoading(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      if (dataService.isSupabaseConfigured()) {
        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          toast.error('No se pudo conectar con Supabase.', {
            duration: 8000,
          });
        }
      }

      await loadPublicClients();
      await refreshSessionState();
    };

    initApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refreshSessionState();
    });

    const handleStorageChange = () => {
      setCustomLogo((selectedClientId ? localStorage.getItem('golazo_client_logo_' + selectedClientId) : localStorage.getItem('golazo_custom_logo')));
    };

    const handleGuestInfoUpdated = () => {
      setPublicGuestName(localStorage.getItem('golazo_guest_name') || 'Jugador');
      setPublicGuestPhone(localStorage.getItem('golazo_guest_phone') || '');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('guest_info_updated', handleGuestInfoUpdated as EventListener);
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('guest_info_updated', handleGuestInfoUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isPublicCatalogRoute) return;

    dataService.clearPublicClientSelection();
    setSelectedPublicClientId(null);
    setClientConfig(null);
    setInvalidPublicSlug(null);
    setPublicEntryMode('catalog');
    setCurrentPage('dashboard');
  }, [isPublicCatalogRoute]);

  useEffect(() => {
    if (!isPublicComplexRoute || !publicComplexSlug || isPublicClientsLoading) return;

    let isMounted = true;
    const selectedClient = publicClients.find((client) => getNormalizedClientSlug(client) === publicComplexSlug) || null;

    const resolvePublicClient = async () => {
      if (!selectedClient) {
        dataService.clearPublicClientSelection();
        setSelectedPublicClientId(null);
        setClientConfig(null);
        setInvalidPublicSlug(publicComplexSlug);
        setPublicEntryMode('shared-link');
        setCurrentPage('dashboard');
        return;
      }

      dataService.setPublicClientSelection(selectedClient.id);
      setSelectedPublicClientId(selectedClient.id);
      setInvalidPublicSlug(null);
      setPublicEntryMode(window.history.state?.golazoFromCatalog === true ? 'catalog' : 'shared-link');
      setCurrentPage('dashboard');

      try {
        const publicConfig = await dataService.getPublicClientConfig(selectedClient.id);
        if (isMounted) {
          setClientConfig(publicConfig || selectedClient);
        }
      } catch (error) {
        console.error('Error loading public complex config by slug:', error);
        if (isMounted) {
          setClientConfig(selectedClient);
        }
      }
    };

    void resolvePublicClient();

    return () => {
      isMounted = false;
    };
  }, [isPublicComplexRoute, publicComplexSlug, isPublicClientsLoading, publicClients]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomLogo(base64String);
        if (selectedClientId) { localStorage.setItem('golazo_client_logo_' + selectedClientId, base64String); } else { localStorage.setItem('golazo_custom_logo', base64String); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const newUser = await dataService.login(loginIdentifier, loginPassword, ['admin']);

      if (newUser.client_id) {
        const config = await dataService.getClientConfig(newUser.client_id);
        setClientConfig(config);
      } else {
        setClientConfig(null);
      }

      setShowSplash(true);

      setTimeout(() => {
        setUser(newUser);
        setSelectedClientId(newUser.client_id || null);
        setShowSplash(false);
      }, 2500);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    }
  };

  const handleLogout = async () => {
    await dataService.logout();
    setUser(null);
    setSelectedClientId(null);
    setSelectedPublicClientId(null);
    setClientConfig(null);
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginError(null);
    setCurrentPage('dashboard');
  };

  const handleSelectPublicClient = async (client: Client) => {
    const publicPath = buildPublicComplexPath(client);
    if (!publicPath) {
      toast.error('Este complejo todavia no tiene un link publico configurado.');
      return;
    }

    dataService.setPublicClientSelection(client.id);
    setSelectedPublicClientId(client.id);
    setClientConfig(client);
    setUser(null);
    setLoginError(null);
    setCurrentPage('dashboard');
    setInvalidPublicSlug(null);
    setPublicEntryMode('catalog');

    window.history.pushState({ golazoFromCatalog: true }, '', publicPath);
    setPathname(window.location.pathname);

    try {
      const publicConfig = await dataService.getPublicClientConfig(client.id);
      setClientConfig(publicConfig || client);
    } catch (error) {
      console.error('Error loading selected public client config:', error);
      setClientConfig(client);
    }
  };

  const handleBackToClientSelector = () => {
    dataService.clearPublicClientSelection();
    setSelectedPublicClientId(null);
    setClientConfig(null);
    setLoginPassword('');
    setLoginError(null);
    setCurrentPage('dashboard');
    setInvalidPublicSlug(null);
    setPublicEntryMode('catalog');

    if (isPublicComplexRoute) {
      window.history.pushState({ golazoCatalogRoot: true }, '', '/');
      setPathname(window.location.pathname);
    }
  };

  const publicPortalUser: User | null =
    selectedPublicClientId && isPublicComplexRoute && !invalidPublicSlug
      ? {
          id: `public-player:${selectedPublicClientId}`,
          name: publicGuestName,
          phone: publicGuestPhone,
          role: 'client',
          client_id: selectedPublicClientId,
        }
      : null;
  const isPublicPortalActive = !!publicPortalUser && isPublicComplexRoute;
  const activeUser = isPublicPortalActive ? publicPortalUser : user;

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home, roles: ['admin', 'client'] },
    { id: 'bookings', label: 'Reservas', icon: CalendarIcon, roles: ['admin', 'client'], featureKey: 'reservas' },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['admin', 'client'], featureKey: 'reservas' },
    { id: 'ranking', label: 'Ranking', icon: Trophy, roles: ['admin', 'client'], featureKey: 'ranking' },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, roles: ['admin'], featureKey: 'estadisticas' },
    { id: 'sales', label: 'Ventas', icon: ShoppingBag, roles: ['admin'], featureKey: 'ventas' },
    { id: 'admin', label: 'Configuración', icon: Settings, roles: ['admin'] },
  ];

  const navigationRole = activeUser?.role || '';

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles.includes(navigationRole)) return false;
    if (item.featureKey && clientConfig) {
      if (!clientConfig.features) return true; // Asumir todas activas si no hay config
      return clientConfig.features[item.featureKey] !== false; // Solo ocultar si está explícitamente en false
    }
    return true;
  });

  const bgImage = PUBLIC_SELECTION_BACKGROUND;
  const selectedPublicClient = publicClients.find((client) => client.id === selectedPublicClientId) || null;
  const getClientDisplayName = (client: Client) => client.complex_name?.trim() || client.name?.trim() || 'Complejo';
  const publicPortalClientName = clientConfig?.complex_name || clientConfig?.name || (selectedPublicClient ? getClientDisplayName(selectedPublicClient) : 'Complejo');
  const publicPortalLogo = clientConfig?.logo_url || selectedPublicClient?.logo_url || customLogo;
  const getPublicNavLabel = (item: typeof navItems[number]) => {
    if (item.id === 'calendar') return 'Reservar';
    if (item.id === 'bookings') return 'Mis turnos';
    return item.label;
  };
  const getClientInitials = (client: Client) =>
    getClientDisplayName(client)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || '')
      .join('') || 'GL';
  const filteredPublicClients = publicClients.filter((client) => {
    const label = `${client.complex_name || ''} ${client.name || ''} ${client.address || ''}`.toLowerCase();
    return label.includes(publicSearchTerm.toLowerCase());
  });
  const activeCarouselItem = PUBLIC_CAROUSEL_ITEMS[publicCarouselIndex] || PUBLIC_CAROUSEL_ITEMS[0];
  const ActiveCarouselIcon = activeCarouselItem.icon;

  useEffect(() => {
    if (!isPublicRoute || selectedPublicClientId || user) return;

    const interval = window.setInterval(() => {
      setPublicCarouselIndex((current) => (current + 1) % PUBLIC_CAROUSEL_ITEMS.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isPublicRoute, selectedPublicClientId, user]);

  useEffect(() => {
    // No rotation needed
  }, []);

  useEffect(() => {
    if (!isPublicRoute || isPublicClientsLoading || !selectedPublicClientId || publicClients.length === 0) return;

    const selectedClientStillExists = publicClients.some((client) => client.id === selectedPublicClientId);
    if (!selectedClientStillExists) {
      dataService.clearPublicClientSelection();
      setSelectedPublicClientId(null);
      setClientConfig(null);
      setUser(null);
      toast.error('El complejo seleccionado ya no está disponible.');
    }
  }, [isPublicRoute, isPublicClientsLoading, selectedPublicClientId, publicClients]);

  if (isSuperAdminRoute) {
    return (
      <Suspense fallback={<PageFallback />}>
        <SuperAdminSaaS />
      </Suspense>
    );
  }

  // Blocking logic
  if (isClientLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (clientConfig && (clientConfig.status === 'suspended' || (clientConfig.expires_at && new Date(clientConfig.expires_at) < new Date()))) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Servicio Suspendido</h1>
          <p className="text-zinc-400 mb-8">
            El servicio se encuentra temporalmente suspendido o ha expirado. Por favor, contacta al administrador del sistema para regularizar la situación.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-4 font-bold"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (showSplash) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="flex flex-col items-center gap-8 text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArgentinaLogo size="lg" />
            </motion.div>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute -bottom-4 left-0 h-1 bg-gradient-to-r from-sky-400 via-white to-sky-400 rounded-full"
            />
          </div>
          
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white text-4xl md:text-6xl font-black tracking-tighter"
            >
              GOLAZO
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sky-400 font-black tracking-[0.5em] uppercase text-xs"
            >
              Te da la bienvenida
            </motion.p>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px]" />
        </div>
      </div>
    );
  }

  if (isPublicComplexRoute && (isPublicClientsLoading || (!selectedPublicClientId && !invalidPublicSlug))) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (isPublicComplexRoute && invalidPublicSlug) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 text-white">
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: `url(${PUBLIC_SELECTION_BACKGROUND})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="fixed inset-0 bg-slate-950/78 backdrop-blur-sm" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md rounded-[32px] border border-white/15 bg-white/10 p-7 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-xl">
              <MapPin className="h-7 w-7 text-sky-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-100">Perfil publico</p>
            <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">El complejo no esta disponible</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Revisa el link o volve al inicio para elegir un complejo activo.
            </p>
            <Button
              type="button"
              onClick={handleBackToClientSelector}
              className="mt-6 w-full rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 hover:bg-zinc-100"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (!user || isPublicCatalogRoute) {
    if (isPublicCatalogRoute || (isPublicRoute && !selectedPublicClientId && !isPublicComplexRoute)) {
      return (
        <div className="relative h-screen overflow-y-auto overflow-x-hidden bg-zinc-950 text-white">
          <div
            className="fixed inset-0"
            style={{
              backgroundImage: `url(${PUBLIC_SELECTION_BACKGROUND})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(251,191,36,0.10),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.74)_34%,rgba(2,6,23,0.9)_100%)]" />
          {isPublicCatalogRoute && (
            <ArgentinaConfettiIntro />
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative z-10 mx-auto flex min-h-full w-full max-w-[1100px] flex-col px-4 py-2.5 sm:px-6 md:px-7 md:py-3"
          >
            <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] lg:items-start">
              <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-xl">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg">
                    <Trophy className="h-5 w-5 text-sky-600" />
                  </span>
                    <div>
                      <p className="text-base font-black leading-none tracking-[-0.04em] text-white">GOLAZO</p>
                      <div className="mt-1 flex items-center gap-1 text-amber-300">
                        <span className="text-[9px] leading-none">★</span>
                        <span className="text-[9px] leading-none">★</span>
                        <span className="text-[9px] leading-none">★</span>
                      </div>
                      <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.22em] text-emerald-200">Reservas online</p>
                    </div>
                  </div>
                <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-200 backdrop-blur-xl sm:inline-flex">
                  <Target className="h-4 w-4 text-emerald-300" />
                  Acceso Público
                </div>
              </div>

              <div className="max-w-3xl space-y-2">
                <h1 className="text-3xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[2.35rem] lg:text-[2.75rem]">
                  Reservá tu cancha en minutos
                </h1>
                <p className="max-w-xl text-sm leading-6 text-zinc-200 md:text-base">
                  Elegí complejo, horario y jugá.
                </p>
              </div>

              <div className="grid max-w-3xl gap-2.5 sm:grid-cols-[minmax(0,1fr)_142px] sm:items-center">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-300/80" />
                  <input
                    type="text"
                    value={publicSearchTerm}
                    onChange={(e) => setPublicSearchTerm(e.target.value)}
                    placeholder="Buscar complejo"
                    className="h-10 w-full rounded-2xl border border-sky-200/20 bg-black/25 pl-11 pr-4 text-sm text-white placeholder:text-zinc-300/60 backdrop-blur-xl outline-none transition-all focus:border-sky-200/70 focus:bg-black/35"
                  />
                </div>
                <div className="rounded-2xl border border-sky-200/20 bg-white/10 px-3 py-2 backdrop-blur-xl">
                  <p className="text-[8px] font-black uppercase tracking-[0.22em] text-zinc-300">Complejos activos</p>
                  <p className="mt-0.5 text-xl font-black tracking-tight text-white">{filteredPublicClients.length}</p>
                </div>
              </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                <WorldCupCountdownCard />

                <div className="relative min-h-[96px] overflow-hidden rounded-2xl border border-amber-200/25 bg-black/25 p-3 shadow-[0_16px_45px_rgba(2,6,23,0.18)] backdrop-blur-xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-300 via-white to-amber-300" />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCarouselItem.title}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="flex items-center gap-3"
                    >
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg', activeCarouselItem.accent)}>
                        <ActiveCarouselIcon className="h-5 w-5 text-slate-950" />
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-[-0.03em] text-white">{activeCarouselItem.title}</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-300">{activeCarouselItem.description}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-sky-100">
                Complejos disponibles
              </h2>

            {isPublicClientsLoading ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,300px))] justify-center gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[168px] rounded-[24px] border border-sky-200/15 bg-white/10 animate-pulse backdrop-blur-xl" />
                ))}
              </div>
            ) : filteredPublicClients.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-black/30 p-6 text-center text-zinc-200 backdrop-blur-xl">
                No hay complejos activos disponibles para mostrar.
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,300px))] justify-center gap-3">
                {filteredPublicClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectPublicClient(client)}
                    className="group relative overflow-hidden rounded-[24px] border border-sky-200/20 border-l-sky-300/55 border-r-white/20 bg-slate-950/35 p-3 text-left shadow-[0_12px_34px_rgba(2,6,23,0.25)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200/55 hover:bg-sky-950/35 sm:p-3.5"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-300/70 via-white/70 to-amber-200/70" />
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-300/14 to-transparent" />
                      <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-sky-400/12 blur-3xl" />
                    </div>

                    <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/95 text-zinc-900 shadow-[0_10px_24px_rgba(255,255,255,0.1)] sm:h-14 sm:w-14">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={getClientDisplayName(client)}
                            className="h-full w-full object-contain p-2"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#dbeafe_45%,#dcfce7_100%)] p-2 text-center">
                            <span className="text-lg font-black tracking-[-0.06em] text-slate-900">
                              {getClientInitials(client)}
                            </span>
                            <span className="mt-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Sin logo
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/25 bg-sky-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-sky-100 backdrop-blur-md">
                        Reservar
                        <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col">
                      <div className="mb-2.5">
                        <p className="mb-1 text-[8px] font-black uppercase tracking-[0.24em] text-zinc-300/80">
                          Complejo deportivo
                        </p>
                        <h2 className="line-clamp-2 text-lg font-black tracking-[-0.04em] text-white sm:text-xl">
                          {getClientDisplayName(client)}
                        </h2>
                      </div>
                      <div className="mt-auto space-y-2.5">
                        <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur-md">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">Dirección</p>
                            <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-zinc-100">
                              {client.address || 'Complejo habilitado para reservas y acceso público.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">
                            Reservas online
                          </span>
                          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-sky-50 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-900 shadow-lg shadow-sky-950/20 transition-transform duration-300 group-hover:translate-x-1">
                            Reservar
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            </section>
          </motion.div>
        </div>
      );
    }

    if (isAdminRoute) return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-start p-4 sm:p-6 lg:p-10 relative overflow-y-auto overflow-x-hidden">
        {/* Background Image - Campeones del Mundo 2022 (Rotativo) */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={bgImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              src={bgImage} 
              alt="Campeones del Mundo 2022" 
              className="w-full h-full object-cover grayscale-[0.2] contrast-125"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Top Header */}
        <div className="absolute top-6 sm:top-8 lg:top-10 left-0 right-0 flex justify-center z-20">
           <h2 className="text-sky-400 font-black tracking-[0.4em] text-[10px] uppercase bg-sky-500/10 px-6 py-2 rounded-full border border-sky-500/20 backdrop-blur-md">
             BIENVENIDO A GOLAZO
           </h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm bg-white/20 backdrop-blur-xl rounded-[40px] p-6 sm:p-8 lg:p-9 shadow-2xl border border-white/20 relative z-10"
        >
          <div className="flex items-center justify-end mb-5">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.22em]">
              Portal Admin
            </span>
          </div>

          <div className="flex flex-col items-center mb-7">
            <ArgentinaLogo size="md" />
            <p className="text-zinc-700 font-black mt-3 tracking-[0.3em] uppercase text-[9px]">Gestión de Canchas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-3.5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] ml-1">
                  Email
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="email" 
                    required
                    placeholder="tu@email.com"
                    className="w-full pl-14 pr-6 py-4 bg-zinc-50/80 border border-zinc-200 text-zinc-900 rounded-3xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-zinc-400"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] ml-1">Contraseña</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="password" 
                    required
                    placeholder="********"
                    className="w-full pl-14 pr-6 py-4 bg-zinc-50/80 border border-zinc-200 text-zinc-900 rounded-3xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-2 rounded-xl border border-red-500/20">
                  {loginError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full py-4 sm:py-5 text-lg font-black tracking-widest shadow-2xl shadow-sky-500/20 rounded-[24px] bg-argentina text-zinc-900">
              ENTRAR
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const renderDashboard = () => (
    <Dashboard
      user={activeUser}
      onNavigate={(page) => setCurrentPage(page as Page)}
      onLogout={isPublicPortalActive ? handleBackToClientSelector : handleLogout}
      onNotificationClick={(id) => {
        setSelectedBookingId(id);
        setCurrentPage('calendar');
      }}
      clientConfig={clientConfig}
    />
  );

  const renderPage = () => {
    if (!activeUser) return null;
    const isAdmin = activeUser.role === 'admin' || activeUser.role === 'superadmin';
    
    switch (currentPage) {
      case 'dashboard': return renderDashboard();
      case 'bookings': 
        if (clientConfig && clientConfig.features?.reservas === false) return renderDashboard();
        return <BookingsList user={activeUser} />;
      case 'calendar': 
        if (clientConfig && clientConfig.features?.reservas === false) return renderDashboard();
        return <CalendarPage user={activeUser} clientConfig={clientConfig} initialBookingId={selectedBookingId} onClearInitialBooking={() => setSelectedBookingId(null)} />;
      case 'ranking': 
        if (clientConfig && clientConfig.features?.ranking === false) return renderDashboard();
        return <RankingPage user={activeUser} />;
      case 'stats': 
        if (clientConfig && clientConfig.features?.estadisticas === false) return renderDashboard();
        return isAdmin ? <SmartStats /> : renderDashboard();
      case 'sales': 
        if (clientConfig && clientConfig.features?.ventas === false) return renderDashboard();
        return isAdmin ? <SalesPage /> : renderDashboard();
      case 'admin': return isAdmin ? <Admin onLogout={handleLogout} /> : renderDashboard();
      default: return renderDashboard();
    }
  };

  if (!activeUser) {
    return null;
  }

  if (isPublicPortalActive) {
    return (
      <div className="relative h-screen overflow-hidden overflow-x-hidden bg-slate-950 text-white">
        <div
          className="fixed inset-0"
          style={{
            backgroundImage: `url(${PUBLIC_SELECTION_BACKGROUND})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.62)_0%,rgba(2,6,23,0.78)_42%,rgba(2,6,23,0.94)_100%)]" />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/62 px-4 py-2 backdrop-blur-2xl sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white shadow-xl sm:h-12 sm:w-12">
                  {publicPortalLogo ? (
                    <img src={publicPortalLogo} alt={publicPortalClientName} className="h-full w-full object-contain p-2" />
                  ) : selectedPublicClient ? (
                    <span className="text-lg font-black tracking-[-0.05em] text-slate-900">
                      {getClientInitials(selectedPublicClient)}
                    </span>
                  ) : (
                    <ArgentinaLogo size="sm" showText={false} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.24em] text-emerald-200">Reservas Golazo</p>
                  <h1 className="truncate text-base font-black tracking-[-0.04em] text-white sm:text-xl">
                    {publicPortalClientName}
                  </h1>
                </div>
              </div>

              <nav className="hidden items-center gap-2 lg:flex">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.16em] transition-all",
                      currentPage === item.id
                        ? "bg-white text-slate-950 shadow-xl"
                        : "border border-white/10 bg-white/10 text-white/75 hover:bg-white/15 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {getPublicNavLabel(item)}
                  </button>
                ))}
              </nav>

              {publicEntryMode === 'catalog' && (
                <button
                  type="button"
                  onClick={handleBackToClientSelector}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl transition-all hover:bg-white/15 sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Cambiar complejo</span>
                </button>
              )}
            </div>
          </header>

          <main className="relative z-10 mx-auto min-h-0 w-full max-w-[1440px] flex-1 overflow-y-auto overflow-x-hidden px-4 pb-32 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 w-full"
            >
              <Suspense fallback={<PageFallback />}>
                {renderPage()}
              </Suspense>
            </motion.div>
          </main>

          <nav
            className="fixed inset-x-3 bottom-3 z-50 grid gap-2 rounded-[24px] border border-white/15 bg-slate-950/86 p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden"
            style={{ gridTemplateColumns: `repeat(${filteredNavItems.length}, minmax(0, 1fr))` }}
          >
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentPage(item.id as Page)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-black uppercase tracking-tight transition-all",
                  currentPage === item.id
                    ? "bg-white text-slate-950"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="leading-tight">{getPublicNavLabel(item)}</span>
              </button>
            ))}
          </nav>
        </div>

        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Sidebar / Desktop Nav */}
      <aside className="z-40 hidden lg:flex flex-col shrink-0 fixed left-0 top-0 h-screen w-56 bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300">
        <div className="p-4 flex flex-col items-center gap-2">
          <div className="relative group block w-24">
            {activeUser.role === 'admin' && (
              <input 
                type="file" 
                id="logo-upload-sidebar" 
                className="hidden" 
                onChange={handleLogoUpload} 
                accept="image/*" 
              />
            )}
            <div 
              onClick={() => setIsLogoModalOpen(true)}
              className={cn(
                "w-24 h-24 rounded-[32px] border-2 flex flex-col items-center justify-center transition-all overflow-hidden bg-white shadow-2xl relative group/logo cursor-pointer",
                customLogo 
                  ? "border-transparent" 
                  : "border-sky-400/30 hover:border-sky-500"
              )}
            >
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center justify-center p-2">
                  <ArgentinaLogo size="md" showText={false} className="scale-110" />
                  <p className="text-[7px] font-black text-sky-600 uppercase tracking-widest text-center mt-1">
                    {activeUser.role === 'admin' ? 'CONFIGURAR' : 'GOLAZO'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="text-center mt-2 px-2">
            <h3 className="text-white font-black text-[10px] uppercase tracking-tighter leading-tight">
              {clientConfig?.name || 'Complejo'}
            </h3>
            <p className="text-sky-400 font-bold text-[8px] uppercase tracking-[0.2em] mt-0.5">
              GOLAZO <span className="text-zinc-500 font-medium">by SUR Byte'S</span>
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all shrink-0 border-2 relative overflow-hidden group",
                currentPage === item.id 
                  ? "text-white border-sky-400 shadow-lg" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border-transparent hover:border-slate-700"
              )}
            >
              {currentPage === item.id && (
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
              )}
              {currentPage === item.id && (
                <div className="w-3 h-2.5 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                  <div className="h-1/3 bg-[#74acdf]" />
                  <div className="h-1/3 bg-white flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                  </div>
                  <div className="h-1/3 bg-[#74acdf]" />
                </div>
              )}
              <item.icon className={cn(
                "w-4.5 h-4.5 relative z-10",
                currentPage === item.id ? "text-white" : "text-slate-500 group-hover:text-white"
              )} />
              <span className="relative z-10 uppercase tracking-tighter text-xs">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800 shrink-0 bg-inherit">
          {activeUser.role !== 'admin' ? (
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-800 transition-all group flex items-center justify-center"
            >
              <ArgentinaLogo size="sm" className="transition-all" />
            </button>
          ) : (
            <div className="px-4 py-3 flex items-center justify-center">
              <ArgentinaLogo size="sm" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Nav */}
      <header className="lg:hidden fixed top-0 left-0 right-0 border-b px-6 py-4 flex items-center justify-between z-40 bg-sky-50 border-sky-100 shadow-lg">
        <div className="flex items-center gap-3">
          {customLogo ? (
            <div className="flex items-center gap-3">
              <img src={customLogo} alt="Logo" className="w-10 h-10 object-cover rounded-xl border border-zinc-100 shadow-sm" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                  {clientConfig?.name || 'Complejo'}
                </span>
                <span className="text-lg font-black tracking-tighter text-zinc-900 leading-none">GOLAZO</span>
                <span className="text-[6px] text-zinc-500 font-medium uppercase tracking-widest mt-0.5">by SUR Byte'S</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ArgentinaLogo size="md" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                  {clientConfig?.name || 'Complejo'}
                </span>
                <span className="text-lg font-black tracking-tighter text-zinc-900 leading-none">GOLAZO</span>
                <span className="text-[6px] text-zinc-500 font-medium uppercase tracking-widest mt-0.5">by SUR Byte'S</span>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-zinc-900" /> : <Menu className="w-6 h-6 text-zinc-900" />}
        </button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden fixed inset-x-4 top-[80px] z-50 p-6 space-y-4 rounded-[32px] shadow-2xl border bg-sky-50 border-sky-200 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200"
            >
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all relative overflow-hidden",
                  currentPage === item.id 
                    ? "text-zinc-900 shadow-lg shadow-sky-500/20 border-2 border-sky-400" 
                    : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                {currentPage === item.id && (
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
                )}
                {currentPage === item.id && (
                  <div className="w-5 h-4 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0 relative z-10">
                    <div className="h-1/3 bg-[#74acdf]" />
                    <div className="h-1/3 bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                    </div>
                    <div className="h-1/3 bg-[#74acdf]" />
                  </div>
                )}
                <item.icon className={cn("w-6 h-6 relative z-10", currentPage === item.id ? "text-zinc-900" : "text-zinc-400")} />
                <span className="relative z-10 uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-4 py-4 text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="w-6 h-6" />
                Cerrar Sesión
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 pt-24 lg:pt-0 p-4 sm:p-6 lg:p-8 w-full relative h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto w-full">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<PageFallback />}>
              {renderPage()}
            </Suspense>
          </motion.div>
        </div>
      </main>

      {activeUser.role === 'admin' && (
        <Suspense fallback={null}>
          <AIChatFloating />
        </Suspense>
      )}
      
      {/* Logo Viewer Modal */}
      <Modal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        title="Logo del Complejo"
        className="max-w-md"
      >
        <div className="space-y-6">
          <div className="aspect-square w-full rounded-[40px] overflow-hidden bg-zinc-100 border border-zinc-200 shadow-inner flex items-center justify-center">
            {customLogo ? (
              <img src={customLogo} alt="Logo Complejo" className="w-full h-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-zinc-400">
                <ImageIcon className="w-16 h-16 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Sin logo personalizado</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            {activeUser.role === 'admin' && (
              <Button 
                onClick={() => {
                  document.getElementById('logo-upload-sidebar')?.click();
                  setIsLogoModalOpen(false);
                }}
                className="w-full py-5 rounded-3xl font-black tracking-widest uppercase gap-3"
              >
                <Upload className="w-5 h-5" />
                Cambiar Imagen
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsLogoModalOpen(false)}
              className="w-full py-5 rounded-3xl font-black tracking-widest uppercase border-zinc-200"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Toaster position="top-center" richColors />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar la sesión?"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
      />
    </div>
  );
}
