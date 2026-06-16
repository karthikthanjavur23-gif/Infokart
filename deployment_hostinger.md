# Hostinger hPanel Node.js Deployment Guide for Infokart

This guide walks you through deploying your Infokart web application on **Hostinger Shared or Cloud Node.js Hosting** (using the hPanel dashboard).

Since our Express backend is already configured to serve the React frontend static pages, you do NOT need a VPS, Nginx, or separate hosting. Your entire application (React + Node.js) runs as a single Node.js app.

---

## Prerequisites
1. A **Hostinger Cloud or Shared Hosting** plan with Node.js support enabled.
2. A **Firebase Project** with Firestore Database initialized.
3. Your Meta Developer App App ID and App Secret.

---

## Step 1: Prepare and Build the Application Locally
First, compile the React frontend into static assets on your local computer.

1. Open your terminal at the project root directory and run:
   ```bash
   npm run build
   ```
   *This compiles your React frontend into the `dist/` directory.*

2. Select the following files and folders and compress them into a single `.zip` file (e.g., `archive.zip`):
   - `dist/` (static build directory)
   - `server/` (backend server directory, containing `server.js` and `database.js`)
   - `package.json`
   - `package-lock.json`

---

## Step 2: Upload Files to Hostinger File Manager
1. Log in to your **Hostinger hPanel**.
2. Go to **File Manager** for your domain.
3. Navigate to your main application folder (usually `public_html`).
4. Upload the `.zip` file you created in Step 1.
5. Extract the `.zip` file directly inside `public_html`.

---

## Step 3: Configure Node.js App in Hostinger hPanel
1. Search for **Node.js** in hPanel search bar or go to **Node.js** under the **Advanced** section.
2. Click **Create App** (or edit your existing Node.js application).
3. Set the configuration fields as follows:
   - **Source Directory**: `/public_html` (or select the folder where you extracted the zip)
   - **App URL**: Select your domain or subdomain (e.g., `https://yourdomain.com`)
   - **Startup File**: `server/server.js`
4. Click **Save**.
5. Once saved, click the **NPM Install** button on your Hostinger Node.js dashboard to install the dependencies (`firebase-admin`, `express`, `better-sqlite3`, etc.).

---

## Step 4: Add Environment Variables in Hostinger
Under the **Environment Variables** section of your Hostinger Node.js dashboard, add the following key-value pairs:

- `PORT`: `3001` (or the port Hostinger assigns)
- `FIREBASE_PROJECT_ID`: `your-project-id`
- `FIREBASE_CLIENT_EMAIL`: `your-client-email`
- `FIREBASE_PRIVATE_KEY`: `your-private-key` (make sure newline `\n` characters are preserved)
- `META_APP_ID`: `your-app-id`
- `META_APP_SECRET`: `your-app-secret`
- `META_CONFIG_ID`: `your-meta-config-id`
- `GEMINI_API_KEY`: `your-gemini-key`
- `WEBHOOK_VERIFY_TOKEN`: `my_secure_verify_token`

---

## Step 5: Option to Upload Firebase Service Account JSON (Alternative)
If pasting the long `FIREBASE_PRIVATE_KEY` into Hostinger's environment variables feels tedious:

1. Go to your **Firebase Console** -> **Project Settings** -> **Service Accounts**.
2. Click **Generate New Private Key** to download the credentials `.json` file.
3. Rename the file on your computer to `serviceAccountKey.json`.
4. Upload it directly inside the `server/` directory on Hostinger (`public_html/server/serviceAccountKey.json`).
5. Restart your application. The app will automatically connect to Firebase using this file!

---

## Step 6: Start/Restart the Application
1. Click **Restart App** or **Start** on the Hostinger Node.js panel.
2. Visit your domain `https://yourdomain.com` in your browser. Your Infokart app is now running, backed by Firebase!

---

## Step 7: Map WhatsApp Webhook Callback URL
Once your site is live, update the Webhook in your Meta Developer Portal:
- **Callback URL**: `https://yourdomain.com/webhook`
- **Verify Token**: `my_secure_verify_token` (must match your `WEBHOOK_VERIFY_TOKEN` env variable)
- **Webhook Fields to Subscribe**: `messages`
