import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { dataService } from '../services/dataService';
import type { Client, User } from '../types';

const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

const getClientSlug = (client: Client | undefined | null) => client?.slug?.trim() || '';

export const PublicComplexRouteBridge = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminClient, setAdminClient] = useState<Client | null>(null);
  const [hasLoadedAdminClient, setHasLoadedAdminClient] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAdminShareLink = async () => {
      try {
        const user = await dataService.getCurrentUser();
        if (!isMounted) return;
        setCurrentUser(user);

        if (user?.role !== 'admin' || !user.client_id) {
          setAdminClient(null);
          setHasLoadedAdminClient(true);
          return;
        }

        const publicClients = await dataService.getPublicClients();
        if (!isMounted) return;
        setAdminClient(publicClients.find((client) => client.id === user.client_id) || null);
        setHasLoadedAdminClient(true);
      } catch (error) {
        console.error('Error loading admin public share link:', error);
        if (isMounted) {
          setAdminClient(null);
          setHasLoadedAdminClient(true);
        }
      }
    };

    void loadAdminShareLink();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadAdminShareLink();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const publicUrl = useMemo(() => {
    const slug = getClientSlug(adminClient);
    return slug ? `${window.location.origin}/complejo/${encodeURIComponent(slug)}` : null;
  }, [adminClient]);

  if (!isAdminPath(pathname) || currentUser?.role !== 'admin' || !hasLoadedAdminClient) return null;

  const handleCopy = async () => {
    if (!publicUrl) {
      toast.error('Este complejo todavia no tiene un link publico configurado.');
      return;
    }

    try {
      await copyText(publicUrl);
      setCopied(true);
      toast.success('Link publico copiado');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Error copying public link:', error);
      toast.error('No se pudo copiar el link');
    }
  };

  const handleShare = async () => {
    if (!publicUrl) {
      toast.error('Este complejo todavia no tiene un link publico configurado.');
      return;
    }

    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: adminClient?.complex_name || adminClient?.name || 'Reservas Golazo',
        text: 'Reserva tu cancha desde nuestro perfil publico.',
        url: publicUrl,
      });
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error('Error sharing public link:', error);
        toast.error('No se pudo compartir el link');
      }
    }
  };

  return (
    <aside className="fixed bottom-24 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-sky-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl lg:bottom-5 lg:right-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sky-300 shadow-lg">
          <Link2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">Link publico del complejo</p>
          <p className="mt-1 truncate text-xs font-bold text-slate-700">
            {publicUrl || 'Slug publico pendiente'}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            {publicUrl
              ? 'Compartilo con tus clientes para que reserven directamente en tu cancha.'
              : 'Configurá un slug publico antes de copiar o compartir este perfil.'}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={handleCopy} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-800">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar link'}
        </button>
        <button type="button" onClick={handleShare} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-sky-800 transition hover:bg-sky-100">
          <Share2 className="h-4 w-4" />
          Compartir
        </button>
        {publicUrl ? (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:bg-zinc-50">
            <ExternalLink className="h-4 w-4" />
            Abrir perfil
          </a>
        ) : (
          <button type="button" disabled className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
            <ExternalLink className="h-4 w-4" />
            Abrir perfil
          </button>
        )}
      </div>
    </aside>
  );
};
