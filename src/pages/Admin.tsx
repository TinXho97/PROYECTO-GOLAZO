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
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { dataService, api } from '../services/dataService';
import { Pitch, Product, AuditLog } from '../types';
import { cn } from '../lib/utils';

export default function Admin() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ranking, setRanking] = useState<{ id: string, name: string, points: number }[]>([]);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  const [pitchForm, setPitchForm] = useState({
    name: '',
    type: 'F5' as Pitch['type'],
    price: 0,
    active: true,
  });

  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    category: 'bebida' as Product['category'],
  });

  useEffect(() => {
    setPitches(dataService.getPitches());
    setProducts(dataService.getProducts());
    setRanking(dataService.getRanking());
    setAuditLogs(dataService.getAuditLogs());
  }, []);

  const refreshData = () => {
    setPitches(dataService.getPitches());
    setProducts(dataService.getProducts());
    setAuditLogs(dataService.getAuditLogs());
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
      setPitchForm({ name: '', type: 'F5', price: 0, active: true });
    } catch (error) {
      alert('Error al guardar la cancha');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productForm);
      } else {
        await api.addProduct(productForm);
      }
      refreshData();
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, category: 'bebida' });
    } catch (error) {
      alert('Error al guardar el producto');
    }
  };

  const handleDeletePitch = async (id: string) => {
    if (window.confirm('¿Eliminar esta cancha definitivamente?')) {
      await api.deletePitch(id);
      refreshData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('¿Eliminar este producto definitivamente?')) {
      await api.deleteProduct(id);
      refreshData();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">Configuración</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Administra tu complejo deportivo</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={isDeleteMode ? 'danger' : 'outline'} 
            onClick={() => setIsDeleteMode(!isDeleteMode)}
            className="gap-2 px-6 py-4 rounded-2xl border-zinc-200 dark:border-zinc-800"
          >
            <Trash2 className="w-5 h-5" />
            {isDeleteMode ? 'CANCELAR BORRADO' : 'MODO BORRAR'}
          </Button>
          <Button onClick={() => setIsPitchModalOpen(true)} className="gap-2 px-6 py-4 rounded-2xl shadow-xl shadow-green-500/20">
            <Plus className="w-5 h-5" />
            Nueva Cancha
          </Button>
          <Button onClick={() => setIsProductModalOpen(true)} variant="outline" className="gap-2 px-6 py-4 rounded-2xl border-zinc-200 dark:border-zinc-800">
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Resumen</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400 font-bold text-sm">Total Canchas</span>
                </div>
                <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{pitches.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                    <Package className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400 font-bold text-sm">Productos</span>
                </div>
                <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{products.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                    <Activity className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-green-700 dark:text-green-400 font-bold text-sm">Canchas Activas</span>
                </div>
                <span className="text-xl font-black text-green-600 dark:text-green-400">
                  {pitches.filter(p => p.active).length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-none shadow-2xl rounded-3xl overflow-hidden text-white">
            <CardContent className="p-8 space-y-4">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/40">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Modo Administrador</h3>
                <p className="text-zinc-400 text-sm font-medium">Tienes acceso total para modificar precios, canchas y productos.</p>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 text-white hover:bg-zinc-800 gap-2"
                  onClick={() => {
                    setAuditLogs(dataService.getAuditLogs());
                    setIsAuditModalOpen(true);
                  }}
                >
                  <History className="w-4 h-4" />
                  Ver Logs de Auditoría
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Lists */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tournament Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Ranking Torneo Mensual
            </h2>
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {ranking.slice(0, 5).map((player, index) => (
                    <div key={player.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
                          index === 0 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          index === 1 ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" :
                          index === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                          "text-zinc-300 dark:text-zinc-700"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm">{player.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{player.id}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{player.points}</p>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Puntos</p>
                        </div>
                        {index < 2 && (
                          <Badge variant="success" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            PREMIO: TURNO GRATIS
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {ranking.length === 0 && (
                    <div className="p-8 text-center text-zinc-400 font-bold">
                      No hay datos de ranking aún
                    </div>
                  )}
                </div>
                {ranking.length > 0 && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                    <Button 
                      variant="outline" 
                      className="w-full py-3 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold text-sm"
                      onClick={() => {
                        if (window.confirm('¿Finalizar mes y otorgar premios a los 2 primeros?')) {
                          alert('Premios otorgados correctamente. Se ha enviado una notificación a los ganadores.');
                        }
                      }}
                    >
                      FINALIZAR MES & OTORGAR PREMIOS
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pitches Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
              <LayoutGrid className="w-6 h-6 text-green-500" />
              Gestión de Canchas
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pitches.map((pitch) => (
                <motion.div key={pitch.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-none shadow-sm hover:shadow-md transition-all group bg-white dark:bg-zinc-900">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:text-green-600 transition-colors font-black text-lg">
                          {pitch.type}
                        </div>
                        <div>
                          <h4 className="font-black text-zinc-900 dark:text-zinc-100 group-hover:text-green-600 transition-colors">{pitch.name}</h4>
                          <p className="text-sm font-bold text-zinc-400">${pitch.price} / hora</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pitch.active ? 'success' : 'neutral'}>
                          {pitch.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-10 h-10 rounded-xl"
                          onClick={() => {
                            setEditingPitch(pitch);
                            setPitchForm({
                              name: pitch.name,
                              type: pitch.type,
                              price: pitch.price,
                              active: pitch.active,
                            });
                            setIsPitchModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={cn(
                            "w-10 h-10 rounded-xl transition-all",
                            isDeleteMode ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" : "text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          )}
                          onClick={() => handleDeletePitch(pitch.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
              <Package className="w-6 h-6 text-green-500" />
              Gestión de Productos
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <motion.div key={product.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-none shadow-sm hover:shadow-md transition-all group bg-white dark:bg-zinc-900">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:text-green-600 transition-colors">
                          <Package className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-black text-zinc-900 dark:text-zinc-100 group-hover:text-green-600 transition-colors">{product.name}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-zinc-400">${product.price}</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">•</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{product.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-10 h-10 rounded-xl"
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm({
                              name: product.name,
                              price: product.price,
                              category: product.category,
                            });
                            setIsProductModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={cn(
                            "w-10 h-10 rounded-xl transition-all",
                            isDeleteMode ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20" : "text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          )}
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Modal */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Logs de Auditoría"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            El registro de auditoría rastrea todas las acciones importantes realizadas por los administradores para mantener la seguridad y el control del complejo.
          </p>
          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="neutral" className="text-[10px] font-black uppercase tracking-widest">
                    {log.action}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {format(log.timestamp, "d MMM, HH:mm", { locale: es })}
                  </div>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{log.details}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <UserIcon className="w-3 h-3" />
                  Realizado por: {log.user}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="py-12 text-center">
                <History className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-3" />
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
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Nombre de la cancha</label>
              <input
                required
                type="text"
                placeholder="Ej: Cancha Principal"
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
                value={pitchForm.name}
                onChange={e => setPitchForm({ ...pitchForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Tipo de Cancha</label>
                <select
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold dark:text-zinc-100"
                  value={pitchForm.type}
                  onChange={e => setPitchForm({ ...pitchForm, type: e.target.value as Pitch['type'] })}
                >
                  <option value="F5">Fútbol 5</option>
                  <option value="F7">Fútbol 7</option>
                  <option value="F11">Fútbol 11</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Precio por Hora</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    required
                    type="number"
                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
                    value={pitchForm.price}
                    onChange={e => setPitchForm({ ...pitchForm, price: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <input
                type="checkbox"
                id="active"
                className="w-6 h-6 rounded-lg border-zinc-300 dark:border-zinc-700 text-green-600 focus:ring-green-500"
                checked={pitchForm.active}
                onChange={e => setPitchForm({ ...pitchForm, active: e.target.checked })}
              />
              <label htmlFor="active" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">Cancha activa para reservas</label>
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-green-500/20">
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
        }}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Nombre del Producto</label>
              <input
                required
                type="text"
                placeholder="Ej: Gatorade 500ml"
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
                value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Categoría</label>
                <select
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold dark:text-zinc-100"
                  value={productForm.category}
                  onChange={e => setProductForm({ ...productForm, category: e.target.value as Product['category'] })}
                >
                  <option value="bebida">Bebida</option>
                  <option value="comida">Comida</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Precio de Venta</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    required
                    type="number"
                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-green-500/20">
            {editingProduct ? 'ACTUALIZAR PRODUCTO' : 'CREAR PRODUCTO'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
