# Supabase Setup Instructions

## ✅ What I've Done

1. ✅ Added Supabase client library to package.json
2. ✅ Created Supabase configuration file (src/supabaseClient.js)
3. ✅ Updated all database operations to use Supabase instead of localStorage
4. ✅ Created SQL schema file (supabase-setup.sql)

## 🔧 What You Need to Do

### Step 1: Create the Database Tables

1. Go to your Supabase project: https://supabase.com/dashboard/project/javnbkmngdkcscsdqttk
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase-setup.sql` into the editor
5. Click **Run** (or press Ctrl/Cmd + Enter)

You should see a success message saying the tables were created.

### Step 2: Install Dependencies

Run this command in your terminal:

```bash
npm install
```

This will install the Supabase client library.

### Step 3: Test It Out

1. Start your development server: `npm start`
2. Try submitting a test song
3. Log in to the admin panel (password: `producertour`)
4. You should see the submission!

## 🎉 What Changed

### Before (localStorage):
- Submissions only visible on YOUR browser
- Each user saw different data
- Data lost when clearing browser cache

### After (Supabase):
- ✅ All submissions go to one cloud database
- ✅ Everyone sees the same data
- ✅ You can see all submissions in admin panel
- ✅ Data persists forever
- ✅ Works across all devices

## 🗄️ Database Schema

**submissions** table:
- id (Primary Key)
- email, artist_name, track_title
- social_handle, priority, mix_notes
- file_name, file_data, file_type, file_link
- submission_type, mix_option
- status (pending/in-progress/completed)
- paid (true/false)
- submitted_at, created_at

**queue_order** table:
- id (Primary Key)
- submission_ids (Array of IDs for drag-and-drop ordering)
- updated_at

## 🔒 Security Note

The current setup allows public read/write access. This is fine for now, but later you can:
- Add authentication
- Restrict write access to authenticated users
- Add admin-only policies for updates/deletes

## 📱 File Storage Limitation

Currently, audio files are stored as base64 in the database. For production, consider:
- Using Supabase Storage for files
- Or using external services like AWS S3, Cloudinary
- This will improve performance and reduce database size

## ❓ Troubleshooting

**Error: "relation submissions does not exist"**
- You haven't run the SQL setup yet. Go to SQL Editor and run supabase-setup.sql

**Error: "permission denied"**
- Check that RLS policies were created properly in the SQL script

**No submissions showing up**
- Check browser console for errors
- Verify the Supabase URL and key in src/supabaseClient.js
- Make sure the tables exist in Supabase

## 🚀 Next Steps

After testing that everything works:
1. Commit and push these changes
2. Deploy to GitHub Pages
3. All submissions will now be stored in Supabase!
