# Music Submission Platform - @Moddonthemix

A modern music submission platform for live reviews and professional mixing services.

## ✨ Features

- 🎵 Music submission with drag & drop file upload
- 👑 4-tier priority system (Free, Priority $5, Premium $10, King $25)
- 💰 Cash App payment integration
- 🎛️ Mix & Master services ($60 private, $100 live stream)
- 📊 Admin dashboard with drag-and-drop queue management
- 📱 Fully responsive design
- 🔒 Password-protected admin panel
- ⚡ Built with React and Tailwind CSS

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your settings:
```bash
REACT_APP_ADMIN_PASSWORD=your_password
REACT_APP_CASHAPP_USERNAME=moddonthemix
```

## 🔐 Admin Access

- **Default Password**: `producertour` (change in `.env`)
- **Access**: Click "Admin" link at bottom of homepage
- **Features**:
  - View all submissions
  - Filter by type and priority
  - Drag & drop to reorder queue
  - Update submission status
  - Download submitted tracks

## 🌐 Deploying to Bluehost

### Quick Deployment (3 steps)

1. **Update production settings:**
   ```bash
   # Edit .env.production with your production password
   nano .env.production
   ```

2. **Build your app:**
   ```bash
   ./deploy-to-bluehost.sh
   ```

3. **Upload to Bluehost:**
   - Log in to Bluehost cPanel
   - Go to File Manager → public_html
   - Upload all files from the `build/` folder
   - Upload `.htaccess` from project root

📖 **Detailed instructions**: See [BLUEHOST_DEPLOYMENT.md](BLUEHOST_DEPLOYMENT.md)

## 📁 Project Structure

```
MUSIC SUBMISSION AND MIX/
├── public/              # Static files
├── src/
│   ├── App.js          # Main component
│   ├── App.css         # Styles
│   └── index.js        # Entry point
├── .env                # Local environment variables
├── .env.production     # Production environment variables
├── .htaccess           # Apache configuration for hosting
├── package.json        # Dependencies
└── tailwind.config.js  # Tailwind CSS config
```

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: localStorage (upgrade to backend recommended)
- **Build Tool**: Create React App

## 📋 Available Scripts

```bash
npm start       # Start development server
npm run build   # Build for production
npm test        # Run tests
```

## ⚠️ Important Notes

### Current Limitations
- Uses localStorage (5-10MB browser limit)
- Manual payment confirmation
- No backend database
- Client-side only authentication

### Recommended Upgrades
See [SETUP.md](SETUP.md) for production upgrade recommendations:
- Backend API (Node.js, Firebase, Supabase)
- Cloud file storage (AWS S3, Cloudinary)
- Real payment processing (Stripe)
- Proper authentication (JWT, Firebase Auth)

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup guide and production recommendations
- **[BLUEHOST_DEPLOYMENT.md](BLUEHOST_DEPLOYMENT.md)** - Detailed Bluehost deployment guide
- **[deploy-to-bluehost.sh](deploy-to-bluehost.sh)** - Automated deployment helper script

## 🔧 Troubleshooting

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Working
- Ensure variables start with `REACT_APP_`
- Restart dev server after changing `.env`
- Rebuild for production after changing `.env.production`

### Admin Password Not Working
- Check `.env` file exists and has correct format
- Verify no extra spaces in the password
- Rebuild if deployed to production

## 📝 License

Private and proprietary.

## 👤 Contact

**@Moddonthemix** on TikTok
- Live music reviews and mixing sessions
- Submit your tracks at: [Your Domain]