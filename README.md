# Golazo

Golazo es una plataforma web para la gestion de complejos de futbol. Permite administrar canchas, reservas, ventas, productos, ranking, configuracion del complejo y un portal publico para que jugadores consulten canchas disponibles y soliciten reservas.

El proyecto esta construido como una aplicacion React + TypeScript con Supabase como backend principal y Edge Functions para operaciones sensibles.

## Caracteristicas principales

- Portal publico para jugadores con seleccion de complejo, canchas publicas y solicitud de reservas.
- Panel administrativo para duenos o administradores de complejos.
- Calendario de reservas con vista por dia y semana.
- Gestion de canchas, productos, stock, ventas y reservas.
- Ranking de jugadores basado en reservas completadas y ausencias.
- Configuracion de datos publicos de pago para reservas.
- Panel superadmin SaaS para gestionar clientes, usuarios, metricas y auditoria.
- Integracion con Supabase Auth, base de datos, Storage y Edge Functions.
- Soporte PWA basico mediante manifest y service worker.
- Configuracion preparada para deploy como SPA en Vercel.

## Tecnologias utilizadas

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Supabase JS
- Supabase Edge Functions
- date-fns
- lucide-react
- motion
- sonner
- Recharts
- Vercel rewrites para SPA

## Requisitos previos

- Node.js instalado.
- npm instalado.
- Proyecto Supabase configurado si se quiere usar backend real.
- Supabase CLI si se van a desplegar Edge Functions.

## Instalacion

Clonar el repositorio e instalar dependencias:

```bash
npm install
```

## Configuracion de variables de entorno

Crear un archivo `.env` tomando como referencia `.env.example`.

Variables usadas por el frontend:

```env
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
GEMINI_API_KEY=""
APP_URL=""
```

Notas:

- `VITE_SUPABASE_URL` debe contener la URL publica del proyecto Supabase.
- `VITE_SUPABASE_ANON_KEY` debe contener la anon/public key del proyecto Supabase.
- `GEMINI_API_KEY` aparece configurada para integraciones heredadas del entorno AI Studio/Vite. No es necesaria para las pantallas principales de gestion.
- `APP_URL` aparece en `.env.example` como variable del entorno original de AI Studio. No es requerida por el flujo principal de la aplicacion.

Variables necesarias en Supabase Edge Functions:

```env
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
PUBLIC_BOOKING_DURATION_MINUTES=""
PUBLIC_BOOKING_DEFAULT_STATUS=""
```

Notas:

- `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse en el frontend ni subirse al repositorio.
- `PUBLIC_BOOKING_DURATION_MINUTES` es opcional; la funcion publica usa `60` minutos por defecto.
- `PUBLIC_BOOKING_DEFAULT_STATUS` es opcional; la funcion publica usa `pending` por defecto.

## Ejecucion en desarrollo

Iniciar el servidor local:

```bash
npm run dev
```

Por defecto, Vite corre en:

```text
http://localhost:3000
```

El script usa `--host=0.0.0.0`, por lo que tambien puede abrirse desde otros dispositivos de la red local usando la IP de la maquina.

## Build para produccion

Generar build de produccion:

```bash
npm run build
```

Previsualizar el build:

```bash
npm run preview
```

Validar TypeScript sin emitir archivos:

```bash
npm run lint
```

## Estructura del proyecto

```text
.
|-- public/                  # Manifest, service worker e iconos PWA
|-- src/
|   |-- bot/                 # Servicios auxiliares de bot/asistente
|   |-- components/          # Componentes reutilizables de UI
|   |-- lib/                 # Clientes y utilidades compartidas
|   |-- pages/               # Pantallas principales de la aplicacion
|   |-- pwa/                 # Registro del service worker
|   |-- services/            # Acceso a datos y servicios Supabase
|   |-- App.tsx              # Entrada principal de rutas y layout
|   |-- main.tsx             # Bootstrap React
|   `-- types.ts             # Tipos principales del dominio
|-- supabase/
|   |-- functions/           # Edge Functions
|   |   |-- admin-ops/
|   |   `-- public-create-booking/
|   `-- migrations/          # Migraciones SQL del proyecto
|-- vercel.json              # Rewrite para servir la app como SPA
|-- vite.config.ts           # Configuracion Vite
`-- package.json             # Scripts y dependencias
```

## Supabase

El frontend usa la anon key de Supabase para autenticacion y consultas permitidas por RLS.

Edge Functions incluidas:

- `admin-ops`: operaciones administrativas del panel superadmin.
- `public-create-booking`: creacion segura de reservas publicas.

Despliegue de funciones:

```bash
npx supabase functions deploy admin-ops --project-ref <project-ref>
npx supabase functions deploy public-create-booking --project-ref <project-ref> --no-verify-jwt
```

Configurar secretos en Supabase:

```bash
npx supabase secrets set SUPABASE_URL="https://<project-ref>.supabase.co"
npx supabase secrets set SUPABASE_ANON_KEY="<anon-key>"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

## Deploy

El proyecto incluye `vercel.json` con rewrite a `/`, necesario para que las rutas del frontend funcionen como SPA en Vercel.

Flujo recomendado:

1. Configurar variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el proveedor de hosting.
2. Ejecutar `npm run build`.
3. Publicar el directorio `dist`.
4. Desplegar Edge Functions en Supabase y configurar sus secretos.

## Notas importantes de seguridad

- No subir archivos `.env` con valores reales.
- No exponer `SUPABASE_SERVICE_ROLE_KEY` en el frontend.
- Mantener RLS activo y revisar las politicas antes de usar datos reales de clientes.
- Las operaciones de superadmin deben pasar por `admin-ops`.
- Las reservas publicas deben pasar por `public-create-booking`.
- Las claves publicables de Supabase pueden existir en el frontend, pero no reemplazan las reglas de seguridad del backend.

## Estado del proyecto

Proyecto en desarrollo activo. La base funcional incluye portal publico, panel admin, panel superadmin, integracion Supabase y build de produccion. Antes de usarlo comercialmente, conviene validar reglas RLS, flujo completo de reservas publicas, configuracion de pagos, datos reales y despliegue de Edge Functions.

## Autor

Proyecto desarrollado por Martin.
