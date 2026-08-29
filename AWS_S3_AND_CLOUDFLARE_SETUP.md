# AWS S3 Storage & Cloudflare Pages Production Deployment Guide

This guide provides the exact steps to connect your AWS S3 bucket for media storage and deploy your frontend to Cloudflare Pages.

---

## Part 1: AWS S3 Bucket Setup (Storage Provider)

### Step 1: Create an AWS S3 Bucket
1. Sign in to the [AWS Management Console](https://aws.amazon.com/console/) and search for **S3**.
2. Click **Create bucket**.
3. Set **Bucket name**: e.g., `college-ecap-media-storage` (Must be globally unique).
4. Select **AWS Region**: e.g., `ap-south-1` (Asia Pacific - Mumbai) for fast speeds in India.
5. Under **Block Public Access settings for this bucket**:
### Step 1: Turn Off "Block Public Access"
Before saving a public bucket policy, AWS requires you to turn off Block Public Access for this bucket:
1. Go to your `college-ecap-media` bucket -> Click the **Permissions** tab.
2. Under **Block public access (bucket settings)** -> Click **Edit**.
3. **Uncheck** "Block *all* public access".
4. Click **Save changes** (AWS will ask you to type `confirm` in a box to confirm).

---

### Step 2: Set Bucket Policy & CORS

#### A. Bucket Policy (For "Edit bucket policy" page shown in your screenshot)
1. In the **Edit bucket policy** page, paste this exact JSON:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::college-ecap-media/*"
        }
    ]
}
```
2. Click **Save changes**.

---

#### B. Cross-origin Resource Sharing (CORS) Configuration
1. Go back to the **Permissions** tab of your `college-ecap-media` bucket.
2. Scroll down to the bottom section called **Cross-origin resource sharing (CORS)** -> Click **Edit**.
3. Paste this exact CORS JSON:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```
4. Click **Save changes**.

### Step 3: Create an IAM User for Access Keys
1. Go to AWS **IAM Console** -> **Users** -> **Add users**.
2. Name: `ecap-backend-user`.
3. Select **Attach policies directly** -> Search for `AmazonS3FullAccess` and select it.
4. Complete user creation -> Click on the user -> Go to **Security credentials** tab.
5. Click **Create access key** -> Choose **Application running outside AWS** -> Create.
6. Copy your **Access key ID** and **Secret access key**.

### Step 4: Configure Backend Environment Variables
In your `backend/.env` file (or Render / deployment environment variables):
```env
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=college-ecap-media-storage
```

---

## Part 2: Cloudflare Pages Setup (Frontend Hosting)

### Step 1: Push Frontend to GitHub
Ensure your latest code is committed and pushed to your GitHub repository.

### Step 2: Create a Cloudflare Pages Project
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Click the blue **Create application** button on the **Workers & Pages** screen.
3. At the bottom of the card on the screen, click **Get started** next to **"Looking to deploy Pages?"** (or click **Continue with GitHub**).
4. Authorize your GitHub account and select your `ECAP-ERP` (or `ECAP_Authentication`) repository.

### Step 3: Configure Build Settings
* **Project name**: `college-ecap` (or your preferred name)
* **Production branch**: `main` (or `master`)
* **Framework preset**: **`Create React App`** (or **`React Static`**)
* **Root directory**: `frontend`
* **Build command**: `npm run build`
* **Build output directory**: `build`

### Step 4: Add Environment Variables in Cloudflare Pages
Under **Environment Variables (Advanced)**:
* `REACT_APP_API_URL` = `https://your-backend-api.onrender.com` (or your production API URL).
* `REACT_APP_GOOGLE_CLIENT_ID` = `your-google-client-id.apps.googleusercontent.com`
* `NODE_VERSION` = `20`
* `CI` = `false` *(Critical: Prevents ESLint warnings from failing the build)*

Click **Save and Deploy**. Cloudflare will build your React application and give you a global URL (`https://college-ecap.pages.dev`).

### Step 5: (Optional) Add Custom College Domain
1. In Cloudflare Pages, go to **Custom domains** tab -> Click **Set up a custom domain**.
2. Enter your college subdomain (e.g., `ecap.yourcollege.edu.in` or `ecap-portal.com`).
3. Cloudflare will automatically route your custom domain and issue a free SSL certificate!

---

## Technical Features Implemented in Codebase

1. **Dual Storage Engine (`multer.middleware.js`)**:
   - Automatically detects if `AWS_S3_BUCKET_NAME` is configured.
   - Streams uploads directly to AWS S3 into organized folders (`college-cms/materials`, `college-cms/profiles`, etc.).
   - Sets `req.file.path` to the public AWS S3 URL, maintaining full backward compatibility with all existing controllers.
   - Retains Cloudinary as an automated fallback if AWS S3 environment variables are not supplied.

2. **AWS S3 Helper Module (`utils/s3.js` & `config/s3.config.js`)**:
   - Uses official AWS SDK v3 (`@aws-sdk/client-s3`).
   - Supports bucket upload, object deletion, and signed URL generation.

3. **Cloudflare Pages SPA Routing (`frontend/public/_redirects` & `_headers`)**:
   - Includes `/* /index.html 200` to prevent HTTP 404 errors on page refresh for React Router.
   - Includes production caching and security headers (`X-Frame-Options`, `X-Content-Type-Options`).
