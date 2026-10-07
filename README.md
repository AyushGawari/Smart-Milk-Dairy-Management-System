# Smart Milk Dairy Management System — Multi-Company

## Architecture
Developer → Companies → Farmers

All companies, farmers, milk collection, feed/deductions and settings are stored in MongoDB. Company data is isolated by `companyId`.

## Vercel Environment Variables
Set these in **Vercel → Project → Settings → Environment Variables** for Production, Preview and Development:

- `MONGODB_URI` — your MongoDB Atlas connection string
- `MONGODB_DB` — e.g. `smart_milk_dairy`
- `SESSION_SECRET` — a long random secret
- `DEVELOPER_USERNAME` — your developer username
- `DEVELOPER_PASSWORD` — your developer password

Do not put real secrets in GitHub.

## Vercel Root Directory
If this repository is imported directly, Root Directory must be `.` (the repository root), where `index.html`, `package.json`, `vercel.json`, and `api/` are located.

## Test backend
After deployment open:
`https://YOUR-DOMAIN.vercel.app/api/health`

A working deployment returns JSON with `ok: true` and the MongoDB database name.

## Roles
- Developer: creates and manages companies.
- Company: manages only its own farmers, milk and feed records.
- Farmer: sees only their own records.

## Local development
Install dependencies with `npm install`. Vercel serverless functions require the environment variables above.
