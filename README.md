# Lakshmi Agency — Industrial Product Catalogue

A React/Vite public catalogue with an Express/MySQL API and a separate authenticated admin workspace. The site is designed for product discovery and quotation enquiries; it does not take payments or place purchases.

## Included

- Responsive public pages for the homepage, product catalogue, product details, brands, services, about, contact and quotation enquiries.
- MySQL-backed product, category, subcategory, brand and enquiry APIs. The public product list is paginated and filterable.
- A separate `/admin` area for catalogue edits, categories, brands, enquiry status and notes, settings and page copy.
- Customer registration and sign-in at `/account/register` and `/account/login`, with a private dashboard for enquiry history, quotation status, profile and password updates.
- Admin customer directory and dashboard counts for registered customers; each customer's requests are linked to their account and only visible in that customer's workspace.
- Password hashing with bcrypt, signed JWT sessions, rate limits, validation, CORS, upload MIME and size checks, foreign keys and indexes.
- Quote submissions saved to MySQL with a reference number. Optional SMTP notification is sent when SMTP variables are configured.
- WhatsApp links use the number set in admin settings. The setting is blank by default because none of the supplied numbers was identified as WhatsApp.
- SQL sitemap, robots response, dynamic page metadata, LocalBusiness JSON-LD and product JSON-LD.
- Workbook importer that stores original source rows and creates review flags for ambiguous mappings.

## Product catalogue source

The catalogue data was mapped from `LA product and catagories list.xlsx` (Sheet1). The workbook is a category/brand matrix rather than a list of individual SKUs: it provides product families, capacity and phase ranges, body/type qualifiers, and brand references. The generated catalogue contains 171 range entries across 13 product families and 116 brand references. It does not provide model numbers, prices, product photos or full technical specifications, so those fields are left blank and availability is confirmed by enquiry.

The public frontend includes the mapped catalogue as a local fallback, so product browsing works while MySQL is not configured. When setting up MySQL, run the workbook importer to place the same entries in the database and retain source rows for admin review:

```bash
cd backend
npm run import:catalogue -- "D:/New folder/Downloads/LA product and catagories list.xlsx"
```

The matrix importer stages populated source rows in `catalogue_import_rows`, creates product and brand links from the workbook, and preserves the contributing source rows in `products.source_data`. It skips duplicate import batches by workbook hash. Product cards use labelled representative category imagery until exact product photos are supplied.

To regenerate the frontend catalogue after the workbook changes:

```bash
cd backend
npm run export:catalogue -- "D:/New folder/Downloads/LA product and catagories list.xlsx"
```

## Local setup

Requirements: Node.js 20+, npm, and MySQL 8+.

1. Create a MySQL database and application user with only the permissions needed by the application.
2. Run `database/schema.sql`, then `database/seed.sql` against the database.
3. Copy `backend/.env.example` to `backend/.env` and set the MySQL credentials, a long random `JWT_SECRET`, frontend URL and public site URL. Keep this file out of source control.
4. Create the first admin account after the schema is loaded:

   ```bash
   cd backend
   npm install
   npm run seed:admin -- admin@example.com "Lakshmi Agency Admin" "a-long-unique-password-of-12-or-more-characters"
   ```

   Choose the password locally and do not paste production credentials into source files or commit them.

5. Install the frontend and root dependencies from the project root:

   ```bash
   npm install
   npm install --prefix frontend
   ```

6. Start the API and frontend during development:

   ```bash
   npm run dev
   ```

   Frontend: `http://127.0.0.1:5174`; API health: `http://127.0.0.1:5000/api/health`; admin: `http://127.0.0.1:5174/admin`.

New customer accounts can be registered directly from the site at `http://127.0.0.1:5174/account/register`; customer sign-in is at `http://127.0.0.1:5174/account/login`. For an existing database, run `database/migrations/001_customer_accounts.sql` once before starting the updated API. Fresh databases created from `database/schema.sql` already include customer accounts. Customer passwords are hashed, customer sessions are separate from admin sessions, and quotation requests submitted while signed in appear in that customer's dashboard.

Optional SMTP settings deliver a notification email after the enquiry has been stored. SMTP failure does not discard an enquiry. Uploaded product images are stored under `backend/uploads` and served from `/uploads`.

## Deploy: Render API + Netlify frontend

The repository includes `render.yaml` for the API and `netlify.toml` for the site. No secret values are stored in either file.

### 1. Database

Use an external MySQL 8+ provider that allows remote TLS connections (for example Aiven, PlanetScale MySQL or another managed MySQL host). Create a database and a limited application user, then import `database/schema.sql` and `database/seed.sql`. If upgrading an older database, apply the files in `database/migrations/` in order.

### 2. Backend on Render

