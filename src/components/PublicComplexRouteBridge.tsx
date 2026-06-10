import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import type { Client, User } from '../types';

const PUBLIC_COMPLEX_ROUTE = /^\/complejo\/([^/]+)\/?$/i;
const PUBLIC_ENTRY_DATASET_KEY = 'golazoPublicEntry';
const ROUTE_BRIDGE_MARKER = '__golazo_public_route_bridge_installed__';

type PublicEntryMode = 'catalog' | 'shared';

declare global {
  interface Window {
    [ROUTE_BRIDGE_MARKER]?: boolean;
  }
}

const normalizeSlug = (value: string) => decodeURIComponent(value).trim().toLowerCase();

const readComplexSlugFromPath = (pathname = window.location.pathname) => {
  const match = pathname.match(PUBLIC_COMPLEX_ROUTE);
  return match?.[1] ? normalizeSlug(match[1]) : null;
};

const setPublicEntryMode = (mode: PublicEntryMode) => {
  document.documentElement.dataset[PUBLIC_ENTRY_DATASET_KEY] = mode;
};

const getClientSlug = (client: Client | undefined | null) => client?.slug?.trim().toLowerCase() || null;

const updateSharedPortalButtonVisibility = () => {
  const shouldHide = document.documentElement.dataset[PUBLIC_ENTRY_DATASET_KEY] === 'shared';

  document.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    const isChangeComplexButton = button.textContent?.toLowerCase().includes('cambiar complejo');
    if (!isChangeComplexButton) return;

    if (shouldHide) {
      button.dataset.golazoSharedHidden = 'true';
      button.style.display = 'none';
      return;
    }

    if (button.dataset.golazoSharedHidden === 'true') {
      delete button.dataset.golazoSharedHidden;
      button.style.removeProperty('display');
    }
  });
};

/**
 * Compatibility bridge for the current single-page shell.
 * It keeps the existing internal state working while making the public URL
 * the source of truth for shared complex links.
 */
export const preparePublicComplexRoutes = async () => {
  if (typeof window === 'undefined' || window[ROUTE_BRIDGE_MARKER]) return;
  window[ROUTE_BRIDGE_MARKER] = true;

  const originalSetPublicClientSelection = dataService.setPublicClientSelection.bind(dataService);
  const originalClearPublicClientSelection = dataService.clearPublicClientSelection.bind(dataService);
  const pathname = window.location.pathname;
  const sharedSlug = readComplexSlugFromPath(pathname);
  let cachedClients: Client[] = [];

  const loadClients = async () => {
    if (cachedClients.length > 0) return cachedClients;
    try {
      cachedClients = await dataService.getPublicClients();
    } catch (error) {
      console.error('Error loading public clients for route bridge:', error);
      cachedClients = [];
    }
    return cachedClients;
  };

  if (pathname === '/') {
    originalClearPublicClientSelection();
    setPublicEntryMode('catalog');
  } else if (sharedSlug) {
    const clients = await loadClients();
    const selectedClient = clients.find((client) => getClientSlug(client) === sharedSlug);

    if (selectedClient) {
      originalSetPublicClientSelection(selectedClient.id);
      const cameFromCatalog = window.history.state?.golazoFromCatalog === true;
      setPublicEntryMode(cameFromCatalog ? 'catalog' : 'shared');
    } else {
      originalClearPublicClientSelection();
      window.history.replaceState({ golazoInvalidComplex: sharedSlug }, '', '/');
      setPublicEntryMode('catalog');
    }
  }

  dataService.setPublicClientSelection = (clientId: string) => {
    originalSetPublicClientSelection(clientId);
    const selectedClient = cachedClients.find((client) => client.id === clientId);
    const slug = getClientSlug(selectedClient);

    if (slug && window.location.pathname !== `/complejo/${slug}`) {
      window.history.pushState({ golazoFromCatalog: true }, '', `/complejo/${slug}`);
    }

    setPublicEntryMode('catalog');
    updateSharedPortalButtonVisibility();
  };

  dataService.clearPublicClientSelection = () => {
    originalClearPublicClientSelection();

    if (readComplexSlugFromPath()) {
      window.history.pushState({ golazoCatalogRoot: true }, '', '/');
    }

    setPublicEntryMode('catalog');
    updateSharedPortalButtonVisibility();
  };

  window.addEventListener('popstate', () => {
    window.location.reload();
  });
};

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

export const PublicComplexRouteBridge = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminClient, setAdminClient] = useState<Client | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    updateSharedPortalButtonVisibility();
    const observer = new MutationObserver(updateSharedPortalButtonVisibility);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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
          return;
        }

        const publicClients = await dataService.getPublicClients();
        if (!isMounted) return;
        setAdminClient(publicClients.find((client) => client.id === user.client_id) || null);
      } catch (error) {
        console.error('Error loading admin public share link:', error);
      }
    };

    void loadAdminShareLink();
    return () => {
      isMounted = false;
    };
  }, []);

  const publicUrl = useMemo(() => {
    const slug = getClientSlug(adminClient);
    return slug ? `${window.location.origin}/complejo/${slug}` : null;
  }, [adminClient]);

  if (currentUser?.role !== 'admin' || !publicUrl) return null;

  const handleCopy = async () => {
    try {
      await copyText(publicUrl);
      setCopied(true);
      toast.success('Link público copiado');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Error copying public link:', error);
      toast.error('No se pudo copiar el link');
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: adminClient?.complex_name || adminClient?.name || 'Reservas Golazo',
        text: 'Reservá tu cancha desde nuestro perfil público.',
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">Link público del complejo</p>
          <p className="mt-1 truncate text-xs font-bold text-slate-700">{publicUrl}</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">Compartilo con tus clientes para que reserven directamente en tu cancha.</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={handleCopy} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-800">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button type="button" onClick={handleShare} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-sky-800 transition hover:bg-sky-100">
          <Share2 className="h-4 w-4" />
          Compartir
        </button>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition hover:bg-zinc-50">
          <ExternalLink className="h-4 w-4" />
          Abrir
        </a>
      </div>
    </aside>
  );
};
