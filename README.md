# ⚽ Golazo - Plataforma SaaS de Gestión de Canchas

Aplicación intuitiva y de alto rendimiento para la reserva y gestión multi-tenant de turnos de canchas de fútbol.

## 🚀 Stack Tecnológico

* **Frontend:** React (Vite), TypeScript
* **Estilos & UI:** Tailwind CSS, Framer Motion (Skeleton Loaders), Recharts (Gráficos)
* **Backend & BaaS:** Supabase (Auth, Database, Storage, Edge Functions)
* **PWA:** Soporte offline shell y manifest instalable

## 🏗️ Arquitectura y Experiencia de Usuario (UX)

El proyecto utiliza una arquitectura SaaS y Multi-tenant, con Supabase como fuente de verdad para producción y controles de seguridad respaldados por RLS:

* **Supabase como fuente de verdad:** En producción, los datos autoritativos viven en Supabase. Las escrituras críticas sin configuración válida de Supabase están bloqueadas con errores controlados. El código todavía conserva persistencias locales limitadas o legacy (preferencias de interfaz, datos temporales y fallbacks históricos) que serán depuradas en una etapa posterior; por eso no debe interpretarse como ausencia total de `localStorage` ni como operación offline de negocio.
* **Procesamiento de Datos Aislado:** La lógica compleja de procesamiento de analíticas y métricas avanzadas ha sido extraída a `src/services/analyticsProcessing.ts`. Al utilizar funciones puras, se asegura un alto rendimiento y se facilita el unit testing aislado de la capa de componentes.
* **Zero Layout Shift:** Implementación de **Skeleton Loaders** integrados con Framer Motion y Tailwind. Esto garantiza que la carga de datos asíncrona mantenga la estructura visual intacta, eliminando los saltos de interfaz y brindando una sensación de carga instantánea.

## ⚙️ Instalación Local

**Requisitos:** Node.js

1. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```
2. Configurar las variables de entorno en el archivo `.env` (basado en `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<tu-anon-key>
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## ☁️ Despliegue y Configuración de Supabase (Multi-tenant)

Para que la lógica Multi-tenant y el panel de Super Admin operen correctamente, es fundamental el despliegue de las funciones Serverless.

1. **Despliegue de Edge Functions:**
   ```bash
   supabase functions deploy admin-ops
   ```
2. **Configuración de Secrets en Supabase:**
   Deberás configurar los secretos del entorno en tu dashboard de Supabase para que la función valide el JWT del usuario y use el rol de servicio solo después de autorizarlo:
   * `SUPABASE_URL`
   * `SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`

### ⚠️ Advertencia de Seguridad (Roles y Permisos)
Queda **estrictamente prohibido** el uso de `user_metadata` para la validación de roles críticos (ej. superadmin, tenant admin). Toda la autorización, herencia de roles y segmentación de datos debe delegarse exclusivamente al esquema relacional (`profiles` y `client_users`) respaldado por las políticas de Row Level Security (RLS) en la base de datos.

## 📱 Progressive Web App (PWA)

El proyecto incluye configuración nativa de PWA:
1. App instalable vía `manifest.webmanifest`.
2. Fallback offline mediante Service Worker en `public/sw.js`.

Para probar la versión PWA compilada localmente, ejecuta `npm run build` seguido de `npm run preview`. Puedes auditar la instalación desde la pestaña "Application" en las DevTools de tu navegador.
