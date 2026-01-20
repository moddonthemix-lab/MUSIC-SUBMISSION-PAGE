# Deploying to GitHub Pages with Custom Domain

## Overview

Since you have a domain with Bluehost but no web hosting, we'll:
1. Host your app on **GitHub Pages** (FREE)
2. Point your Bluehost domain to GitHub Pages
3. Enable HTTPS automatically

This is actually the BEST setup for a React app like this!

---

## Step 1: Prepare Your App for GitHub Pages

### 1.1 Update package.json

Add your domain to `package.json`:

```json
{
  "name": "music-submission-platform",
  "version": "1.0.0",
  "homepage": "https://yourdomain.com",
  ...
}
```

Replace `yourdomain.com` with your actual domain.

### 1.2 Install gh-pages package

```bash
npm install --save-dev gh-pages
```

### 1.3 Add deployment scripts to package.json

Add these scripts:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

---

## Step 2: Set Up GitHub Repository

### 2.1 Create CNAME file

Create a file at `public/CNAME` (no extension) with your domain:

```
yourdomain.com
```

**Important**: Just the domain, no `https://` or trailing slash!

### 2.2 Update .env.production

Make sure your production settings are correct:

```bash
REACT_APP_ADMIN_PASSWORD=your_secure_production_password
REACT_APP_CASHAPP_USERNAME=moddonthemix
```

### 2.3 Commit and push

```bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git push origin main
```

---

## Step 3: Deploy to GitHub Pages

### 3.1 Run the deployment command

```bash
npm run deploy
```

This will:
- Build your app with production settings
- Create a `gh-pages` branch
- Push the built app to GitHub

### 3.2 Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

You'll see a message like: "Your site is ready to be published at `https://username.github.io/repo-name/`"

---

## Step 4: Configure Your Bluehost Domain

### 4.1 Log in to Bluehost

1. Log in to your Bluehost account
2. Go to **"Domains"** or **"DNS Management"**

### 4.2 Update DNS Records

You need to add these DNS records:

**For root domain (yourdomain.com):**

Add these 4 **A Records**:
```
Type: A
Host: @
Points to: 185.199.108.153
TTL: 14400

Type: A
Host: @
Points to: 185.199.109.153
TTL: 14400

Type: A
Host: @
Points to: 185.199.110.153
TTL: 14400

Type: A
Host: @
Points to: 185.199.111.153
TTL: 14400
```

**For www subdomain (www.yourdomain.com):**

Add this **CNAME Record**:
```
Type: CNAME
Host: www
Points to: yourusername.github.io
TTL: 14400
```

Replace `yourusername` with your GitHub username.

### 4.3 Wait for DNS Propagation

DNS changes can take 1-48 hours (usually 1-4 hours) to propagate globally.

Check status at: https://www.whatsmydns.net/

---

## Step 5: Configure Custom Domain in GitHub

### 5.1 Add Custom Domain

1. Go to your GitHub repository
2. **Settings** → **Pages**
3. Under "Custom domain", enter: `yourdomain.com`
4. Click **Save**

### 5.2 Enable HTTPS

After DNS propagates:
1. GitHub will verify your domain (check mark appears)
2. Check **"Enforce HTTPS"**
3. GitHub automatically provides free SSL certificate!

---

## Step 6: Test Your Deployment

Visit your domain:
- `https://yourdomain.com` ✅
- `https://www.yourdomain.com` ✅

Test:
- ✅ Home page loads
- ✅ Submit form works
- ✅ Admin login works
- ✅ Refresh page (shouldn't 404)
- ✅ HTTPS lock icon appears

---

## Updating Your Site

When you make changes:

```bash
# Make your changes
# Test locally with: npm start

# Update .env.production if needed
# Then deploy:
npm run deploy
```

Changes go live in ~1 minute! 🚀

---

## Alternative: Using Vercel or Netlify

These are even easier than GitHub Pages:

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Add your custom domain in Vercel dashboard
```

Vercel automatically:
- Sets up SSL
- Provides DNS instructions
- Deploys on every git push
- Has environment variable dashboard

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Add your custom domain in Netlify dashboard
```

Both have **better features** than GitHub Pages:
- Automatic deployments from GitHub
- Environment variable dashboard (no rebuild needed)
- Better build caching
- Form handling
- Serverless functions

---

## DNS Configuration Summary

### Bluehost DNS Records Needed

| Type | Host | Points To | TTL |
|------|------|-----------|-----|
| A | @ | 185.199.108.153 | 14400 |
| A | @ | 185.199.109.153 | 14400 |
| A | @ | 185.199.110.153 | 14400 |
| A | @ | 185.199.111.153 | 14400 |
| CNAME | www | yourusername.github.io | 14400 |

**Replace `yourusername` with your GitHub username!**

---

## Troubleshooting

### Issue: "Domain is already taken" on GitHub

**Solution**: Another repository is using this domain. Remove it from the other repo first.

### Issue: HTTPS option is grayed out

**Solution**:
1. Wait for DNS to propagate (check whatsmydns.net)
2. Make sure CNAME file exists in `public/CNAME`
3. Try removing and re-adding the custom domain in GitHub

### Issue: 404 on page refresh

**Solution**: GitHub Pages handles this automatically for SPAs. If still happening, make sure you deployed the build folder correctly.

### Issue: Environment variables not working

**Solution**:
1. Update `.env.production`
2. Rebuild and redeploy: `npm run deploy`
3. Remember: env vars are baked into the build!

### Issue: Site shows old version

**Solution**:
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check GitHub Pages deploy status in repository Actions tab

---

## Cost

**Hosting**: FREE (GitHub Pages)
**Domain**: Whatever you're paying Bluehost (usually ~$15/year)
**SSL Certificate**: FREE (GitHub provides)
**Bandwidth**: Unlimited (within GitHub's fair use)

---

## Advantages of This Setup

✅ **Free hosting**
✅ **Free SSL/HTTPS**
✅ **Fast CDN** (GitHub's global network)
✅ **Simple deployment** (one command)
✅ **Git-based** (version control built-in)
✅ **No server management**
✅ **Automatic static optimization**

---

## Quick Start Checklist

- [ ] Update `homepage` in package.json with your domain
- [ ] Install gh-pages: `npm install --save-dev gh-pages`
- [ ] Add deploy scripts to package.json
- [ ] Create `public/CNAME` file with your domain
- [ ] Update `.env.production` with production password
- [ ] Run `npm run deploy`
- [ ] Enable GitHub Pages in repository settings
- [ ] Configure DNS records in Bluehost
- [ ] Add custom domain in GitHub Pages settings
- [ ] Wait for DNS propagation
- [ ] Enable HTTPS in GitHub Pages
- [ ] Test your site!

---

## Need Help?

- **DNS not propagating?** Use https://www.whatsmydns.net/ to check
- **GitHub Pages not working?** Check the Actions tab for build errors
- **Still stuck?** GitHub Pages docs: https://docs.github.com/en/pages

---

## Recommended: Use Vercel Instead

For an even better experience, use Vercel (still free):

**Advantages:**
- Environment variables in dashboard (no rebuild needed)
- Automatic deployments on git push
- Better build logs and preview deployments
- Easier domain setup

Want me to help you set up Vercel instead?
