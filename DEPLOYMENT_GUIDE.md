# 🚀 Deployment Guide for Production (Render + Vercel)

## Issue: Works Locally But Fails in Production

### Root Causes:
1. **SQLite on Render** - Ephemeral filesystem loses data on restart
2. **Missing Environment Variables** - .env file is not deployed
3. **CORS Configuration** - Production URLs not whitelisted
4. **Email Service** - SMTP ports may be blocked

---

## 📋 Step-by-Step Production Setup

### **Part 1: Render.com Backend Setup**

#### 1.1 Set Environment Variables on Render Dashboard

Go to your Render service → **Environment** tab and add these variables:

```
NODE_ENV=production
JWT_SECRET=9a6f4bd18dd41dfc98d7e8f40e6723496c3e8c5a847fbd769d179e9d238b5f97e2bb7f0c2df17f6b1dcb8ad1c1ff3f5b72b3d3ab5e478f9a5a5b35ad5ac36f24
ENCRYPTION_SECRET=d653ad2a4f871e8602254d634a4404ede2b167fbae24e84671557b8a80b5ef97
PORT=5000
EMAIL=akankshasrivastava9415@gmail.com
EMAIL_PASSWORD=fhnznkagrgpzkomo
GITHUB_CLIENT_ID=Ov23li3gVA0N7dSBOttk
GITHUB_CLIENT_SECRET=51a83a26ecca131c29a4eb5891961f0ad2934cc2
GITHUB_CALLBACK_URL=https://tech-time-nexus.onrender.com/api/auth/github/callback
CLIENT_URL=https://tech-time-nexus-nh2b.vercel.app
FRONTEND_URL=https://tech-time-nexus-nh2b.vercel.app
SESSION_SECRET=your-strong-session-secret-here
```

⚠️ **IMPORTANT:** 
- Copy `EMAIL_PASSWORD` WITHOUT spaces: `fhnznkagrgpzkomo`
- Replace `your-strong-session-secret-here` with a random 32+ character string

#### 1.2 Configure Render Service Settings

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free or Starter
- **Environment**: Node

#### 1.3 Enable Persistent Disk (Important!)

⚠️ **WARNING:** Render Free tier has ephemeral storage. Your database will be deleted on every restart!

**Solutions:**

**Option A: Use Render Disk (Paid - $1/month)**
1. Go to your Render service → **Disks** tab
2. Click **Add Disk**
3. Mount Path: `/opt/render/project/src/data`
4. Size: 1 GB (minimum)
5. Then set this env var: `DATABASE_URL=/opt/render/project/src/data/db.sqlite`

**Option B: Use External Database (Recommended)**
Use a free PostgreSQL database:
1. Create free Postgres on Render or Railway/Supabase
2. Install `pg` package: Add to package.json dependencies
3. Update database connection to use PostgreSQL instead of SQLite

**Option C: Accept Data Loss (Not Recommended)**
- Data will be lost on every restart
- Use only for testing

---

### **Part 2: Vercel Frontend Setup**

#### 2.1 Set Environment Variables on Vercel

Go to your Vercel project → **Settings** → **Environment Variables**:

```
REACT_APP_BACKEND_URL=https://tech-time-nexus.onrender.com
```

#### 2.2 Update CORS in Backend

Your backend `app.js` already includes:
```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "https://time-jar-running-mail.vercel.app",
];
```

✅ Make sure this matches your actual Vercel URL. Update if needed:
```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "https://tech-time-nexus-nh2b.vercel.app",
];
```

---

### **Part 3: Fix Email Issues in Production**

#### 3.1 Gmail App Password Already Fixed ✅
Your `.env` now has: `EMAIL_PASSWORD=fhnznkagrgpzkomo` (no spaces)

#### 3.2 Test Email on Render

After deploying, check Render logs for:
```
✅ Email server is ready to send emails
```

