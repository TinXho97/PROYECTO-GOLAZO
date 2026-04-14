import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Users, Activity, Lock, Check, X, Calendar, Power, Search, Key, Trash2, Plus, LayoutDashboard, Building2, BarChart2, Settings, LogOut, MoreVertical, CheckCircle2, XCircle, ExternalLink, ChevronRight, Eye, EyeOff, Copy, RefreshCw, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Client } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function SuperAdminSaaS() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'users' | 'metrics' | 'settings'>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLoginAsClient = (client: Client) => {
    const clientAdmins = users.filter(u => u.user_metadata?.client_id === client.id);
    if (clientAdmins.length > 0) {
      const admin = clientAdmins[0];
      const user = {
        id: admin.id,
        email: admin.email,
        name: client.complex_name || client.name,
        role: 'admin',
        client_id: client.id
      };
      localStorage.setItem('golazo_user', JSON.stringify(user));
      window.location.href = '/';
    } else {
      toast.error('Este cliente no tiene administradores asignados.');
    }
  };

  // User creation state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [metrics, setMetrics] = useState({
    users: 0,
    products: 0,
    sales: 0,
    bookings: 0
  });
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    client_id: '',
    create_new_client: true,
    client_name: '',
    complex_name: '',
    phone: '',
    address: '',
    features: {
      reservas: true,
      ventas: true,
      ranking: true,
      estadisticas: true
    }
  });

  const invokeAdminOp = async (action: string, payload: any = {}) => {
    const superAdminPassword = import.meta.env.VITE_SUPERADMIN_PASSWORD || 'exemartinygolazo2026';
    const { data, error } = await supabase.functions.invoke('admin-ops', {
      body: { action, payload },
      headers: { 'x-superadmin-password': superAdminPassword }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user?.user_metadata?.role !== 'superadmin') {
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de superadmin');
      }

      setIsAuthenticated(true);
      fetchClients();
      fetchMetrics();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await invokeAdminOp('get_metrics');
      setMetrics({
        users: data.users || 0,
        products: data.products || 0,
        sales: data.sales || 0,
        bookings: data.bookings || 0
      });
    } catch (e) {
      console.error('Error fetching metrics:', e);
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await invokeAdminOp('list_clients');
      const clientsData = data.clients || [];
      
      if (clientsData.length === 0 && !import.meta.env.VITE_SUPABASE_URL) {
        // Fallback to mock clients for demo purposes
        setClients([
          {
            id: 'client-1',
            name: 'GOLAZO Demo',
            status: 'active',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            features: {
              reservas: true,
              ventas: true,
              ranking: true,
              estadisticas: true
            }
          },
          {
            id: 'client-2',
            name: 'Canchas El Diez',
            status: 'suspended',
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            features: {
              reservas: true,
              ventas: true,
              ranking: false,
              estadisticas: true
            }
          }
        ]);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClientStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'suspended' : 'active';
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { error } = await supabase.from('clients').update({ status: newStatus }).eq('id', client.id);
        if (error) throw error;
      }
      setClients(clients.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const toggleFeature = async (client: Client, feature: keyof Client) => {
    const newValue = !client[feature];
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { error } = await supabase.from('clients').update({ [feature]: newValue }).eq('id', client.id);
        if (error) throw error;
      }
      setClients(clients.map(c => c.id === client.id ? { ...c, [feature]: newValue as boolean } : c));
    } catch (err) {
      console.error('Error updating feature:', err);
    }
  };

  const toggleJsonFeature = async (client: Client, featureKey: string) => {
    const currentFeatures = client.features || {};
    // If it's undefined, we assume it was true by default, so we toggle to false
    const currentValue = currentFeatures[featureKey] !== false;
    const newFeatures = { ...currentFeatures, [featureKey]: !currentValue };
    
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { error } = await supabase.from('clients').update({ features: newFeatures }).eq('id', client.id);
        if (error) throw error;
      }
      setClients(clients.map(c => c.id === client.id ? { ...c, features: newFeatures } : c));
    } catch (err) {
      console.error('Error updating json feature:', err);
    }
  };

  const extendExpiration = async (client: Client, days: number) => {
    const currentExp = client.expires_at ? new Date(client.expires_at) : new Date();
    const newExp = new Date(currentExp);
    newExp.setDate(newExp.getDate() + days);
    
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { error } = await supabase.from('clients').update({ expires_at: newExp.toISOString() }).eq('id', client.id);
        if (error) throw error;
      }
      setClients(clients.map(c => c.id === client.id ? { ...c, expires_at: newExp.toISOString() } : c));
    } catch (err) {
      console.error('Error extending expiration:', err);
    }
  };

  const handleCopyPassword = (password?: string) => {
    if (!password) {
      toast.error('Contraseña no disponible. Debes crear el usuario de nuevo para verla.');
      return;
    }
    navigator.clipboard.writeText(password);
    toast.success('Contraseña copiada al portapapeles');
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('client_users')
        .select(`
          id,
          user_id,
          role,
          created_at,
          client_id,
          clients ( name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear al formato esperado por la tabla
      const formattedUsers = data?.map(cu => ({
        id: cu.user_id,
        email: 'Oculto por seguridad (Auth)', // El email real está en auth.users
        created_at: cu.created_at,
        user_metadata: {
          role: cu.role,
          client_id: cu.client_id,
          name: cu.clients?.name
        }
      })) || [];

      setUsers(formattedUsers as any);
    } catch (error: any) {
      console.error('Error fetching users:', error.message || error);
      toast.error('Error al cargar usuarios: ' + (error.message || 'Error desconocido'));
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await invokeAdminOp('create_admin_user', {
        clientData: newUser.create_new_client ? {
          create_new: true,
          name: newUser.client_name || newUser.complex_name,
          complex_name: newUser.complex_name,
          phone: newUser.phone,
          address: newUser.address,
          features: newUser.features
        } : {
          create_new: false,
          id: newUser.client_id
        },
        userData: {
          email: newUser.email,
          password: newUser.password,
          name: newUser.client_name || newUser.complex_name
        }
      });

      toast.success('Usuario y cliente creados exitosamente');
      setIsUserModalOpen(false);
      setNewUser({ 
        email: '', 
        password: '', 
        client_id: '',
        create_new_client: true,
        client_name: '',
        complex_name: '',
        phone: '',
        address: '',
        features: {
          reservas: true,
          ventas: true,
          ranking: true,
          estadisticas: true
        }
      });
      fetchClients();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      await invokeAdminOp('delete_user', { userId });
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = window.prompt('Ingrese la nueva contraseña:');
    if (!newPassword) return;
    
    try {
      await invokeAdminOp('reset_password', { userId, newPassword });
      toast.success('Contraseña actualizada');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar contraseña');
    }
  };

  const resetRanking = async (client: Client) => {
    if (!window.confirm(`¿Estás seguro de que deseas resetear el ranking para el cliente ${client.name}?`)) return;
    
    try {
      const resetDate = new Date().toISOString();
      const { error } = await supabase
        .from('clients')
        .update({ ranking_reset_date: resetDate })
        .eq('id', client.id);

      if (error) throw error;
      
      setClients(clients.map(c => c.id === client.id ? { ...c, ranking_reset_date: resetDate } : c));
    } catch (error) {
      console.error('Error resetting ranking:', error);
    }
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
                placeholder="Contraseña maestra"
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
  
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.complex_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Building2 },
    { id: 'users', label: 'Administradores', icon: Users },
    { id: 'metrics', label: 'Métricas', icon: BarChart2 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ] as const;

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
          {navItems.map(item => (
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
            onClick={() => window.location.href = '/'}
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
                    const clientAdmins = users.filter(u => u.user_metadata?.client_id === client.id);
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
                                      const adminUser = users.find(u => u.user_metadata?.client_id === client.id);
                                      const userToLogin = {
                                        id: adminUser ? adminUser.id : 'superadmin-impersonate',
                                        email: adminUser ? adminUser.email : 'superadmin@impersonate.com',
                                        name: adminUser ? adminUser.user_metadata?.name || client.name : `Admin ${client.name}`,
                                        role: 'admin',
                                        client_id: client.id
                                      };
                                      localStorage.setItem('golazo_user', JSON.stringify(userToLogin));
                                      window.location.href = '/dashboard';
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
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Modules */}
                        <div className="mb-6">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Módulos Habilitados</h4>
                          <div className="flex flex-wrap gap-2">
                            {['reservas', 'ventas', 'ranking', 'estadisticas'].map(mod => {
                              const isEnabled = client.features?.[mod] !== false;
                              return (
                                <div key={mod} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${isEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                  {isEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                  <span className="capitalize">{mod}</span>
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
                                    <span className="text-xs font-bold text-white">{admin.email.substring(0,2).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-200">{admin.email}</p>
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
                  <h2 className="text-2xl font-black text-white tracking-tight">Usuarios Globales</h2>
                  <p className="text-slate-400 text-sm mt-1">Gestión de todos los administradores del sistema</p>
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
                        <th className="px-6 py-5">Contraseña</th>
                        <th className="px-6 py-5">Último Acceso</th>
                        <th className="px-6 py-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay usuarios registrados</td>
                        </tr>
                      ) : (
                        users.map(user => {
                          const client = clients.find(c => c.id === user.user_metadata?.client_id);
                          return (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-white">{user.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                    {user.user_metadata?.role || 'admin'}
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
                                    <div className="text-slate-300 text-xs">{client.phone || 'Sin teléfono'}</div>
                                    <div className="text-slate-500 text-[10px] truncate max-w-[150px]">{client.address || 'Sin dirección'}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="font-mono text-xs bg-[#0B0F19] px-2 py-1 rounded border border-white/10 text-slate-300 w-24 text-center">
                                    {visiblePasswords[user.id] ? (user.user_metadata?.password || 'No guardada') : '••••••••'}
                                  </div>
                                  <button
                                    onClick={() => togglePasswordVisibility(user.id)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                                    title={visiblePasswords[user.id] ? "Ocultar contraseña" : "Ver contraseña"}
                                  >
                                    {visiblePasswords[user.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopyPassword(user.user_metadata?.password)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                                    title="Copiar contraseña"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
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

          {activeTab === 'settings' && (
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
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{key}</span>
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
    </div>
  );
}