1. Sign in to Render and choose **New → Blueprint**.
2. Connect `https://github.com/tamilanr41/motor.git` and select branch `main`.
3. Render reads `render.yaml`, which sets `rootDir: backend`, runs `npm install`, starts with `npm start` and checks `/api/health`.
4. Fill the prompted secret values in Render:

   | Variable | Value |
   | --- | --- |
   | `FRONTEND_URL` | Final Netlify origin, e.g. `https://your-site.netlify.app` |
   | `PUBLIC_SITE_URL` | Same canonical origin |
   | `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | External MySQL connection details |
   | `JWT_SECRET` | 32+ random characters |
   | `ADMIN_REGISTRATION_SECRET` | Private admin signup code |

   For Hostinger shared MySQL, `DB_SSL=false` is preset because its Remote MySQL endpoint does not document TLS support. Only change it to `true` if your provider explicitly offers SSL for external connections.

   CORS allows `FRONTEND_URL`, `PUBLIC_SITE_URL`, any origins listed in `CORS_ORIGINS` (comma separated), plus the built-in local and `https://lakshmiagency.netlify.app` origins. If the browser reports a CORS error, check that the exact Netlify origin (scheme and host, no trailing slash) is in one of those variables, then redeploy.

5. After the first deploy, open Render Shell in the backend service and create the first admin:

   ```bash
   npm run seed:admin -- admin@example.com "Lakshmi Agency Admin" "a-long-unique-password"
   ```

6. Confirm `https://<your-render-service>.onrender.com/api/health` returns `{"status":"ok"}`.

If you created a regular **Web Service** instead of a Blueprint, leave Render's default commands (`npm install && npm run build` and `npm start`). The root `build` script installs both the backend and frontend dependencies before building, and the root `start` script runs the backend, so the service works from the repository root.

### 3. Frontend on Netlify

1. Choose **Add new site → Import an existing project** and connect the same GitHub repository.
2. Select branch `main`. `netlify.toml` sets the base directory to `frontend`, build command to `npm run build` and publish directory to `dist`.
3. Add one environment variable in Netlify:

   ```text
   VITE_API_URL=https://<your-render-service>.onrender.com/api
   ```

4. Deploy. The included redirect serves `index.html` for SPA routes such as `/admin` and `/products/pumps`.

### 4. After deployment

- Return to Render and make sure `FRONTEND_URL` and `PUBLIC_SITE_URL` match the final Netlify origin, then redeploy the API. This is required for CORS, sitemap and robots URLs.
- Test the public catalogue, `/quote`, `/account/login`, the hidden admin key, `/admin/review` and a sign-in.
- Uploaded images are written to the backend's local `backend/uploads` folder. On Render this filesystem is ephemeral, so use object storage for permanent production uploads.

Never commit `.env` files or real credentials. Set them only in the Render and Netlify dashboards.

## Hostinger deployment outline

1. Create a MySQL database and user in hPanel. Import `database/schema.sql` and `database/seed.sql` using phpMyAdmin or the available MySQL client.
2. Install the backend dependencies in `backend`, set the production environment variables in Hostinger's Node.js application configuration, and point the app entry to `src/server.js`. Use a supported Node.js LTS runtime. Keep `.env` and uploads outside any public static directory.
3. Set `FRONTEND_URL` to the deployed website origin and `PUBLIC_SITE_URL` to the canonical HTTPS domain. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` and a cryptographically random `JWT_SECRET` in the hosting environment.
4. Run the one-time admin creation command in the deployed backend environment. Configure SMTP if admin email notification is needed.
5. Build the frontend with `npm install --prefix frontend && npm run build --prefix frontend`. Publish `frontend/dist` as the static website document root. Configure the site's web server to serve SPA routes from `index.html` and proxy `/api/*` and `/uploads/*` to the Node.js application.
6. Route `/sitemap.xml` and `/robots.txt` to the backend or add equivalent static files at the website origin. Verify HTTPS, domain DNS, CORS origin, database access, image upload persistence and the admin login in Hostinger's deployed environment.

Hostinger's exact Node.js routing UI and reverse-proxy capabilities depend on the selected plan. If the plan cannot proxy `/api` from the static site origin, use an API subdomain and set the frontend API base URL and CORS origin accordingly before deployment.

## Deployment configuration notes

- `JWT_SECRET` should be at least 32 random characters and different in every environment.
- `MAX_UPLOAD_MB` defaults to 8 MB. Only JPG, PNG and WebP uploads are accepted.
- `WHATSAPP_NUMBER` is not an environment setting; set it from the admin workspace after the business confirms the correct number.
- Bank information is never part of the public settings endpoint. Admin-only bank fields are private settings and should be added only if needed.
- Product prices, unverified technical specifications, establishment year, certifications and dealer claims are intentionally absent.
- Replace the stock photography with licensed business photography before launch. The current remote image URLs are presentation assets, not evidence of the agency's inventory.

## Main folders

```text
frontend/       React, Vite, Tailwind CSS and public/admin interfaces
backend/        Express API, authentication, uploads and catalogue importer
database/       MySQL schema and business/taxonomy seed
```
