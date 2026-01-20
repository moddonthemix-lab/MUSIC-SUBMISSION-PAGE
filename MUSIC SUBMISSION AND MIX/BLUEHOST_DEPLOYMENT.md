# Deploying to Bluehost

## Prerequisites
- Bluehost account with cPanel access
- Domain name configured in Bluehost

## Method 1: cPanel File Manager (Recommended for Beginners)

### Step 1: Build Your App
On your local machine:
```bash
cd "MUSIC SUBMISSION AND MIX"
npm run build
```

This creates a `build` folder with your production-ready files.

### Step 2: Access Bluehost cPanel
1. Log in to your Bluehost account
2. Click on "Advanced" or "cPanel"
3. Find and click "File Manager"

### Step 3: Prepare Your Domain Directory
1. In File Manager, navigate to your domain's root directory:
   - For main domain: `/public_html/`
   - For subdomain: `/public_html/subdomain_name/`
   - For addon domain: `/public_html/addon_domain/`

2. Delete any default files (index.html, etc.) in that directory

### Step 4: Upload Your Build Files
1. Click "Upload" in the File Manager toolbar
2. Select ALL files from your local `build` folder:
   - `index.html`
   - `asset-manifest.json`
   - `manifest.json`
   - `robots.txt`
   - `static/` folder (with CSS and JS)

3. Wait for upload to complete

### Step 5: Configure .htaccess for React Router
Create a `.htaccess` file in your domain root with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache Control for Performance
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

### Step 6: Set Up Environment Variables (IMPORTANT!)
Since Bluehost doesn't support `.env` files like a Node.js server, you need to:

**Option A: Build with production values**
Before building, create a `.env.production` file:
```bash
REACT_APP_ADMIN_PASSWORD=your_production_password_here
REACT_APP_CASHAPP_USERNAME=moddonthemix
```

Then rebuild:
```bash
npm run build
```

**Option B: Use environment variable substitution**
Build with your values and they'll be baked into the JavaScript bundle.

### Step 7: Test Your Site
Visit your domain (e.g., `https://yourdomain.com`) and test:
- Home page loads
- Submit form works
- Admin login works
- Queue displays properly

---

## Method 2: Using FTP (FileZilla)

### Step 1: Build Your App
```bash
cd "MUSIC SUBMISSION AND MIX"
npm run build
```

### Step 2: Get FTP Credentials
1. Log in to Bluehost
2. Go to cPanel → FTP Accounts
3. Use your main account or create a new FTP account

### Step 3: Connect with FileZilla
1. Download and install FileZilla
2. Connect using:
   - Host: `ftp.yourdomain.com` or your server IP
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21

### Step 4: Upload Files
1. Navigate to `/public_html/` (or your domain's directory)
2. Delete existing files
3. Upload ALL contents from your `build` folder
4. Upload the `.htaccess` file (see Method 1, Step 5)

---

## Method 3: Git Deployment (Advanced)

If you want automatic deployments:

### Step 1: SSH into Bluehost
```bash
ssh username@yourdomain.com
```

### Step 2: Install Node.js (if not available)
Bluehost shared hosting may not have Node.js. Consider upgrading to VPS or using Method 1.

---

## Important Configuration Notes

### 1. Environment Variables
⚠️ **CRITICAL**: React bakes environment variables into the build at compile time!

Create `.env.production`:
```bash
REACT_APP_ADMIN_PASSWORD=your_secure_production_password
REACT_APP_CASHAPP_USERNAME=moddonthemix
```

Then rebuild before deploying:
```bash
npm run build
```

### 2. Custom Domain Configuration
If using a subdomain or subdirectory, update `package.json`:

**For subdirectory** (e.g., yourdomain.com/music-submission):
```json
{
  "homepage": "https://yourdomain.com/music-submission"
}
```

**For subdomain** (e.g., submit.yourdomain.com):
```json
{
  "homepage": "https://submit.yourdomain.com"
}
```

Then rebuild:
```bash
npm run build
```

### 3. SSL/HTTPS Setup
1. In Bluehost cPanel, go to "SSL/TLS Status"
2. Enable free SSL certificate for your domain
3. Force HTTPS by adding to `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Troubleshooting

### Issue: Blank page after deployment
**Solution**: Check browser console for errors. Usually a `homepage` issue in `package.json`.

### Issue: 404 on page refresh
**Solution**: Make sure `.htaccess` file is uploaded and mod_rewrite is enabled.

### Issue: Admin password not working
**Solution**: Rebuild with `.env.production` file containing your password.

### Issue: Files not uploading
**Solution**: Check file permissions. Set directories to 755 and files to 644.

### Issue: Cash App links not working
**Solution**: Verify `REACT_APP_CASHAPP_USERNAME` in your `.env.production` before building.

---

## Quick Deployment Checklist

- [ ] Create `.env.production` with production values
- [ ] Run `npm run build`
- [ ] Delete old files in Bluehost directory
- [ ] Upload ALL files from `build/` folder
- [ ] Create/upload `.htaccess` file
- [ ] Enable SSL certificate
- [ ] Test all features (submit, admin, payments)
- [ ] Clear browser cache and test again

---

## Updating Your Site

When you make changes:

1. Make your code changes locally
2. Test with `npm start`
3. Update `.env.production` if needed
4. Run `npm run build`
5. Upload new files (overwrite old ones)
6. Clear browser cache

---

## Performance Tips

1. **Enable Caching**: Use the `.htaccess` cache rules above
2. **Optimize Images**: Compress any images before uploading
3. **Use CDN**: Consider Cloudflare (free) for better performance
4. **Monitor Storage**: Audio files in localStorage have limits (~5-10MB)

---

## Alternative: Use a Better Host (Optional)

If Bluehost becomes limiting, consider:

1. **Vercel** (Free, best for React apps)
   - Automatic deployments from GitHub
   - Free SSL, CDN included
   - Simple environment variables

2. **Netlify** (Free tier available)
   - Drag-and-drop deployment
   - Continuous deployment from Git
   - Built-in forms (could replace localStorage)

3. **Cloudflare Pages** (Free)
   - Fast global CDN
   - GitHub integration
   - Unlimited bandwidth

These platforms are designed for React apps and require no manual file uploading!

---

## Need Help?

If you encounter issues:
1. Check Bluehost error logs (cPanel → Errors)
2. Check browser console (F12)
3. Verify file permissions (755 for folders, 644 for files)
4. Contact Bluehost support for server-side issues
