import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Globe, 
  ShieldCheck, 
  LayoutDashboard,
  LogOut,
  Search,
  User as UserIcon,
  Monitor,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { dataService } from '../services/dataService';
import { User } from '../types';
import { cn } from '../lib/utils';

export default function SuperAdminDashboard() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setOnlineUsers(dataService.getOnlineUsers());
    const interval = setInterval(() => {
      setOnlineUsers(dataService.getOnlineUsers());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = onlineUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Super Admin Panel</h1>
          </div>
          <p className="text-zinc-500 font-medium">Control global de clientes y actividad en tiempo real</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Sistema Online</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <Card className="bg-zinc-900 border-zinc-800 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-sky-500" />
              </div>
              <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
                +12% hoy
              </Badge>
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1">Clientes Online</p>
            <h3 className="text-4xl font-black tracking-tighter">{onlineUsers.length}</h3>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <Badge variant="neutral" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                Estable
              </Badge>
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1">Instancias Activas</p>
            <h3 className="text-4xl font-black tracking-tighter">1</h3>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-500" />
              </div>
              <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
                99.9%
              </Badge>
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1">Uptime Global</p>
            <h3 className="text-4xl font-black tracking-tighter">24/7</h3>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-green-500" />
              </div>
              <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
                Live
              </Badge>
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1">Versión Producto</p>
            <h3 className="text-4xl font-black tracking-tighter">v2.4</h3>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Monitor className="w-6 h-6 text-sky-500" />
            Monitoreo de Clientes en Línea
          </h2>
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full pl-12 pr-6 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => (
            <motion.div 
              key={u.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-zinc-900 border-zinc-800 rounded-3xl hover:border-sky-500/50 transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-lg truncate">{u.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          u.role === 'admin' ? "bg-sky-500/10 text-sky-500 border-sky-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}>
                          {u.role}
                        </Badge>
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                          Activo
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">Email</span>
                      <span className="text-zinc-300 font-medium">{u.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">Teléfono</span>
                      <span className="text-zinc-300 font-medium">{u.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">Dispositivo</span>
                      <div className="flex items-center gap-1 text-zinc-300">
                        <Smartphone className="w-3 h-3" />
                        <span>Mobile App</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Users className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest">No hay clientes en línea que coincidan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