If you see `❌ EMAIL CONFIG ERROR`, the env vars aren't set correctly on Render.

#### 3.3 Alternative: Use SendGrid (If Gmail Blocked)

Render might block Gmail SMTP. Use SendGrid instead (free 100 emails/day):

1. Sign up: https://sendgrid.com/
2. Get API key
3. Update `backend/utils/sendEmail.js`:

```javascript
const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  // Use SendGrid in production
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const sendEmail = async ({ to, subject, text }) => {
    const msg = {
      to,
      from: process.env.EMAIL,
      subject,
      text,
    };
    return sgMail.send(msg);
  };
  module.exports = sendEmail;
} else {
  // Use Gmail locally
  // ... existing Gmail code ...
}
```

4. Add to Render env vars: `SENDGRID_API_KEY=your_api_key`

---

### **Part 4: Debugging Production Issues**

#### 4.1 Check Render Logs
1. Go to Render dashboard → Your service → **Logs** tab
2. Look for startup messages:
   ```
   ✅ Connected to SQLite database at: /opt/render/project/src/data/db.sqlite
   ✅ Capsules table ready
   ✅ Users table ready
   📋 Database columns: id, userId, title, message, ...
   ✅ Email server is ready to send emails
   Server running on port 5000
   ```

#### 4.2 Common Production Errors

**Error: "Database locked"**
- Solution: SQLite doesn't handle concurrent writes well. Use PostgreSQL for production.

**Error: "Email sending failed: ECONNECTION"**
- Solution: SMTP ports blocked. Use SendGrid or Mailgun.

**Error: "Cannot find module"**
- Solution: Run `npm install` in Render build command.

**Error: "Capsules disappear after restart"**
- Solution: Add persistent disk or use PostgreSQL.

---

### **Part 5: Deploy Changes**

#### 5.1 Commit and Push
```bash
git add .
git commit -m "Fix production deployment: persistent database and email"
git push origin master
```

#### 5.2 Verify Deployment

**Backend (Render):**
- Check logs for ✅ success messages
- Visit: `https://tech-time-nexus.onrender.com/api/capsule/mine` (should return 401 if not logged in)

**Frontend (Vercel):**
- Vercel auto-deploys on push
- Visit your Vercel URL and test login/create capsule

---

## ✅ Verification Checklist

After deployment, test:

- [ ] Backend logs show all ✅ success messages
- [ ] Login works on production
- [ ] Create capsule works
- [ ] Capsules persist after page refresh
- [ ] Email received when creating capsule
- [ ] Capsules with past dates unlock automatically
- [ ] Email received when capsule unlocks

---

## 🆘 Still Having Issues?

### Check Logs Location:
- **Render Backend Logs**: Render Dashboard → Your Service → Logs tab
- **Vercel Frontend Logs**: Vercel Dashboard → Your Project → Deployments → Click deployment → View Function Logs
- **Browser Console**: F12 → Console tab (for frontend errors)

### Share These for Help:
1. Full Render startup logs (first 50 lines after deploy)
2. Error message from Render logs when creating capsule
3. Browser console errors (F12 → Console)
4. Environment variables list on Render (hide sensitive values)

---

## 📌 Quick Fix Commands

If database is corrupted:
```bash
# On Render, redeploy to recreate database
# Or connect via SSH and run:
rm -f /opt/render/project/src/data/db.sqlite
npm start
```

Test email locally:
```bash
cd backend
node -e "require('dotenv').config(); const sendEmail = require('./utils/sendEmail'); sendEmail({to:'your-email@gmail.com', subject:'Test', text:'Test email'}).then(() => console.log('Sent')).catch(console.error);"
```

---

## 🔄 Next Steps

1. Set all environment variables on Render ✅
2. Enable persistent disk OR migrate to PostgreSQL
3. Push code changes to trigger redeploy
4. Check Render logs for startup errors
5. Test capsule creation and email on production

Good luck! 🚀
