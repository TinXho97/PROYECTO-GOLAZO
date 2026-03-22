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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const user = dataService.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setProducts(dataService.getProducts());
    setSales(dataService.getSales());
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.addSale(selectedProduct.id, quantity);
      setSales(dataService.getSales());
      setIsSaleModalOpen(false);
      setQuantity(1);
      setSuccessMessage(`¡Venta de ${selectedProduct.name} registrada!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert(error.message);
    }
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
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">Ventas & Bar</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Gestión de productos y consumos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
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
          { label: 'Ingresos Hoy', value: `$${todayIncome}`, icon: DollarSign, color: 'bg-green-500', show: isAdmin },
          { label: 'Ingresos Mes', value: `$${monthIncome}`, icon: TrendingUp, color: 'bg-purple-500', show: isAdmin },
        ].filter(s => s.show).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
          <Card className="border-none shadow-sm overflow-hidden group bg-white dark:bg-zinc-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stat.value}</p>
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
            className="fixed top-24 right-6 z-50 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 className="w-6 h-6" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-green-500" />
            Productos Disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const Icon = getCategoryIcon(product.category);
              return (
                <motion.div key={product.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card 
                    className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white dark:bg-zinc-900"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsSaleModalOpen(true);
                    }}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:text-green-500 transition-colors">
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-black text-zinc-900 dark:text-zinc-100 group-hover:text-green-600 transition-colors">{product.name}</h4>
                          <p className="text-lg font-black text-zinc-400 dark:text-zinc-500">${product.price}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 group-hover:bg-green-500 group-hover:text-white transition-all">
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
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Ventas Recientes
          </h2>
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {sales.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">No hay ventas registradas</p>
                  </div>
                ) : (
                  sales.slice().reverse().slice(0, 10).map((sale) => {
                    const product = products.find(p => p.id === sale.productId);
                    return (
                      <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                            <span className="text-xs font-black">{sale.quantity}x</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{product?.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              {format(sale.date, 'HH:mm')} hs
                            </p>
                          </div>
                        </div>
                        <p className="font-black text-green-600">${sale.totalPrice}</p>
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
          <div className="flex items-center gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
              {selectedProduct && React.createElement(getCategoryIcon(selectedProduct.category), { className: "w-8 h-8 text-green-500" })}
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{selectedProduct?.name}</h3>
              <p className="text-xl font-black text-green-600">${selectedProduct?.price}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Cantidad</label>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-14 h-14 rounded-2xl text-2xl font-black"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <div className="flex-1 h-14 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center text-2xl font-black text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  {quantity}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-14 h-14 rounded-2xl text-2xl font-black"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold">Total a cobrar:</span>
              <span className="text-3xl font-black text-green-600">
                ${(selectedProduct?.price || 0) * quantity}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-green-500/20">
            REGISTRAR VENTA
          </Button>
        </form>
      </Modal>
    </div>
  );
}
