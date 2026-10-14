# Dashboard restoration notes

The working multi-company project has been updated using `MILKDEAIRY.html` as the dashboard reference.

- Kept the existing Developer, Company, and Farmer login flows and the existing API token handling.
- Restored company dashboard modules: Farmers, Milk Entry, Rates, Feed Inventory, Feed / Deductions, and Summary.
- Added MongoDB-backed `feedInventory` storage scoped to `companyId`.
- Feed deductions are saved to the existing `feedEntries` collection; inventory stock is reduced when a deduction is recorded.
- Added farmer-wise gross, deductions, and net-payable summary with CSV export.
- Updated the farmer dashboard to show feed deductions and net payable.
- Kept all data requests on `/api/state`; no local-only demo inventory is used.

After deployment, verify the `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET`, `DEVELOPER_USERNAME`, and `DEVELOPER_PASSWORD` environment variables in Vercel.
