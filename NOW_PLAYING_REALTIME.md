# Now Playing & Real-Time Updates

## ✅ New Features Added

### 1. **Now Playing Display**
Shows everyone which song is currently being reviewed live on stream.

### 2. **Real-Time Auto-Refresh**
Admin dashboard automatically updates when new submissions come in - no more manual refresh!

---

## 🔧 Setup Instructions

### Step 1: Run the SQL Setup

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/javnbkmngdkcscsdqttk/sql
2. Copy the contents of `supabase-now-playing-setup.sql`
3. Paste and click **Run**

This creates:
- **settings** table (stores which song is now playing)
- **Realtime replication** for submissions table
- **RLS policies** for read/update access

---

## 🎯 How It Works

### **For Everyone (Public Queue View):**

1. **Click "View Queue" on homepage**
2. **See "Now Playing" section** at the top (if you set one)
   - Shows: Song title, artist name, priority tier
   - Pulsing purple/pink gradient with music icon
3. **Below it**: Top 20 songs in queue

**Visual:**
```
┌─────────────────────────────────┐
│ 🎵 Now Playing                  │
│ Currently being reviewed        │
│                                 │
│ Track: "My Amazing Song"        │
│ by: DJ Smith                    │
│ [King]                          │
└─────────────────────────────────┘

Queue (Top 20):
1. Next Song...
2. Another Song...
```

### **For Admin:**

#### **Set Now Playing (3 ways):**

**Option 1: From Queue Manager**
1. Go to Admin Dashboard
2. See list of top 20 songs
3. Click **"Set Now Playing"** button on any song
4. ✅ That song is now highlighted as "Playing"

**Option 2: From Submissions Table**
1. In the admin submissions table
2. Find the song you're reviewing
3. Click **"Now Playing"** button in Actions column
4. ✅ Now displayed to everyone

**Option 3: From Now Playing Banner**
- See the purple gradient banner at top of admin dashboard
- Click **"Clear"** to remove Now Playing

#### **Now Playing Display (Admin View):**
- Big purple/pink gradient banner at top of dashboard
- Shows: Track title (large), artist, priority, TikTok handle
- Pulsing music icon animation
- "Clear" button to remove

---

## 🔄 Real-Time Auto-Refresh

### **What Updates Automatically:**

✅ **When someone submits a song** → Admin dashboard updates instantly
✅ **When you set "Now Playing"** → Everyone sees it immediately
✅ **When you clear "Now Playing"** → Removed for everyone
✅ **When you change status** → Reflected in real-time
✅ **When you delete a submission** → List updates

### **Technical Details:**

Uses **Supabase Realtime** websocket subscriptions:
- Subscribes to `submissions` table changes
- Subscribes to `settings` table changes (now playing)
- Auto-reloads data when changes detected
- No polling, no manual refresh needed

---

## 📊 User Workflows

### **Typical Stream Workflow:**

1. **Songs come in** → Dashboard auto-updates with new submissions
2. **You start reviewing a song** → Click "Set Now Playing"
3. **Everyone watching sees** "Now Playing: [Song Name]"
4. **You finish the review** → Click "Clear" or set next song as Now Playing
5. **Repeat** for each song in queue

### **Queue Display on Stream:**

You can show the **"View Queue" modal** on stream overlay:
- Opens `www.moddonthemix.com` in OBS browser source
- Click "View Queue" button
- Position/resize the modal
- Viewers see current song + upcoming queue

---

## 🎨 Visual Design

### **Now Playing Banner:**
- **Color**: Purple to pink gradient (matches your brand)
- **Border**: 2px purple glow
- **Icon**: Pulsing music note
- **Size**: Full width, prominent
- **Position**: Top of admin dashboard & top of public queue

### **Buttons:**
- **"Set Now Playing"**: Purple button
- **"Playing"**: Green badge with music icon
- **"Clear"**: Red button

---

## 🔒 Security & Permissions

### **Public Access:**
- ✅ Can view Now Playing
- ✅ Can view queue
- ❌ Cannot set/change Now Playing

### **Admin Access:**
- ✅ Can view Now Playing
- ✅ Can set Now Playing
- ✅ Can clear Now Playing
- ✅ Auto-updates without refresh

---

## 💡 Pro Tips

### **Streaming Tips:**

1. **Show Now Playing on screen** - Use OBS browser source with queue modal
2. **Keep queue visible** - Viewers can see what's coming up
3. **Update as you go** - Click "Set Now Playing" right when you start each song
4. **Clear between breaks** - Remove Now Playing during breaks/intermission

### **Queue Management:**

- Drag and drop still works to reorder queue
- Now Playing doesn't affect queue order
- Can set any song as Now Playing (even if not #1)
- Songs in queue stay in queue when set as Now Playing

### **Multiple Devices:**

- Open admin dashboard on laptop
- Open queue view on tablet/phone
- Both update in real-time
- Control from any device

---

## 🐛 Troubleshooting

**"Now Playing not showing up"**
- Make sure you ran `supabase-now-playing-setup.sql`
- Check Settings table exists in Supabase
- Refresh the page once after running SQL

**"Dashboard not auto-updating"**
- Check browser console for errors
- Make sure Realtime is enabled in Supabase project settings
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**"Can't set Now Playing"**
- Make sure the song is a "Review" type (not Mix & Master)
- Check that submission status is "Pending"
- Try from the Queue Manager instead of submissions table

---

## 🚀 Next Steps

1. **Run the SQL setup** (supabase-now-playing-setup.sql)
2. **Test it out**:
   - Submit a test song
   - Go to admin dashboard
   - Click "Set Now Playing"
   - Open queue in another tab
   - See it appear instantly!
3. **Use it on stream**:
   - Set Now Playing as you review each song
   - Show queue modal on stream overlay
   - Viewers see what's currently playing

---

## 📋 Database Schema

### settings Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Always 1 (single row) |
| now_playing_id | TEXT | Submission ID currently playing |
| updated_at | TIMESTAMP | Last update time |

### Realtime Subscriptions

```javascript
// Submissions changes
supabase
  .channel('submissions-channel')
  .on('postgres_changes', { event: '*', table: 'submissions' }, () => {
    loadSubmissions(); // Auto-reload
  })
  .subscribe();

// Now Playing changes
supabase
  .channel('settings-channel')
  .on('postgres_changes', { event: '*', table: 'settings' }, () => {
    loadNowPlaying(); // Auto-reload
  })
  .subscribe();
```

---

## ✨ Summary

**Before:**
- ❌ Had to manually refresh dashboard to see new submissions
- ❌ No way to show what song is currently playing
- ❌ Viewers couldn't see current song

**After:**
- ✅ Dashboard auto-updates when submissions come in
- ✅ "Now Playing" shows current song to everyone
- ✅ Real-time sync across all devices
- ✅ Better viewer experience on stream

Perfect for live streaming! 🎵🔴
