# Web3Forms Setup Instructions

Your contact form is now ready! Follow these simple steps to activate it:

## Step 1: Get Your Free Access Key

1. Go to https://web3forms.com
2. Enter your email: **moddonthemix@gmail.com**
3. Click "Create Access Key"
4. Check your email for the access key (it's a long string like: `abc123-def456-ghi789`)

## Step 2: Add the Access Key to Your Code

1. Open `src/App.js`
2. Find line ~537 (search for `YOUR_ACCESS_KEY_HERE`)
3. Replace `YOUR_ACCESS_KEY_HERE` with your actual access key from Web3Forms

Example:
```javascript
// Before:
access_key: 'YOUR_ACCESS_KEY_HERE',

// After:
access_key: 'abc123-def456-ghi789', // Your actual key
```

## Step 3: Deploy

Once you add the key, commit and deploy your changes. That's it!

## How It Works

- Contact form submissions will be sent directly to: **moddonthemix@gmail.com**
- **100% Free** - unlimited form submissions
- No account needed to start
- Emails arrive instantly
- Includes spam protection

## What the User Sees

When someone fills out the contact form:
1. They enter their name, email, phone (optional), and message
2. Click "Send Message"
3. See a success confirmation
4. You receive an email with all their details

Perfect for booking inquiries, questions, and collaboration requests!
