# Hostinger Separate Frontend & Backend Deployment Guide for Infokart

This guide walks you through deploying the **React frontend** and the **Node.js Express backend** separately on **Hostinger**. 

In this setup:
- The **Frontend** (React static files) is hosted on your main domain (e.g., `https://yourdomain.com`) via Hostinger Shared Hosting.
- The **Backend** (Node.js API) is hosted on a subdomain (e.g., `https://api.yourdomain.com`) via Hostinger Node.js application.

---

## Step 1: Configure the Frontend API Base URL
Since your frontend and backend will run on different domains, you must configure the frontend to talk to your backend subdomain.

1. Open `src/api/config.js` on your computer.
2. Change the `API_BASE_URL` to point to your backend subdomain:
   ```javascript
   export const API_BASE_URL = 'https://api.yourdomain.com'; // Replace with your backend subdomain
   ```

---

## Step 2: Build the Frontend
Build the frontend files into compiled static assets:

1. Open your terminal at the project root directory and run:
   ```bash
   npm run build
   ```
   *This compiles your React frontend and outputs the static files to the `dist/` directory.*

---

## Step 3: Deploy the Frontend on Hostinger Shared Hosting
1. Log in to your **Hostinger hPanel**.
2. Go to **File Manager** for your main domain.
3. Open the `public_html` folder (the document root of your main domain `yourdomain.com`).
4. Upload all files and folders **inside** the local `dist/` directory directly into `public_html`.
   *(Your `public_html` should contain `index.html`, `assets/`, `favicon.svg`, etc.)*

---

## Step 4: Create a Subdomain for the Backend
1. In the Hostinger hPanel search bar, search for **Subdomains**.
2. Create a new subdomain named `api` (yielding `api.yourdomain.com`).
3. Click **Create**. This creates a corresponding folder in your file manager (e.g., `public_html/api` or `domains/yourdomain.com/public_html/api`).

---

## Step 5: Upload and Deploy the Backend on Hostinger Node.js App
1. Go to **File Manager** in your hPanel.
2. Navigate to the folder of your new subdomain (e.g., `public_html/api`).
3. Zip and upload the contents of the `server/` directory from your computer, along with the root `package.json` and `package-lock.json` file.
4. Extract them in the subdomain folder.
5. In hPanel, go to **Node.js** under the **Advanced** section.
6. Click **Create App**:
   - **Source Directory**: select your subdomain folder (e.g., `/public_html/api`)
   - **App URL**: select your subdomain `https://api.yourdomain.com`
   - **Startup File**: `server.js`
7. Click **Save**.
8. Once saved, click the **NPM Install** button on the Hostinger Node.js dashboard to install the dependencies (`firebase-admin`, `better-sqlite3`, `express`, etc.).

---

## Step 6: Configure Firebase and Secrets on the Subdomain App
Under the **Environment Variables** section of your Hostinger Node.js dashboard, add your key-value pairs:
- `FIREBASE_PROJECT_ID`: `your-project-id`
- `FIREBASE_CLIENT_EMAIL`: `your-client-email`
- `FIREBASE_PRIVATE_KEY`: `your-private-key` (make sure newline `\n` characters are preserved)
- `META_APP_ID`: `your-app-id`
- `META_APP_SECRET`: `your-app-secret`
- `META_CONFIG_ID`: `your-meta-config-id`
- `GEMINI_API_KEY`: `your-gemini-key`
- `WEBHOOK_VERIFY_TOKEN`: `my_secure_verify_token`

*Alternatively, download `serviceAccountKey.json` from the Firebase console and upload it directly into your subdomain folder (`public_html/api/serviceAccountKey.json`).*

---

## Step 7: Map the WhatsApp Webhook Callback URL
Once the backend is live, configure your Meta Webhook in the Meta Developer Console:
- **Callback URL**: `https://api.yourdomain.com/webhook` (must point to your subdomain!)
- **Verify Token**: `my_secure_verify_token`
- **Webhook Fields to Subscribe**: `messages`
