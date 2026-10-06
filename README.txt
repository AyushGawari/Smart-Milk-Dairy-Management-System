DIGITAL MILK DAIRY — VERCEL + MONGODB

Architecture:
GitHub → Vercel → MongoDB Atlas

DEPLOYMENT
1. Create a MongoDB Atlas cluster and database user.
2. Copy your MongoDB connection string.
3. Create a GitHub repository and upload this whole project.
4. Import that GitHub repository into Vercel.
5. In Vercel → Project Settings → Environment Variables, add:
   MONGODB_URI = your MongoDB connection string
   MONGODB_DB  = digital_milk_dairy
6. Redeploy the Vercel project.

FILES
index.html        Existing UI with backend integration
api/state.js      Vercel serverless API connected to MongoDB
package.json      MongoDB dependency
vercel.json       Vercel routing
.env.example      Environment variable example
README.txt        Instructions

DATA SAVED
Farmers, milk entries, current milk rate, feed inventory, feed deductions and ID counters.

LOGIN
Successful login clears the username/company and password fields.
The admin top bar shows "Logged in" instead of the username.

IMPORTANT SECURITY NOTE
This is suitable for a college/demo project. The current login check remains client-side and farmer passwords are stored in the application state. A production system should use server-side authentication, password hashing and authorization.

The existing page design/layout was not redesigned.
