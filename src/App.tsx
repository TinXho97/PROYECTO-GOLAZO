import React, { useState, useEffect } from 'react';
import { 
  Home, 
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
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import BookingsList from './pages/BookingsList';
import CalendarPage from './pages/Calendar';
import SalesPage from './pages/Sales';
import RankingPage from './pages/Ranking';
import StatsPage from './pages/Stats';
import AIChatFloating from './components/AIChatFloating';
import { ArgentinaLogo } from './components/ArgentinaLogo';
import { Button } from './components/Button';
import { cn } from './lib/utils';
import { dataService } from './services/dataService';
import { User } from './types';

type Page = 'dashboard' | 'bookings' | 'calendar' | 'sales' | 'admin' | 'ranking' | 'stats';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('golazo_custom_logo'));

  useEffect(() => {
    const currentUser = dataService.getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomLogo(base64String);
        localStorage.setItem('golazo_custom_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    const newUser = dataService.login(loginEmail);
    setUser(newUser);
  };

  const handleLogout = () => {
    dataService.logout();
    setUser(null);
    setCurrentPage('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'INICIO', icon: Home, roles: ['admin', 'client'] },
    { id: 'bookings', label: 'Mis Reservas', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'ranking', label: 'Ranking & Puntos', icon: Trophy, roles: ['admin', 'client'] },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, roles: ['admin'] },
    { id: 'sales', label: 'Ventas/Bar', icon: ShoppingBag, roles: ['admin'] },
    { id: 'admin', label: 'Configuración', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  const BACKGROUND_IMAGES = [
    "https://storage.googleapis.com/static.ai.studio/build/user_uploads/1742685262704-5867375698946726.png", // Festejo equipo completo
    "https://storage.googleapis.com/static.ai.studio/build/user_uploads/1742685262704-3677464049845789.png", // Messi besando la copa
    "https://images.unsplash.com/photo-1671379866222-461040069918?q=80&w=2070&auto=format&fit=crop", // Messi levantando la copa
    "https://images.unsplash.com/photo-1671404175782-461040069918?q=80&w=2070&auto=format&fit=crop", // Hinchada argentina
    "https://images.unsplash.com/photo-1671379866222-461040069918?q=80&w=2070&auto=format&fit=crop&sat=-100" // Blanco y negro épico
  ];

  const [bgImage, setBgImage] = useState(BACKGROUND_IMAGES[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    setBgImage(BACKGROUND_IMAGES[randomIndex]);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Image - Campeones del Mundo 2022 (Rotativo) */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={bgImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              src={bgImage} 
              alt="Campeones del Mundo 2022" 
              className="w-full h-full object-cover grayscale-[0.2] contrast-125"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/20 to-zinc-50/60" />
        </div>

        {/* Top Header */}
        <div className="absolute top-12 left-0 right-0 flex justify-center z-20">
           <h2 className="text-sky-400 font-black tracking-[0.4em] text-[10px] uppercase bg-sky-500/10 px-6 py-2 rounded-full border border-sky-500/20 backdrop-blur-md">
             INGRESAR AL SISTEMA
           </h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-[48px] p-10 shadow-2xl border border-zinc-200 relative z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <ArgentinaLogo size="lg" />
            <p className="text-zinc-500 font-black mt-4 tracking-[0.3em] uppercase text-[9px]">Gestión de Canchas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Tu Email</label>
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  required
                  placeholder="admin@gmail.com"
                  className="w-full pl-14 pr-6 py-5 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-3xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-zinc-400"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                />
              </div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-3 ml-1 text-center">
                Usa admin@gmail.com para panel de control
              </p>
            </div>

            <Button type="submit" className="w-full py-6 text-lg font-black tracking-widest shadow-2xl shadow-sky-500/20 rounded-[24px] bg-argentina text-zinc-900">
              ENTRAR
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'bookings': return <BookingsList user={user} />;
      case 'calendar': return <CalendarPage user={user} />;
      case 'ranking': return <RankingPage user={user} />;
      case 'stats': return <StatsPage />;
      case 'sales': return <SalesPage />;
      case 'admin': return user.role === 'admin' ? <Admin /> : <Dashboard user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 text-zinc-900 overflow-x-hidden">
      {/* Sidebar / Desktop Nav */}
      <aside className="z-40 hidden lg:flex flex-col shrink-0 fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-zinc-900 shadow-2xl">
        <div className="p-6">
          <label className="relative group cursor-pointer block">
            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
            <div className={cn(
              "w-full aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
              customLogo 
                ? "border-transparent bg-zinc-100" 
                : "border-zinc-200 hover:border-sky-500/50 hover:bg-sky-500/5"
            )}>
              {customLogo ? (
                <>
                  <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-zinc-400" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center px-4">
                    Arrastra tu logo aquí
                  </p>
                </>
              )}
            </div>
          </label>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all shrink-0 border",
                currentPage === item.id 
                  ? "bg-argentina text-zinc-900 shadow-lg shadow-sky-500/20 border-zinc-900" 
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 border-transparent hover:border-zinc-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-zinc-200 shrink-0 bg-inherit">
          {/* Logo Golazo moved here */}
          <div className="px-4 py-3 opacity-60 hover:opacity-100 transition-all cursor-default mb-2">
            <ArgentinaLogo size="sm" />
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-zinc-900">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black flex items-center gap-1">
                {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-sky-500" />}
                {user.role}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <header className="lg:hidden fixed top-0 left-0 right-0 border-b px-6 py-4 flex items-center justify-between z-40 bg-white border-zinc-900 shadow-lg">
        <div className="flex items-center gap-3">
          {customLogo ? (
            <div className="flex items-center gap-3">
              <img src={customLogo} alt="Logo" className="w-10 h-10 object-cover rounded-xl border border-zinc-100 shadow-sm" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">App</span>
                <span className="text-xl font-black tracking-tighter text-zinc-900 leading-none">GOLAZO</span>
              </div>
            </div>
          ) : (
            <ArgentinaLogo size="md" />
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
              className="lg:hidden fixed inset-x-4 top-[80px] z-50 p-6 space-y-4 rounded-[32px] shadow-2xl border bg-white border-zinc-900 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200"
            >
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all",
                  currentPage === item.id 
                    ? "bg-argentina text-zinc-900 shadow-lg shadow-sky-500/20" 
                    : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
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
      <main className="flex-1 lg:ml-64 pt-24 lg:pt-0 p-6 lg:p-10 w-full max-w-full relative">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderPage()}
        </motion.div>
      </main>

      {user.role === 'admin' && <AIChatFloating />}
      <Toaster position="top-center" richColors />
    </div>
  );
}
