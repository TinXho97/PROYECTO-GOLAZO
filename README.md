<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9f5e08e0-f1a5-4c36-badd-e4024d628af2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Supabase + Super Admin setup (required in this project)

If Supabase is not configured, this app falls back to localStorage mode.

1. Create `.env` from `.env.example` and set:
   - `VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<your-anon-key>`
   - `VITE_SUPERADMIN_PASSWORD=<shared-superadmin-password>`
2. Restart dev server after changing env vars.
3. Deploy Edge Function:
   - `supabase functions deploy admin-ops`
4. Set Edge Function secrets in Supabase:
   - `SUPERADMIN_PASSWORD` (must match `VITE_SUPERADMIN_PASSWORD`)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Ensure the super admin user has metadata:
   - `role: "superadmin"`
6. Open super admin panel route:
   - `/panel-interno-golazo-...` (secret internal route)

## Troubleshooting data to share (safe)

If you see localStorage fallback warnings, share these (mask secrets):

1. Browser console output for:
   - `[Supabase] ...` and `[DataService] ...` warnings.
2. Value format checks (masked):
   - `VITE_SUPABASE_URL` (full URL is OK to share),
   - `VITE_SUPABASE_ANON_KEY` first 10 chars only (`eyJ...` legacy or `sb_publishable_...` new format).
3. Network result of:
   - `GET https://<project-ref>.supabase.co/rest/v1/clients?select=id&limit=1` (status code + response body).
4. Supabase Auth user metadata for your super admin user:
   - must include `role: "superadmin"`.
5. Edge Function `admin-ops` status:
   - deployed yes/no,
   - secrets configured (`SUPERADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`),
   - whether `SUPERADMIN_PASSWORD` matches `VITE_SUPERADMIN_PASSWORD`.
