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
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import BookingsList from './pages/BookingsList';
import CalendarPage from './pages/Calendar';
import SalesPage from './pages/Sales';
import RankingPage from './pages/Ranking';
import StatsPage from './pages/Stats';
import AIChatFloating from './components/AIChatFloating';
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

  useEffect(() => {
    const currentUser = dataService.getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

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
    { id: 'dashboard', label: 'Inicio ⚽', icon: Home, roles: ['admin', 'client'] },
    { id: 'bookings', label: 'Mis Reservas', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['admin', 'client'] },
    { id: 'ranking', label: 'Ranking & Puntos', icon: Trophy, roles: ['admin', 'client'] },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, roles: ['admin'] },
    { id: 'sales', label: 'Ventas/Bar', icon: ShoppingBag, roles: ['admin'] },
    { id: 'admin', label: 'Configuración', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-800"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/20 mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white">GOLAZO</h1>
            <p className="text-zinc-500 font-medium">Gestión de Canchas Pro</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 ml-1">Email</label>
              <input 
                type="email" 
                required
                placeholder="admin@gmail.com o cliente@gmail.com"
                className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-white rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 ml-1">
                Usa admin@gmail.com para panel de control
              </p>
            </div>

            <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight">
              INGRESAR AL SISTEMA
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
    <div className="min-h-screen flex flex-col lg:flex-row dark bg-zinc-950 text-zinc-100">
      {/* Sidebar / Desktop Nav */}
      <aside className="z-40 hidden lg:flex flex-col shrink-0 fixed left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">GOLAZO</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all shrink-0",
                currentPage === item.id 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-zinc-800 shrink-0 bg-inherit">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black flex items-center gap-1">
                {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-green-500" />}
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
      <header className="lg:hidden fixed top-0 left-0 right-0 border-b px-6 py-4 flex items-center justify-between z-40 bg-zinc-900 border-zinc-800">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-green-500" />
          <span className="text-xl font-black tracking-tighter">GOLAZO</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-x-4 top-[80px] z-30 p-6 space-y-4 rounded-[32px] shadow-2xl border bg-zinc-900 border-zinc-800"
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
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                    : "text-zinc-400 hover:bg-zinc-800"
                )}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </button>
            ))}
            <div className="pt-4 border-t border-zinc-800 space-y-2">
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
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-24 lg:pt-0 p-6 lg:p-10 w-full max-w-full">
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
    </div>
  );
}
