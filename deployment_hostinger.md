# Hostinger Deployment Guide for Spark AI (Infokart)

This guide walks you through deploying your Spark AI (Infokart) web application on **Hostinger**. It covers building the frontend, deploying the Node.js backend (using Hostinger VPS or hPanel Node.js Shared Hosting), and configuring your **Firebase Firestore** credentials.

---

## Prerequisites
1. A **Hostinger Account** with either a **VPS Hosting** plan (recommended for full Node.js control) or a **Cloud/Shared Hosting** plan with Node.js support enabled.
2. A **Firebase Project** with Firestore Database initialized.
3. Your Meta Developer App App ID and App Secret (if using Embedded Signup).

---

## Step 1: Prepare and Build the Application
Before uploading your code, you need to compile the React frontend into static assets.

1. In your local terminal, navigate to the root directory and build the frontend:
   ```bash
   npm run build
   ```
   *This compiles your React frontend into the `dist/` directory at the project root.*

2. Prepare the files to upload. You will upload:
   - `dist/` (static build directory)
   - `server/` (backend server directory, containing `server.js` and `database.js`)
   - `package.json` and `package-lock.json`

---

## Step 2: Choose Your Hostinger Hosting Option

### Option A: Using Hostinger VPS (Recommended)
If you have a Linux VPS (Ubuntu), follow these steps:

1. **Access your VPS via SSH**:
   ```bash
   ssh root@your_vps_ip
   ```

2. **Install Node.js & PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -y -g pm2
   ```

3. **Upload files**:
   Clone your repository or use SFTP/FTP to transfer the files (`dist/`, `server/`, `package.json`, `package-lock.json`) to a directory on your VPS, e.g., `/var/www/infokart`.

4. **Install backend dependencies**:
   ```bash
   cd /var/www/infokart
   npm install --production
   ```

5. **Configure Environment Variables**:
   Create a `.env` file inside `/var/www/infokart/server/.env`:
   ```env
   PORT=3001
   
   # Meta Credentials
   META_APP_ID=your_meta_app_id
   META_APP_SECRET=your_meta_app_secret
   META_CONFIG_ID=your_meta_config_id
   WEBHOOK_VERIFY_TOKEN=my_secure_verify_token
   
   # Gemini AI API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Firebase Cloud Database Setup
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

6. **Start the server with PM2**:
   ```bash
   pm2 start server/server.js --name "spark-ai"
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx Reverse Proxy**:
   Point your domain (e.g., `app.yourdomain.com`) to forward traffic to `http://localhost:3001`.

---

### Option B: Using Hostinger Shared / Cloud Node.js Hosting (hPanel)
If you are using Hostinger Shared or Cloud Node.js hosting:

1. **Upload Files**:
   Compress your `dist/`, `server/`, `package.json`, and `package-lock.json` files into a `.zip` file. Upload and extract it to the root of your Hostinger domain directory (e.g., `/home/username/public_html`) using the File Manager.

2. **Configure Node.js App in Hostinger hPanel**:
   - Go to **Node.js** under the Advanced menu in hPanel.
   - Click **Create App**.
   - Set the **Source Directory** to `/public_html`.
   - Set the **App URL** to your domain (or subdomain).
   - Set the **Startup File** to `server/server.js`.
   - Click **Save**.

3. **Install Node modules**:
   In the Hostinger hPanel Node.js dashboard, click the **NPM Install** button.

4. **Add Environment Variables**:
   Under the Environment Variables section in Hostinger Node.js dashboard, add the following key-value pairs (matching your Firebase and Meta setup):
   - `PORT`: `3001` (or the port Hostinger assigns)
   - `FIREBASE_PROJECT_ID`: `your-project-id`
   - `FIREBASE_CLIENT_EMAIL`: `your-client-email`
   - `FIREBASE_PRIVATE_KEY`: `your-private-key` (replace newline `\n` characters)
   - `META_APP_ID`: `your-app-id`
   - `META_APP_SECRET`: `your-app-secret`
   - `GEMINI_API_KEY`: `your-gemini-key`
   - `WEBHOOK_VERIFY_TOKEN`: `my_secure_verify_token`

5. **Start / Restart App**:
   Click **Run script** or **Restart** on your Hostinger Node.js dashboard.

---

## Step 3: Firebase Service Account JSON File Option
If you prefer not to paste long private keys into Hostinger's environment variables:

1. Go to your **Firebase Console** -> **Project Settings** -> **Service Accounts**.
2. Click **Generate New Private Key** to download the `.json` service account key.
3. Rename the file to `serviceAccountKey.json`.
4. Upload it directly inside the `server/` directory on Hostinger (`/home/username/public_html/server/serviceAccountKey.json` or `/var/www/infokart/server/serviceAccountKey.json`).
5. The application will automatically detect this file and connect to Firebase Firestore!

---

## Step 4: Map Webhook Callback URL in Meta Developer Console
Once the site is live on Hostinger (e.g., `https://yourdomain.com`), update your WhatsApp Webhook settings in the Meta Developer Console:
- **Callback URL**: `https://yourdomain.com/webhook`
- **Verify Token**: `my_secure_verify_token` (must match `WEBHOOK_VERIFY_TOKEN` in settings)
- **Webhook Fields to Subscribe**: `messages`
