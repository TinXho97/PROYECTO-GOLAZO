import React, { useState, useEffect } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import {
  ShoppingBag,
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  Package,
  Trash2,
  Beer,
  Utensils,
  Coffee,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { toast } from 'sonner';
import { dataService, api } from '../services/dataService';
import { Product, Sale } from '../types';
import { cn } from '../lib/utils';
import { getEffectiveClientId } from '../lib/tenant';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import { AdminMetricCard } from '../components/admin/AdminMetricCard';
import { AdminSectionCard } from '../components/admin/AdminSectionCard';
import { AdminEmptyState } from '../components/admin/AdminEmptyState';
import { AdminActionButton } from '../components/admin/AdminActionButton';
import { AdminToolbar } from '../components/admin/AdminToolbar';
import { AdminStatusBadge } from '../components/admin/AdminStatusBadge';

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
  const clientId = getEffectiveClientId(user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    dataService.getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const p = await dataService.getProducts(clientId);
      const s = await dataService.getSales(clientId);
      setProducts(p);
      setSales(s);
    };
    fetchData();
  }, [clientId, user]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.addSale(selectedProduct.id, quantity, paymentMethod, clientId || undefined);
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
    await api.deleteSale(confirmDeleteSale, clientId || undefined);
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
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-20">
      <AdminPageHeader
        title="Ventas & Bar"
        meta="Operación comercial"
        icon={<ShoppingBag className="h-6 w-6" />}
        subtitle="Gestioná productos, consumos y ventas recientes desde una vista rápida."
        actions={
          <AdminToolbar className="w-full min-w-0 sm:w-[360px]">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-[#081A33] outline-none transition-all placeholder:text-slate-400 focus:border-sky-200 focus:ring-2 focus:ring-[#0EA5E9]/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </AdminToolbar>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Ventas hoy', value: todaySales.length, icon: ShoppingBag, tone: 'blue' as const, helperText: 'Operaciones del día', show: true },
          { label: 'Ingresos hoy', value: `$${todayIncome}`, icon: DollarSign, tone: 'green' as const, helperText: 'Total cobrado hoy', show: isAdmin },
          { label: 'Ingresos mes', value: `$${monthIncome}`, icon: TrendingUp, tone: 'gold' as const, helperText: 'Acumulado mensual', show: isAdmin },
        ].filter(s => s.show).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <AdminMetricCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone}
              helperText={stat.helperText}
              className="h-full"
            />
          </motion.div>
        ))}
      </section>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border border-sky-200 bg-[#0EA5E9] px-6 py-4 font-bold text-white shadow-[0_18px_40px_rgba(14,165,233,0.28)]"
          >
            <CheckCircle2 className="h-6 w-6" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminSectionCard
            title="Productos disponibles"
            eyebrow={`${filteredProducts.length} visibles`}
            icon={<Package className="h-5 w-5" />}
          >
            {filteredProducts.length === 0 ? (
              <AdminEmptyState
                icon={<Package className="h-5 w-5" />}
                title="No hay productos para mostrar"
                description="Probá con otra búsqueda o cargá productos desde Configuración."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredProducts.map((product) => {
                  const Icon = getCategoryIcon(product.category);
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.min_stock;

                  return (
                    <motion.button
                      key={product.id}
                      type="button"
                      whileHover={!isOutOfStock ? { y: -3 } : {}}
                      whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                      disabled={isOutOfStock}
                      onClick={() => {
                        if (isOutOfStock) return;
                        setSelectedProduct(product);
                        setQuantity(1);
                        setIsSaleModalOpen(true);
                      }}
                      className={cn(
                        'group relative flex w-full items-center justify-between overflow-hidden rounded-[22px] border bg-white p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30 sm:p-5',
                        isOutOfStock
                          ? 'cursor-not-allowed border-red-100 bg-red-50/40 opacity-70'
                          : 'border-slate-200/80 hover:border-sky-200 hover:shadow-[0_16px_36px_rgba(8,26,51,0.08)]',
                        isLowStock && 'border-amber-200 bg-amber-50/30'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={cn(
                            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                            isOutOfStock
                              ? 'border-red-100 bg-white text-[#EF4444]'
                              : 'border-slate-100 bg-[#F6F8FB] text-[#64748B] group-hover:bg-[#DDF3FF] group-hover:text-[#0EA5E9]'
                          )}
                        >
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate font-extrabold text-[#0F2747] transition-colors group-hover:text-[#0EA5E9]">
                            {product.name}
                          </h4>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-lg font-extrabold text-[#081A33]">${product.price}</span>
                            <AdminStatusBadge tone={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'neutral'}>
                              Stock: {product.stock}
                            </AdminStatusBadge>
                          </div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all',
                          isOutOfStock
                            ? 'bg-red-50 text-[#EF4444]'
                            : 'bg-[#DDF3FF] text-[#0EA5E9] group-hover:bg-[#0EA5E9] group-hover:text-white'
                        )}
                      >
                        <Plus className="h-5 w-5" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </AdminSectionCard>
        </div>

        <AdminSectionCard
          title="Ventas recientes"
          eyebrow="Últimos movimientos"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <div className="divide-y divide-slate-100 overflow-hidden rounded-[20px] border border-slate-100 bg-white">
            {sales.length === 0 ? (
              <div className="p-4">
                <AdminEmptyState
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title="No hay ventas registradas"
                  description="Cuando registres consumos van a aparecer acá."
                />
              </div>
            ) : (
              sales.slice().reverse().slice(0, 10).map((sale) => {
                const product = products.find(p => p.id === sale.productId);
                const saleQuantity = sale.quantity ?? sale.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;
                return (
                  <div key={sale.id} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-[#F6F8FB]">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#64748B]">
                        <span className="text-xs font-extrabold">{saleQuantity}x</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#0F2747]">{product?.name || 'Producto'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold text-[#64748B]">{format(sale.date, 'HH:mm')} hs</p>
                          {sale.paymentMethod && (
                            <AdminStatusBadge tone="neutral" className="px-2 py-0.5 text-[10px]">
                              {sale.paymentMethod}
                            </AdminStatusBadge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="font-extrabold text-[#10B981]">${sale.totalPrice}</p>
                      {isAdmin && (
                        <AdminActionButton
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-[#EF4444] hover:bg-red-50 hover:text-red-600"
                          aria-label="Eliminar venta"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSale(sale.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </AdminActionButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </AdminSectionCard>
      </div>

      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Registrar venta"
      >
        <form onSubmit={handleSale} className="space-y-6">
          <div className="flex items-center gap-4 rounded-[22px] border border-slate-200 bg-[#F6F8FB] p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              {selectedProduct && React.createElement(getCategoryIcon(selectedProduct.category), { className: 'h-8 w-8 text-[#0EA5E9]' })}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-extrabold text-[#0F2747]">{selectedProduct?.name}</h3>
              <p className="text-xl font-extrabold text-[#0EA5E9]">${selectedProduct?.price}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-[#0F2747]">Cantidad</label>
              <div className="flex items-center gap-3">
                <AdminActionButton
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-14 w-14 text-2xl"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </AdminActionButton>
                <div className="flex h-14 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-[#F6F8FB] text-2xl font-extrabold text-[#081A33]">
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
                    className="h-full w-full bg-transparent text-center outline-none"
                  />
                </div>
                <AdminActionButton
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-14 w-14 text-2xl"
                  onClick={() => setQuantity(Math.min(selectedProduct?.stock || 1, quantity + 1))}
                  disabled={quantity >= (selectedProduct?.stock || 1)}
                >
                  +
                </AdminActionButton>
              </div>
              <p className="mt-1 text-right text-xs font-medium text-[#64748B]">
                Stock disponible: {selectedProduct?.stock}
              </p>
            </div>

            <div className="space-y-3">
              <label className="ml-1 text-sm font-bold text-[#0F2747]">Método de pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('efectivo')}
                  className={cn(
                    'flex h-14 items-center justify-center gap-2 rounded-2xl border font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30',
                    paymentMethod === 'efectivo'
                      ? 'border-sky-200 bg-[#DDF3FF] text-[#0F2747]'
                      : 'border-slate-200 bg-white text-[#64748B] hover:border-sky-200 hover:text-[#0EA5E9]'
                  )}
                >
                  <DollarSign className="h-5 w-5" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={cn(
                    'flex h-14 items-center justify-center gap-2 rounded-2xl border font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30',
                    paymentMethod === 'transferencia'
                      ? 'border-sky-200 bg-[#DDF3FF] text-[#0F2747]'
                      : 'border-slate-200 bg-white text-[#64748B] hover:border-sky-200 hover:text-[#0EA5E9]'
                  )}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                  Transferencia
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="font-bold text-[#64748B]">Total a cobrar:</span>
              <span className="text-2xl font-extrabold text-[#0EA5E9]">
                ${(selectedProduct?.price || 0) * quantity}
              </span>
            </div>
          </div>

          <AdminActionButton type="submit" size="lg" className="w-full">
            Registrar venta
          </AdminActionButton>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteSale}
        onClose={() => setConfirmDeleteSale(null)}
        onConfirm={executeDeleteSale}
        title="Eliminar venta"
        message="¿Estás seguro de que deseas eliminar este registro de venta? Esta acción no se puede deshacer."
        confirmText="ELIMINAR"
        cancelText="CANCELAR"
      />
    </div>
  );
}
