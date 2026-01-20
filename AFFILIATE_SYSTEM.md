# Affiliate / Discount Code System

## ✅ What I've Added

You now have a complete affiliate/discount code system! Users can apply discount codes at checkout, and you can track all submissions per affiliate to calculate referral fees.

## 🔧 Setup Instructions

### Step 1: Run the SQL Setup

1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/javnbkmngdkcscsdqttk/sql
2. Copy the contents of `supabase-affiliate-setup.sql`
3. Paste and click **Run**

This creates:
- **affiliate_codes** table (stores discount codes and affiliate info)
- Adds pricing columns to **submissions** table
- Creates 2 example codes: `PRODUCER15` (15% off) and `NEWARTIST10` (10% off)

### Step 2: Test It Out

1. Go to your site and try submitting a paid tier (Priority, Premium, King, or Mix & Master)
2. Enter discount code: `PRODUCER15`
3. Click "Apply"
4. You'll see: "✓ 15% discount applied! Original: $25 → New price: $21.25"
5. Submit button updates to show discounted price

---

## 💰 How It Works

### For Users:

1. User selects a paid submission tier
2. Discount code field appears
3. User enters affiliate code (e.g., `PRODUCER15`)
4. Clicks "Apply" → system validates code
5. If valid, discount is applied and shown
6. Cash App opens with discounted price
7. Submission stores affiliate code for tracking

### For You (Admin):

You can now:
- Give affiliates unique discount codes
- Track which submissions came from each affiliate
- Calculate referral fees based on sales

---

## 🎯 Managing Affiliate Codes

### Create a New Affiliate Code

Run this SQL in Supabase:

```sql
INSERT INTO affiliate_codes (code, affiliate_name, affiliate_email, discount_percentage)
VALUES ('YOURCODE15', 'Affiliate Name', 'affiliate@email.com', 15);
```

**Fields:**
- `code`: The discount code (uppercase, e.g., `BEATMAKER20`)
- `affiliate_name`: Affiliate's name
- `affiliate_email`: Their email (for contact/payments)
- `discount_percentage`: Discount % (e.g., 15 for 15% off)

### View All Affiliate Codes

```sql
SELECT * FROM affiliate_codes;
```

### Deactivate a Code

```sql
UPDATE affiliate_codes
SET is_active = false
WHERE code = 'OLDCODE15';
```

### Change Discount Percentage

```sql
UPDATE affiliate_codes
SET discount_percentage = 20
WHERE code = 'PRODUCER15';
```

---

## 📊 Tracking Affiliate Sales

### See All Submissions by Affiliate Code

```sql
SELECT
  affiliate_code,
  COUNT(*) as total_submissions,
  SUM(final_price) as total_revenue,
  SUM(discount_amount) as total_discounts
FROM submissions
WHERE affiliate_code IS NOT NULL
GROUP BY affiliate_code
ORDER BY total_revenue DESC;
```

### See Individual Submissions for an Affiliate

```sql
SELECT
  artist_name,
  track_title,
  original_price,
  discount_amount,
  final_price,
  submitted_at
FROM submissions
WHERE affiliate_code = 'PRODUCER15'
ORDER BY submitted_at DESC;
```

### Calculate Referral Fees

Example: Pay affiliates 20% of discounted price

```sql
SELECT
  affiliate_code,
  COUNT(*) as submissions_count,
  SUM(final_price) as total_revenue,
  SUM(final_price * 0.20) as affiliate_payout_20_percent
FROM submissions
WHERE affiliate_code IS NOT NULL
  AND paid = true
GROUP BY affiliate_code;
```

---

## 💡 Example Workflow

### Setting Up an Affiliate:

1. Affiliate wants to promote your service
2. You create a code for them: `DJJOHN15` (15% off)
3. Share the code with them
4. They promote it on social media, streams, etc.

### User Uses the Code:

1. User submits King tier ($25)
2. Enters `DJJOHN15`
3. Sees: "Original: $25 → New price: $21.25"
4. Pays $21.25 via Cash App

### Calculating Payout:

Every month, you run:
```sql
SELECT
  affiliate_code,
  COUNT(*) as sales,
  SUM(final_price) as revenue,
  SUM(final_price * 0.15) as payout_15_percent
FROM submissions
WHERE affiliate_code = 'DJJOHN15'
  AND submitted_at >= '2026-01-01'
  AND submitted_at < '2026-02-01';
```

You see DJ John brought in $200, so you pay them 15% = $30

---

## 🎨 UI Features

### Discount Code Field

- **Only shows for paid submissions** (Priority, Premium, King, Mix & Master)
- **Hidden for free submissions**
- Auto-uppercase input
- Instant validation with "Apply" button
- Shows "Checking..." while validating

### Success Message

When code is applied:
```
✓ 15% discount applied! Original: $25 → New price: $21.25
```

### Submit Button

- Before discount: "Submit & Pay $25"
- After discount: "Submit & Pay $21.25"
- Price updates automatically

---

## 📋 Database Schema

### affiliate_codes Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| code | TEXT | Discount code (unique, uppercase) |
| affiliate_name | TEXT | Affiliate's name |
| affiliate_email | TEXT | Contact email |
| discount_percentage | INTEGER | Discount % (default 15) |
| is_active | BOOLEAN | Whether code is active |
| created_at | TIMESTAMP | When code was created |

### submissions Table (New Columns)

| Column | Type | Description |
|--------|------|-------------|
| affiliate_code | TEXT | Code used (if any) |
| original_price | NUMERIC | Price before discount |
| discount_amount | NUMERIC | Amount discounted |
| final_price | NUMERIC | Final price paid |

---

## 🚀 Advanced Ideas

### Volume Discounts

Create codes with different percentages:
- `FIRST5` - 5% off for new users
- `VIP15` - 15% for returning customers
- `BULK20` - 20% for bulk orders

### Limited Time Codes

```sql
-- Manually deactivate after promotion ends
UPDATE affiliate_codes
SET is_active = false
WHERE code = 'SUMMER20';
```

### Tiered Commissions

Pay affiliates based on performance:
- 0-10 sales: 10% commission
- 11-25 sales: 15% commission
- 26+ sales: 20% commission

Calculate in your query:
```sql
SELECT
  affiliate_code,
  COUNT(*) as sales,
  CASE
    WHEN COUNT(*) <= 10 THEN SUM(final_price * 0.10)
    WHEN COUNT(*) <= 25 THEN SUM(final_price * 0.15)
    ELSE SUM(final_price * 0.20)
  END as commission
FROM submissions
WHERE affiliate_code IS NOT NULL
GROUP BY affiliate_code;
```

---

## ❓ FAQs

**Q: Can users combine multiple codes?**
A: No, only one code per submission currently.

**Q: Do free submissions support codes?**
A: No, discount field only shows for paid tiers.

**Q: Can I give 100% discount codes?**
A: Yes, set `discount_percentage = 100` for free promo codes.

**Q: How do I delete a code?**
A: `DELETE FROM affiliate_codes WHERE code = 'OLDCODE';`

**Q: Can I track clicks on codes?**
A: Not currently - only applied codes are tracked. You'd need to add a separate tracking system.

---

## 🎯 Next Steps

1. Run the SQL setup (`supabase-affiliate-setup.sql`)
2. Test with the example codes (`PRODUCER15`, `NEWARTIST10`)
3. Create codes for your affiliates
4. Track submissions monthly
5. Pay out referral fees based on your agreement

You're all set! 🚀
