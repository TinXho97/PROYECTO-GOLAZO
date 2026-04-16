import React, { useState, useEffect } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Trash2, 
  ChevronRight,
  Beer,
  Utensils,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { toast } from 'sonner';
import { dataService, api } from '../services/dataService';
import { Product, Sale } from '../types';
import { cn } from '../lib/utils';

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteSale, setConfirmDeleteSale] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    dataService.getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const clientId = user?.client_id;
      const p = await dataService.getProducts(clientId);
      const s = await dataService.getSales(clientId);
      setProducts(p);
      setSales(s);
    };
    fetchData();
  }, [user?.client_id]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const clientId = user?.client_id;
      await api.addSale(selectedProduct.id, quantity, paymentMethod);
      const updatedSales = await dataService.getSales(clientId);
      const updatedProducts = await dataService.getProducts(clientId);
      setSales(updatedSales);
      setProducts(updatedProducts);
      setIsSaleModalOpen(false);
      setQuantity(1);
      setPaymentMethod('efectivo');
      setSuccessMessage(`¡Venta de ${selectedProduct.name} registrada!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSale = async (id: string) => {
    setConfirmDeleteSale(id);
  };

  const executeDeleteSale = async () => {
    if (!confirmDeleteSale) return;
    const clientId = user?.client_id;
    await api.deleteSale(confirmDeleteSale);
    const updatedSales = await dataService.getSales(clientId);
    const updatedProducts = await dataService.getProducts(clientId);
    setSales(updatedSales);
    setProducts(updatedProducts);
    setConfirmDeleteSale(null);
  };

  const todaySales = sales.filter(s => isSameDay(s.date, new Date()));
  const todayIncome = todaySales.reduce((acc, s) => acc + s.totalPrice, 0);
  
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthSales = sales.filter(s => s.date >= monthStart && s.date <= monthEnd);
  const monthIncome = monthSales.reduce((acc, s) => acc + s.totalPrice, 0);

  const getCategoryIcon = (category: Product['category']) => {
    switch (category) {
      case 'bebida': return Beer;
      case 'comida': return Utensils;
      default: return Coffee;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tighter">Ventas & Bar</h1>
          <p className="text-zinc-500 font-medium text-sm sm:text-base">Gestión de productos y consumos</p>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-zinc-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Ventas Hoy', value: todaySales.length, icon: ShoppingBag, color: 'bg-blue-500', show: true },
          { label: 'Ingresos Hoy', value: `$${todayIncome}`, icon: DollarSign, color: 'bg-sky-500', show: isAdmin },
          { label: 'Ingresos Mes', value: `$${monthIncome}`, icon: TrendingUp, color: 'bg-purple-500', show: isAdmin },
        ].filter(s => s.show).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
          <Card className="border-none shadow-sm overflow-hidden group bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </section>

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 bg-sky-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 className="w-6 h-6" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-500" />
            Productos Disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const Icon = getCategoryIcon(product.category);
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.min_stock;

              return (
                <motion.div key={product.id} whileHover={!isOutOfStock ? { scale: 1.02 } : {}} whileTap={!isOutOfStock ? { scale: 0.98 } : {}}>
                  <Card 
                    className={cn(
                      "border-none shadow-sm transition-all bg-white relative overflow-hidden",
                      isOutOfStock ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl cursor-pointer group",
                      isLowStock ? "ring-2 ring-yellow-400" : ""
                    )}
                    onClick={() => {
                      if (isOutOfStock) return;
                      setSelectedProduct(product);
                      setQuantity(1);
                      setIsSaleModalOpen(true);
                    }}
                  >
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-red-500/10 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <Badge variant="danger" className="font-black tracking-widest uppercase">Sin Stock</Badge>
                      </div>
                    )}
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-black text-zinc-900 group-hover:text-sky-600 transition-colors">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-lg font-black text-zinc-400">${product.price}</p>
                            <Badge variant={isLowStock ? "warning" : "neutral"} className={cn("text-[10px] font-bold uppercase", isLowStock ? "bg-yellow-100 text-yellow-700" : "")}>
                              Stock: {product.stock}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isOutOfStock ? "bg-zinc-100 text-zinc-300" : "bg-zinc-50 text-zinc-300 group-hover:bg-sky-500 group-hover:text-white"
                      )}>
                        <Plus className="w-5 h-5" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-500" />
            Ventas Recientes
          </h2>
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-50">
                {sales.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">No hay ventas registradas</p>
                  </div>
                ) : (
                  sales.slice().reverse().slice(0, 10).map((sale) => {
                    const product = products.find(p => p.id === sale.productId);
                    return (
                      <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500">
                            <span className="text-xs font-black">{sale.quantity}x</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-900">{product?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {format(sale.date, 'HH:mm')} hs
                              </p>
                              {sale.paymentMethod && (
                                <Badge variant="neutral" className="text-[8px] px-1.5 py-0 uppercase">
                                  {sale.paymentMethod}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-sky-600">${sale.totalPrice}</p>
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSale(sale.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sale Modal */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Registrar Venta"
      >
        <form onSubmit={handleSale} className="space-y-6">
          <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              {selectedProduct && React.createElement(getCategoryIcon(selectedProduct.category), { className: "w-8 h-8 text-sky-500" })}
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900">{selectedProduct?.name}</h3>
              <p className="text-xl font-black text-sky-600">${selectedProduct?.price}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Cantidad</label>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-14 h-14 rounded-2xl text-2xl font-black"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <div className="flex-1 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-2xl font-black text-zinc-900 border border-zinc-200 overflow-hidden">
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct?.stock || 1}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        setQuantity(Math.min(selectedProduct?.stock || 1, Math.max(1, val)));
                      }
                    }}
                    className="w-full h-full text-center bg-transparent outline-none"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-14 h-14 rounded-2xl text-2xl font-black"
                  onClick={() => setQuantity(Math.min(selectedProduct?.stock || 1, quantity + 1))}
                  disabled={quantity >= (selectedProduct?.stock || 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-zinc-500 font-medium text-right mt-1">
                Stock disponible: {selectedProduct?.stock}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-700 ml-1">Método de Pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('efectivo')}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-2",
                    paymentMethod === 'efectivo' 
                      ? "border-sky-500 bg-sky-50 text-sky-700" 
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                  )}
                >
                  <DollarSign className="w-5 h-5" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-2",
                    paymentMethod === 'transferencia' 
                      ? "border-sky-500 bg-sky-50 text-sky-700" 
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                  )}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Transferencia
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500 font-bold">Total a cobrar:</span>
              <span className="text-3xl font-black text-sky-600">
                ${(selectedProduct?.price || 0) * quantity}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-sky-500/20">
            REGISTRAR VENTA
          </Button>
        </form>
      </Modal>
      {/* Confirm Delete Sale Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteSale}
        onClose={() => setConfirmDeleteSale(null)}
        onConfirm={executeDeleteSale}
        title="Eliminar Venta"
        message="¿Estás seguro de que deseas eliminar este registro de venta? Esta acción no se puede deshacer."
        confirmText="ELIMINAR"
        cancelText="CANCELAR"
      />
    </div>
  );
}
