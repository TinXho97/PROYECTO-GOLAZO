const PUBLIC_MANIFEST = '/manifest-public.webmanifest';
const ADMIN_MANIFEST = '/manifest-admin.webmanifest';
const SUPERADMIN_MANIFEST = '/manifest-superadmin.webmanifest';

function resolveManifestHref(pathname: string): string {
  if (pathname.startsWith('/panel-interno-golazo-saas')) {
    return SUPERADMIN_MANIFEST;
  }

  if (pathname.startsWith('/admin')) {
    return ADMIN_MANIFEST;
  }

  return PUBLIC_MANIFEST;
}

export function selectManifest() {
  const manifestLink = document.getElementById('app-manifest');

  if (!(manifestLink instanceof HTMLLinkElement)) {
    return;
  }

  manifestLink.href = resolveManifestHref(window.location.pathname);
}
