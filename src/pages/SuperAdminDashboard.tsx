import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../components/Card';

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Super Admin</h1>
            <p className="text-zinc-500 font-medium">Sesión global autenticada con Supabase</p>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-xl font-black tracking-tight mb-3">Panel centralizado</h2>
            <p className="text-zinc-400 leading-relaxed">
              El control operativo del SaaS se gestiona desde el panel interno. La sesión ya está
              validada con Supabase Auth y lista para administrar clientes y administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
