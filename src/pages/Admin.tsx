import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  LayoutGrid, 
  List, 
  BarChart3, 
  Package, 
  Settings, 
  ShieldCheck, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Activity,
  Trophy,
  User as UserIcon,
  History,
  Clock,
  Search,
  Upload,
  Image as ImageIcon,
  LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Badge } from '../components/Badge';
import { dataService, api } from '../services/dataService';
import { Pitch, Product, AuditLog } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface AdminProps {
  onLogout: () => void;
}

export default function Admin({ onLogout }: AdminProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'pitch' | 'product', id: string } | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('golazo_custom_logo'));
  
  const [activeTab, setActiveTab] = useState<'general' | 'canchas' | 'productos' | 'sistema'>('general');
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // Stock Management State
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [isBulkStockPreviewOpen, setIsBulkStockPreviewOpen] = useState(false);
  const [bulkStockUpdates, setBulkStockUpdates] = useState<Record<string, number>>({});
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<Product | null>(null);
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState<number>(0);
  
  useEffect(() => {
    const checkSupabase = async () => {
      const connected = await dataService.checkConnection();
      setSupabaseStatus(connected ? 'connected' : 'disconnected');
    };
    checkSupabase();
  }, []);
  
  const [pitchForm, setPitchForm] = useState({
    name: '',
    type: 'F5' as Pitch['type'],
    price: 0,
    active: true,
    image_url: '',
  });

  const defaultProductForm = {
    name: '',
    price: 0,
    category: 'bebida' as Product['category'],
    stock: 0,
    min_stock: 5,
  };

  const [productForm, setProductForm] = useState(defaultProductForm);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    dataService.getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const clientId = user?.client_id;
      const pi = await dataService.getPitches(clientId);
      const pr = await dataService.getProducts(clientId);
      const logs = await dataService.getAuditLogs(clientId);
      setPitches(pi);
      setProducts(pr);
      setAuditLogs(logs);
    };
    fetchData();
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    const clientId = user?.client_id;
    const pi = await dataService.getPitches(clientId);
    const pr = await dataService.getProducts(clientId);
    const logs = await dataService.getAuditLogs(clientId);
    setPitches(pi);
    setProducts(pr);
    setAuditLogs(logs);
  };

  const handleSavePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPitch) {
        await api.updatePitch(editingPitch.id, pitchForm);
      } else {
        await api.addPitch(pitchForm);
      }
      refreshData();
      setIsPitchModalOpen(false);
      setEditingPitch(null);
      setPitchForm({ name: '', type: 'F5', price: 0, active: true, image_url: '' });
      toast.success(editingPitch ? 'Cancha actualizada' : 'Cancha creada');
    } catch (error) {
      toast.error('Error al guardar la cancha');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: productForm.name,
          price: productForm.price,
          category: productForm.category,
          min_stock: productForm.min_stock
        });
      } else {
        await api.addProduct({
          name: productForm.name,
          price: productForm.price,
          category: productForm.category,
          stock: productForm.stock,
          min_stock: productForm.min_stock,
          active: true
        });
      }
      refreshData();
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm(defaultProductForm);
      toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
    } catch (error) {
      toast.error('Error al guardar el producto');
    }
  };

  const handleDeletePitch = async (id: string) => {
    setConfirmDelete({ type: 'pitch', id });
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmDelete({ type: 'product', id });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    
    if (confirmDelete.type === 'pitch') {
      await api.deletePitch(confirmDelete.id);
      toast.success('Cancha eliminada');
    } else {
      await api.deleteProduct(confirmDelete.id);
      toast.success('Producto eliminado');
    }
    
    refreshData();
    setConfirmDelete(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('golazo_custom_logo', base64String);
        setCustomLogo(base64String);
        window.dispatchEvent(new Event('storage'));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    localStorage.removeItem('golazo_custom_logo');
    setCustomLogo(null);
    window.dispatchEvent(new Event('storage'));
  };

  const handleStockUpdate = async () => {
    if (!stockUpdateProduct || stockUpdateQuantity === 0) return;
    
    try {
      const newStock = stockUpdateProduct.stock + stockUpdateQuantity;
      if (newStock < 0) {
        toast.error('El stock no puede ser negativo');
        return;
      }
      
      await api.bulkUpdateStock([{
        productId: stockUpdateProduct.id,
        quantityToAdd: stockUpdateQuantity,
        newStock: newStock
      }]);
      
      toast.success('Stock actualizado correctamente');
      setIsStockModalOpen(false);
      setStockUpdateProduct(null);
      setStockUpdateQuantity(0);
      refreshData();
    } catch (error) {
      toast.error('Error al actualizar el stock');
    }
  };

  const handleBulkStockUpdate = async () => {
    const updates = Object.entries(bulkStockUpdates)
      .filter(([_, qty]) => (qty as number) !== 0)
      .map(([productId, qty]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          quantityToAdd: qty as number,
          newStock: (product?.stock || 0) + (qty as number)
        };
      });

    if (updates.length === 0) {
      toast.info('No hay modificaciones para guardar');
      setIsBulkStockPreviewOpen(false);
      return;
    }

    try {
      await api.bulkUpdateStock(updates);
      toast.success('Stock actualizado correctamente');
      setIsBulkStockPreviewOpen(false);
      setIsBulkStockModalOpen(false);
      setBulkStockUpdates({});
      refreshData();
    } catch (error) {
      toast.error('Error al actualizar el stock');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'canchas', label: 'Canchas', icon: LayoutGrid },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'sistema', label: 'Sistema', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section - Premium SaaS Style */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-xl shadow-zinc-900/20">
                <Settings className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Configuración</h1>
                <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Panel de Control Maestro</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest",
              supabaseStatus === 'connected' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
              supabaseStatus === 'checking' ? "bg-zinc-50 text-zinc-400 border border-zinc-100" :
              "bg-amber-50 text-amber-600 border border-amber-100"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full", 
                supabaseStatus === 'connected' ? "bg-emerald-500 animate-pulse" : 
                supabaseStatus === 'checking' ? "bg-zinc-300 animate-pulse" :
                "bg-amber-500"
              )} />
              {supabaseStatus === 'connected' ? 'Supabase Conectado' : 
               supabaseStatus === 'checking' ? 'Verificando Supabase...' :
               'Modo Local (Sin Supabase)'}
            </div>
            <Button 
              variant="danger" 
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="h-12 px-6 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Navigation Tabs - Modern Pill Style */}
        <div className="mt-10 flex flex-wrap gap-2 p-1.5 bg-zinc-50 rounded-[24px] border border-zinc-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-black text-[11px] transition-all whitespace-nowrap uppercase tracking-widest flex-1 sm:flex-none justify-center",
                activeTab === tab.id 
                  ? "bg-white text-sky-600 shadow-lg shadow-zinc-200/50 ring-1 ring-zinc-200" 
                  : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-sky-500" : "text-zinc-400")} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 space-y-8">
                    {/* Visual Identity Card */}
                    <Card className="border-none shadow-xl shadow-zinc-200/30 rounded-[40px] overflow-hidden bg-white border border-zinc-100">
                      <CardHeader className="p-10 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3 tracking-tight uppercase">
                              <ImageIcon className="w-6 h-6 text-sky-500" />
                              Identidad Visual
                            </h3>
                            <p className="text-zinc-500 text-xs font-medium">Personaliza la apariencia de tu marca</p>
                          </div>
                          <Badge variant="neutral" className="bg-zinc-100 text-zinc-500 border-none px-3 py-1 text-[9px] font-black tracking-widest">BRANDING</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-10 pt-6">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                          <div className="relative group shrink-0">
                            <div className={cn(
                              "w-48 h-48 rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-zinc-50 relative shadow-inner",
                              customLogo ? "border-transparent" : "border-zinc-200 hover:border-sky-500/50 hover:bg-sky-50"
                            )}>
                              {customLogo ? (
                                <>
                                  <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-6" />
                                  <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                                    <label className="cursor-pointer">
                                      <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5 text-sky-600" />
                                      </div>
                                    </label>
                                    <button 
                                      onClick={removeLogo}
                                      className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                                    >
                                      <Trash2 className="w-5 h-5 text-red-500" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-4 text-zinc-400 group-hover:text-sky-500 transition-all">
                                  <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-zinc-100 group-hover:shadow-lg group-hover:scale-110 transition-all">
                                    <Upload className="w-8 h-8" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Subir Logo</p>
                                </label>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 space-y-6 text-center md:text-left">
                            <div className="space-y-2">
                              <h4 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Logo del Complejo</h4>
                              <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                Este logo es el corazón de tu identidad visual. Aparecerá en el panel lateral, comprobantes de reserva y en tu página pública de reservas.
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Recomendado</p>
                                <p className="text-xs font-bold text-zinc-700">PNG/JPG Cuadrado</p>
                              </div>
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Tamaño Máx</p>
                                <p className="text-xs font-bold text-zinc-700">2MB por archivo</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                              <Button 
                                variant="primary" 
                                className="rounded-2xl h-14 px-8 text-xs font-black shadow-xl shadow-sky-500/20 uppercase tracking-widest"
                                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                              >
                                {customLogo ? 'CAMBIAR IMAGEN' : 'SUBIR ARCHIVO'}
                              </Button>
                              {customLogo && (
                                <Button 
                                  variant="outline" 
                                  className="rounded-2xl h-14 px-8 border-zinc-200 text-zinc-500 text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                  onClick={removeLogo}
                                >
                                  ELIMINAR
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Stats / Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-8 bg-white rounded-[40px] border border-zinc-100 shadow-xl shadow-zinc-200/20 flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center shrink-0">
                          <LayoutGrid className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Canchas</p>
                          <h4 className="text-2xl font-black text-zinc-900">{pitches.length} Activas</h4>
                        </div>
                      </div>
                      <div className="p-8 bg-white rounded-[40px] border border-zinc-100 shadow-xl shadow-zinc-200/20 flex items-center gap-6">
                        <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center shrink-0">
                          <Package className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Productos</p>
                          <h4 className="text-2xl font-black text-zinc-900">{products.length} Items</h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Status Card */}
                    <Card className="border-none shadow-2xl shadow-sky-600/20 rounded-[40px] overflow-hidden bg-zinc-900 text-white h-full">
                      <CardContent className="p-10 flex flex-col h-full justify-between gap-12">
                        <div className="space-y-6">
                          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                            <Activity className="w-8 h-8 text-sky-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight uppercase">Estado del Sistema</h3>
                            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                              Tu complejo está operando al 100%. Todos los servicios están activos y sincronizados.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-sky-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em]">
                              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                              Online y Operativo
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500">v2.4.0</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'canchas' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-2 bg-white rounded-[24px] border border-zinc-100 shadow-sm">
                    <div className="space-y-0.5">
                      <h2 className="text-lg font-black text-zinc-900 tracking-tight uppercase">Gestión de Canchas</h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Espacios de juego disponibles</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={isDeleteMode ? 'danger' : 'outline'} 
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className="gap-2 px-4 py-2.5 rounded-xl border-zinc-200 text-[9px] font-black uppercase tracking-widest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleteMode ? 'CANCELAR' : 'MODO BORRAR'}
                      </Button>
                      <Button onClick={() => setIsPitchModalOpen(true)} className="gap-2 px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 text-[9px] font-black uppercase tracking-widest">
                        <Plus className="w-3.5 h-3.5" />
                        NUEVA CANCHA
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pitches.map((pitch) => (
                      <motion.div key={pitch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-none shadow-sm hover:shadow-xl transition-all group bg-white rounded-[28px] overflow-hidden border border-transparent hover:border-sky-100">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-6">
                              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-all font-black text-lg border border-zinc-100 shadow-sm">
                                {pitch.type}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="w-8 h-8 rounded-lg hover:bg-sky-50 hover:text-sky-600"
                                  onClick={() => {
                                    setEditingPitch(pitch);
                                    setPitchForm({
                                      name: pitch.name,
                                      type: pitch.type,
                                      price: pitch.price,
                                      active: pitch.active,
                                      image_url: pitch.image_url || '',
                                    });
                                    setIsPitchModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className={cn(
                                    "w-8 h-8 rounded-lg transition-all",
                                    isDeleteMode ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" : "text-red-300 hover:text-red-600 hover:bg-red-50"
                                  )}
                                  onClick={() => handleDeletePitch(pitch.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-black text-base text-zinc-900 group-hover:text-sky-600 transition-colors uppercase tracking-tight">{pitch.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={pitch.active ? 'success' : 'neutral'} className="text-[8px] px-2 py-0.5 font-black tracking-widest uppercase">
                                    {pitch.active ? 'ACTIVA' : 'INACTIVA'}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span className="text-sm font-black text-zinc-900">${pitch.price}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-tighter">/ hora</span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                  ID: {pitch.id.slice(0, 4)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'productos' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-2 bg-white rounded-[24px] border border-zinc-100 shadow-sm">
                    <div className="space-y-0.5">
                      <h2 className="text-lg font-black text-zinc-900 tracking-tight uppercase">Gestión de Productos</h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Inventario de buffet y tienda</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={isDeleteMode ? 'danger' : 'outline'} 
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className="gap-2 px-4 py-2.5 rounded-xl border-zinc-200 text-[9px] font-black uppercase tracking-widest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleteMode ? 'CANCELAR' : 'MODO BORRAR'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setIsBulkStockModalOpen(true)} 
                        className="gap-2 px-4 py-2.5 rounded-xl border-zinc-200 text-[9px] font-black uppercase tracking-widest"
                      >
                        <Package className="w-3.5 h-3.5" />
                        CARGA RÁPIDA DE STOCK
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm(defaultProductForm);
                          setIsProductModalOpen(true);
                        }}
                        className="gap-2 px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 text-[9px] font-black uppercase tracking-widest"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        NUEVO PRODUCTO
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-none shadow-sm hover:shadow-xl transition-all group bg-white rounded-[28px] overflow-hidden border border-transparent hover:border-sky-100 flex flex-col h-full">
                          <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-all border border-zinc-100 shadow-sm">
                                <Package className="w-5 h-5" />
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="w-7 h-7 rounded-lg hover:bg-sky-50 hover:text-sky-600"
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setProductForm({
                                      name: product.name,
                                      price: product.price,
                                      category: product.category,
                                      stock: product.stock,
                                      min_stock: product.min_stock ?? 5,
                                    });
                                    setIsProductModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className={cn(
                                    "w-7 h-7 rounded-lg transition-all",
                                    isDeleteMode ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" : "text-red-300 hover:text-red-600 hover:bg-red-50"
                                  )}
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-3 flex-1 flex flex-col">
                              <div>
                                <h4 className="font-black text-sm text-zinc-900 group-hover:text-sky-600 transition-colors truncate uppercase tracking-tight">{product.name}</h4>
                                <Badge variant="neutral" className="text-[7px] px-2 py-0.5 font-black tracking-widest mt-1 uppercase">
                                  {product.category}
                                </Badge>
                              </div>
                              
                              <div className="mt-auto pt-4 space-y-3">
                                <div className="flex items-center justify-between bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Stock Actual</span>
                                    <span className={cn(
                                      "text-lg font-black leading-none mt-0.5",
                                      product.stock <= 0 ? "text-red-500" : 
                                      product.stock <= (product.min_stock ?? 5) ? "text-amber-500" : "text-emerald-500"
                                    )}>
                                      {product.stock}
                                    </span>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setStockUpdateProduct(product);
                                      setStockUpdateQuantity(0);
                                      setIsStockModalOpen(true);
                                    }}
                                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border-zinc-200"
                                  >
                                    Ajustar
                                  </Button>
                                </div>

                                <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-black text-zinc-900">${product.price}</span>
                                  </div>
                                  <div className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter">
                                    #{product.id.slice(0, 4)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'sistema' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Configuración del Sistema</h2>
                      <p className="text-zinc-500 font-medium text-xs">Mantenimiento, seguridad y registros de actividad</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white group hover:shadow-xl transition-all">
                      <CardHeader className="p-8 pb-4">
                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <History className="w-7 h-7 text-zinc-900" />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Logs de Auditoría</h3>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-6">
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                          Rastrea todas las acciones administrativas para mantener la seguridad y transparencia del sistema.
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full py-6 border-zinc-200 text-zinc-900 hover:bg-zinc-50 gap-3 rounded-2xl font-black text-xs uppercase tracking-widest"
                          onClick={async () => {
                            const currentUser = await dataService.getCurrentUser();
                            const logs = await dataService.getAuditLogs(currentUser?.client_id);
                            setAuditLogs(logs);
                            setIsAuditModalOpen(true);
                          }}
                        >
                          <Search className="w-5 h-5" />
                          EXPLORAR REGISTROS
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-zinc-900 text-white group hover:shadow-xl transition-all">
                      <CardHeader className="p-8 pb-4">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-7 h-7 text-sky-400" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Seguridad de Cuenta</h3>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-6">
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                          Gestiona los accesos y la sesión actual. Recomendamos cerrar sesión al finalizar tus tareas administrativas.
                        </p>
                        <Button 
                          variant="danger" 
                          className="w-full py-6 shadow-xl shadow-red-500/20 gap-3 rounded-2xl font-black text-xs uppercase tracking-widest"
                          onClick={() => setIsLogoutConfirmOpen(true)}
                        >
                          <LogOut className="w-5 h-5" />
                          CERRAR SESIÓN AHORA
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Audit Logs Modal */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Logs de Auditoría"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 mb-4">
            El registro de auditoría rastrea todas las acciones importantes realizadas por los administradores para mantener la seguridad y el control del complejo.
          </p>
          <div className="space-y-3 pr-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="neutral" className="text-[10px] font-black uppercase tracking-widest">
                    {log.action}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {format(log.timestamp, "d MMM, HH:mm", { locale: es })}
                  </div>
                </div>
                <p className="text-sm font-bold text-zinc-900">{log.details}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <UserIcon className="w-3 h-3" />
                  Realizado por: {log.user}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="py-12 text-center">
                <History className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                <p className="text-zinc-400 font-bold">No hay registros de actividad aún</p>
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full py-4 rounded-2xl" onClick={() => setIsAuditModalOpen(false)}>
            CERRAR
          </Button>
        </div>
      </Modal>

      {/* Pitch Modal */}
      <Modal
        isOpen={isPitchModalOpen}
        onClose={() => {
          setIsPitchModalOpen(false);
          setEditingPitch(null);
        }}
        title={editingPitch ? 'Editar Cancha' : 'Nueva Cancha'}
      >
        <form onSubmit={handleSavePitch} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" />
                Nombre de la cancha
              </label>
              <input
                required
                type="text"
                placeholder="Ej: Cancha Principal"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-bold"
                value={pitchForm.name}
                onChange={e => setPitchForm({ ...pitchForm, name: e.target.value })}
              />
            </div>
 
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Tipo
                </label>
                <select
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold text-zinc-900"
                  value={pitchForm.type}
                  onChange={e => setPitchForm({ ...pitchForm, type: e.target.value as Pitch['type'] })}
                >
                  <option value="F5">Fútbol 5</option>
                  <option value="F7">Fútbol 7</option>
                  <option value="F11">Fútbol 11</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  Precio
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    required
                    type="number"
                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-bold"
                    value={pitchForm.price}
                    onChange={e => setPitchForm({ ...pitchForm, price: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
 
            <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <input
                type="checkbox"
                id="active"
                className="w-6 h-6 rounded-lg border-zinc-300 text-sky-600 focus:ring-sky-500"
                checked={pitchForm.active}
                onChange={e => setPitchForm({ ...pitchForm, active: e.target.checked })}
              />
              <label htmlFor="active" className="text-sm font-bold text-zinc-700 cursor-pointer">Cancha activa para reservas</label>
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-sky-500/20">
            {editingPitch ? 'ACTUALIZAR CANCHA' : 'CREAR CANCHA'}
          </Button>
        </form>
      </Modal>

      {/* Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
          setProductForm(defaultProductForm);
        }}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Package className="w-3 h-3" />
                Nombre del Producto
              </label>
              <input
                required
                type="text"
                placeholder="Ej: Gatorade 500ml"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-bold"
                value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
 
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <List className="w-3 h-3" />
                  Categoría
                </label>
                <select
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold text-zinc-900"
                  value={productForm.category}
                  onChange={e => setProductForm({ ...productForm, category: e.target.value as Product['category'] })}
                >
                  <option value="bebida">Bebida</option>
                  <option value="comida">Comida</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  Precio
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    required
                    type="number"
                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-bold"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {!editingProduct && (
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  Stock Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-bold"
                  value={productForm.stock}
                  onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Stock Mínimo (Opcional)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-bold"
                value={productForm.min_stock}
                onChange={e => setProductForm({ ...productForm, min_stock: Number(e.target.value) })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-sky-500/20">
            {editingProduct ? 'ACTUALIZAR PRODUCTO' : 'CREAR PRODUCTO'}
          </Button>
        </form>
      </Modal>

      {/* Individual Stock Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockUpdateProduct(null);
          setStockUpdateQuantity(0);
        }}
        title="Ajustar Stock"
      >
        {stockUpdateProduct && (
          <div className="space-y-6">
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
              <div>
                <h4 className="font-black text-zinc-900 uppercase tracking-tight">{stockUpdateProduct.name}</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Stock Actual</p>
              </div>
              <span className="text-2xl font-black text-zinc-900">{stockUpdateProduct.stock}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Package className="w-3 h-3" />
                Cantidad a agregar / quitar
              </label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStockUpdateQuantity(prev => prev - 1)}
                  className="w-12 h-12 rounded-2xl border-zinc-200 text-xl font-black"
                >
                  -
                </Button>
                <input
                  type="number"
                  className="flex-1 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-black text-center text-xl"
                  value={stockUpdateQuantity}
                  onChange={e => setStockUpdateQuantity(Number(e.target.value))}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setStockUpdateQuantity(prev => prev + 1)}
                  className="w-12 h-12 rounded-2xl border-zinc-200 text-xl font-black"
                >
                  +
                </Button>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold text-center mt-2">
                Usa números negativos para restar stock
              </p>
            </div>

            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 flex items-center justify-between">
              <span className="text-xs font-black text-sky-600 uppercase tracking-widest">Stock Final Esperado</span>
              <span className="text-xl font-black text-sky-700">
                {stockUpdateProduct.stock + stockUpdateQuantity}
              </span>
            </div>

            <Button 
              onClick={handleStockUpdate} 
              disabled={stockUpdateQuantity === 0 || (stockUpdateProduct.stock + stockUpdateQuantity < 0)}
              className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-sky-500/20"
            >
              CONFIRMAR AJUSTE
            </Button>
          </div>
        )}
      </Modal>

      {/* Bulk Stock Modal */}
      <Modal
        isOpen={isBulkStockModalOpen}
        onClose={() => {
          setIsBulkStockModalOpen(false);
          setBulkStockUpdates({});
        }}
        title="Carga Rápida de Stock"
      >
        <div className="space-y-6">
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {products.map(product => (
              <div key={product.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex-1">
                  <h4 className="font-black text-sm text-zinc-900 uppercase tracking-tight truncate pr-4">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actual:</span>
                    <Badge variant={product.stock <= 0 ? 'danger' : product.stock <= (product.min_stock ?? 5) ? 'warning' : 'success'} className="text-[9px] px-1.5 py-0">
                      {product.stock}
                    </Badge>
                  </div>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="+0"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 font-black text-center"
                    value={bulkStockUpdates[product.id] || ''}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setBulkStockUpdates(prev => ({
                        ...prev,
                        [product.id]: val
                      }));
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => setIsBulkStockPreviewOpen(true)}
            disabled={Object.values(bulkStockUpdates).every(v => v === 0)}
            className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-sky-500/20"
          >
            REVISAR CAMBIOS
          </Button>
        </div>
      </Modal>

      {/* Bulk Stock Preview Modal */}
      <Modal
        isOpen={isBulkStockPreviewOpen}
        onClose={() => setIsBulkStockPreviewOpen(false)}
        title="Confirmar Cambios"
      >
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-800">
              Por favor, revisa los cambios antes de confirmar. Esta acción actualizará el inventario.
            </p>
          </div>

          {Object.entries(bulkStockUpdates).some(([id, qty]) => {
            const product = products.find(p => p.id === id);
            return product && (product.stock + (qty as number) < 0);
          }) && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-800">
                Hay productos con stock final negativo. Por favor, corrige las cantidades.
              </p>
            </div>
          )}

          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {Object.entries(bulkStockUpdates)
              .filter(([_, qty]) => (qty as number) !== 0)
              .map(([productId, qty]) => {
                const numQty = qty as number;
                const product = products.find(p => p.id === productId);
                if (!product) return null;
                const finalStock = product.stock + numQty;
                
                return (
                  <div key={productId} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-100">
                    <div className="flex-1 truncate pr-4">
                      <span className="font-black text-xs text-zinc-900 uppercase">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-zinc-500 w-8 text-right">{product.stock}</span>
                      <span className={cn("w-12 text-center", numQty > 0 ? "text-emerald-500" : "text-red-500")}>
                        {numQty > 0 ? `+${numQty}` : numQty}
                      </span>
                      <span className="text-zinc-900 w-8 text-right font-black">={finalStock}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsBulkStockPreviewOpen(false)}
              className="flex-1 py-4 font-black tracking-tight"
            >
              VOLVER A EDITAR
            </Button>
            <Button 
              onClick={handleBulkStockUpdate}
              disabled={Object.entries(bulkStockUpdates).some(([id, qty]) => {
                const product = products.find(p => p.id === id);
                return product && (product.stock + qty < 0);
              })}
              className="flex-1 py-4 font-black tracking-tight shadow-xl shadow-sky-500/20"
            >
              CONFIRMAR
            </Button>
          </div>
        </div>
      </Modal>
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        title={confirmDelete?.type === 'pitch' ? 'Eliminar Cancha' : 'Eliminar Producto'}
        message={`¿Estás seguro de que deseas eliminar este ${confirmDelete?.type === 'pitch' ? 'cancha' : 'producto'} definitivamente? Esta acción no se puede deshacer.`}
        confirmText="ELIMINAR"
        cancelText="CANCELAR"
      />
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={onLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar la sesión de administrador?"
        confirmText="CERRAR SESIÓN"
        cancelText="CANCELAR"
      />
    </div>
  );
}
