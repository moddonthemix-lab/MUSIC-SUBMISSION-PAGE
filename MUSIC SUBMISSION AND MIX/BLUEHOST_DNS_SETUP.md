# Bluehost DNS Setup for moddonthemix.com

## Quick Setup Guide

Your app is hosted on **GitHub Pages** (free) and you'll point **moddonthemix.com** (Bluehost) to it.

---

## Step 1: Deploy to GitHub Pages (One Command!)

```bash
cd "MUSIC SUBMISSION AND MIX"

# Update your production password first
nano .env.production

# Deploy!
./deploy-github-pages.sh
```

Or manually:
```bash
npm install
npm run deploy
```

This creates a `gh-pages` branch with your built app.

---

## Step 2: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source":
   - Branch: **gh-pages**
   - Folder: **/ (root)**
4. Click **Save**

---

## Step 3: Configure DNS in Bluehost

### 3.1 Log in to Bluehost

1. Go to https://my.bluehost.com
2. Log in to your account
3. Click **Domains** in the left sidebar
4. Find **moddonthemix.com** and click **Manage**

### 3.2 Access DNS Settings

Click **DNS** or **Advanced DNS** tab

### 3.3 Add/Update These DNS Records

**Delete any existing A records for @ (root domain)**

Then add these **4 A Records** for the root domain:

```
Type: A
Host: @
Points to: 185.199.108.153
TTL: 14400 (or default)

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

**Add/Update CNAME for www subdomain:**

```
Type: CNAME
Host: www
Points to: moddonthemix-lab.github.io
TTL: 14400
```

**Note**: Replace `moddonthemix-lab` with your actual GitHub username if different!

### DNS Records Summary Table

| Type | Host | Points To | TTL |
|------|------|-----------|-----|
| A | @ | 185.199.108.153 | 14400 |
| A | @ | 185.199.109.153 | 14400 |
| A | @ | 185.199.110.153 | 14400 |
| A | @ | 185.199.111.153 | 14400 |
| CNAME | www | moddonthemix-lab.github.io | 14400 |

---

## Step 4: Add Custom Domain in GitHub

1. Go to GitHub repository **Settings** → **Pages**
2. Under "Custom domain", enter: **moddonthemix.com**
3. Click **Save**
4. Wait for DNS check to pass (green checkmark)
5. Check **"Enforce HTTPS"** (appears after DNS propagates)

---

## Step 5: Wait for DNS Propagation

DNS changes take **1-4 hours** (sometimes up to 48 hours).

Check propagation status:
- https://www.whatsmydns.net/#A/moddonthemix.com
- Should show the 4 GitHub IP addresses globally

---

## Step 6: Test Your Site

After DNS propagates, visit:
- ✅ https://moddonthemix.com
- ✅ https://www.moddonthemix.com

Both should work and redirect to HTTPS!

Test features:
- ✅ Home page loads
- ✅ Submit form works
- ✅ Admin login works
- ✅ Refresh page (no 404)
- ✅ Cash App payment links work

---

## Updating Your Site

When you make changes:

```bash
# Make your code changes
# Test locally: npm start

# Update .env.production if needed

# Deploy (one command!)
./deploy-github-pages.sh
```

Changes are live in ~1 minute! 🚀

---

## Troubleshooting

### Issue: DNS not propagating

**Check:**
- Wait at least 2-4 hours
- Use https://www.whatsmydns.net to check status
- Make sure you added ALL 4 A records

### Issue: "Domain already taken" in GitHub

**Solution:**
- Remove the domain from any other GitHub repository first
- Or use a different repository

### Issue: HTTPS option grayed out

**Solution:**
- Wait for DNS to fully propagate
- Remove and re-add the custom domain in GitHub
- Make sure CNAME file exists in `public/CNAME`

### Issue: 404 when visiting site

**Solution:**
- Check GitHub Pages is enabled (Settings → Pages)
- Verify gh-pages branch exists
- Check the Actions tab for deployment errors
- Make sure you ran `npm run deploy`

### Issue: Site loads but shows old content

**Solution:**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Wait a few minutes for GitHub CDN to update
- Check if deployment succeeded in GitHub Actions

### Issue: Environment variables not working

**Solution:**
- Update `.env.production`
- Redeploy: `npm run deploy`
- Remember: env vars are baked into build at compile time!

### Issue: Admin password not working

**Solution:**
- Check `.env.production` has correct password
- No quotes around the password value
- Rebuild and redeploy after changing

---

## DNS Configuration Screenshot Guide

### In Bluehost DNS Manager, you should see:

```
Record Type | Host | Value                    | TTL
------------|------|--------------------------|------
A           | @    | 185.199.108.153         | 14400
A           | @    | 185.199.109.153         | 14400
A           | @    | 185.199.110.153         | 14400
A           | @    | 185.199.111.153         | 14400
CNAME       | www  | moddonthemix-lab.github.io | 14400
```

**Important**:
- Delete any OLD A records pointing to Bluehost IPs (like 192.168.x.x)
- Keep any MX records (email)
- Keep any TXT records (verification)

---

## Cost Breakdown

| Item | Cost |
|------|------|
| GitHub Pages Hosting | **FREE** |
| SSL Certificate | **FREE** (GitHub provides) |
| CDN & Bandwidth | **FREE** (unlimited) |
| Domain (moddonthemix.com) | ~$15/year (Bluehost) |
| **Total Monthly** | **$0** 🎉 |

---

## Features You Get

✅ **Free hosting** - No server costs
✅ **Free SSL/HTTPS** - Secure by default
✅ **Global CDN** - Fast worldwide
✅ **Automatic deployments** - One command to update
✅ **Version control** - Every deployment is tracked in Git
✅ **No downtime** - Zero-downtime deployments

---

## Alternative: Even Easier with Vercel

If you want an even easier setup, use **Vercel** (also free):

```bash
npm install -g vercel
vercel --prod
```

Vercel advantages:
- Automatic DNS setup (just change nameservers)
- Environment variables in dashboard
- Auto-deploy on git push
- Preview deployments for every commit

Want me to help set up Vercel instead?

---

## Quick Reference

**Deploy command:**
```bash
./deploy-github-pages.sh
```

**Manual deploy:**
```bash
npm run deploy
```

**Check DNS:**
```bash
https://www.whatsmydns.net/#A/moddonthemix.com
```

**Your live site:**
```
https://moddonthemix.com
```

**GitHub Pages settings:**
```
Repository → Settings → Pages
```

---

## Need Help?

1. **DNS issues**: Contact Bluehost support
2. **GitHub Pages issues**: Check repository Actions tab
3. **Build errors**: Read the error message carefully
4. **Still stuck**: Review GITHUB_PAGES_DEPLOYMENT.md

---

## Security Checklist

After deployment:

- [ ] HTTPS enforced (check green lock icon)
- [ ] Changed production admin password
- [ ] Tested admin login on live site
- [ ] Verified Cash App links work
- [ ] Tested form submissions
- [ ] Checked mobile responsiveness
- [ ] Cleared browser cache and retested

---

## Success! 🎉

Once DNS propagates:
- Your site is live at **https://moddonthemix.com**
- Free hosting forever
- One-command deployments
- Automatic HTTPS
- Global CDN

Welcome to the modern web! 🚀
