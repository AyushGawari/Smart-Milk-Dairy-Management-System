# Smart Milk Dairy Management System — Multi-Company Edition

## Architecture
Developer → Companies → Farmers

- Developer creates multiple companies.
- Each company has its own admin account.
- Company admins can create and manage only their own farmers.
- Farmers log in using Company Code + Member ID + password.
- Milk collection, feed/deductions, rates and farmer records are stored in MongoDB.
- Every company-owned document contains `companyId`, so data is isolated between companies.
- No demo credentials or demo application data are included.

## MongoDB / Vercel environment variables
Set these in Vercel:

- `MONGODB_URI`
- `MONGODB_DB` (for example `digital_milk_dairy`)
- `SESSION_SECRET` (long random secret)
- `DEVELOPER_USERNAME`
- `DEVELOPER_PASSWORD`

## Deploy
1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Add all five environment variables for Production.
4. Deploy.
5. Open `/api/health` to confirm MongoDB connectivity.
6. Log in as Developer and create the first company.
7. Log in as that Company Admin and add farmers.
8. Farmers use the company's code to log in.

## Important
Do not put MongoDB credentials in `index.html`, JavaScript, or GitHub. Keep them only in Vercel environment variables.
