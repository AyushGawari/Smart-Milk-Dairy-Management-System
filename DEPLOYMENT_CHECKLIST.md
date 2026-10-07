# Deployment Checklist

1. Push this folder's contents to the GitHub repository root.
2. Import that repository into Vercel.
3. Set Vercel Root Directory to `.`.
4. Add MONGODB_URI, MONGODB_DB, SESSION_SECRET, DEVELOPER_USERNAME, DEVELOPER_PASSWORD.
5. Redeploy after saving variables.
6. Test `/api/health`.
7. Log in as Developer and create a Company.
8. Log in as that Company and add a Farmer.
9. Verify the records in MongoDB Atlas.
