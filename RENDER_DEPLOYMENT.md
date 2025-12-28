# Deploy STEEFE ERP to Render

Complete guide to deploy your full-stack ERP application on Render (Frontend + Backend + Database).

## Prerequisites

- GitHub account
- Render account (free - sign up at https://render.com)
- Your code pushed to a GitHub repository

## Step 1: Push to GitHub

```powershell
# Initialize git (if not already)
cd "d:\STEEFE ERP"
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/steefe-erp.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

### Option A: Using Blueprint (Automated - Recommended)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and set up:
   - PostgreSQL database
   - Web service with Node.js
   - Environment variables
5. Click **"Apply"** and wait 5-10 minutes

### Option B: Manual Setup

#### 2.1 Create PostgreSQL Database

1. Dashboard → **"New +"** → **"PostgreSQL"**
2. Name: `steefe-erp-db`
3. Database: `steefe_erp_db`
4. User: `steefe_erp_user`
5. Region: Choose closest to your users
6. Plan: **Free** (or paid for production)
7. Click **"Create Database"**
8. **Save the connection details** (Internal/External Database URL)

#### 2.2 Create Web Service

1. Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `steefe-erp`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Runtime:** Node
   - **Build Command:** 
     ```
     npm install && cd frontend && npm install && npm run build && cd .. && ls -la frontend/dist
     ```
   - **Start Command:** 
     ```
     npm start
     ```
   - **Plan:** Free (or paid)

#### 2.3 Environment Variables

In the web service, add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (auto-set by Render) |
| `DATABASE_URL` | Copy from PostgreSQL service (Internal URL) |
| `JWT_SECRET` | Generate random string (32+ chars) |
| `SESSION_SECRET` | Generate random string (32+ chars) |

**To generate secrets:**
```powershell
# In PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### 2.4 Initialize Database

After deployment:

1. Go to your web service → **"Shell"** tab
2. Run database initialization:
```bash
node scripts/initDatabase.js
node scripts/seedDefaultData.js
```

## Step 3: Access Your Application

- Your app will be live at: `https://steefe-erp.onrender.com`
- Login with default credentials (from your seed data)

## Step 4: Configure Frontend API URL (If Needed)

If your frontend has hardcoded API URLs, update them:

**File:** `frontend/src/config.js` or similar
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://steefe-erp.onrender.com/api'
  : 'http://localhost:3000/api';
```

## Important Notes

### Free Tier Limitations
- **Spins down after 15 minutes of inactivity**
- First request after inactivity takes ~30-60 seconds (cold start)
- 750 hours/month free
- PostgreSQL: 90 days retention, 1GB storage

### Upgrade to Paid ($7/month per service)
- No cold starts
- Persistent connections
- Better performance
- Longer database retention

## Troubleshooting

### Build Fails
```bash
# Check build logs in Render dashboard
# Common issues:
# - Missing dependencies → Check package.json
# - Frontend build errors → Test locally: cd frontend && npm run build
```

### Database Connection Issues
```bash
# Verify DATABASE_URL is set correctly
# Use Internal Database URL (faster within Render network)
```

### Application Not Loading
```bash
# Check logs in Render dashboard
# Verify server starts on PORT environment variable
# Check server.js uses: process.env.PORT
```

## Monitoring

- **Logs:** Render Dashboard → Your Service → Logs tab
- **Metrics:** Dashboard shows CPU, Memory, Request count
- **Health Check:** `https://steefe-erp.onrender.com/health`

## Custom Domain (Optional)

1. In your web service → **"Settings"** → **"Custom Domain"**
2. Add your domain (e.g., `erp.yourcompany.com`)
3. Update DNS records as instructed
4. Free SSL certificate auto-generated

## Automatic Deployments

- Every push to `main` branch triggers auto-deployment
- Takes 2-5 minutes per deployment
- Previous version keeps running until new one is ready (zero downtime)

## Database Backups

**Free tier:** No automatic backups

**Recommended:**
- Upgrade to paid plan for daily backups
- Or use manual backup script:
```bash
# In Render Shell
pg_dump $DATABASE_URL > backup.sql
```

## Cost Summary

**Free Tier (Development):**
- Web Service: Free
- PostgreSQL: Free
- **Total:** $0/month

**Production (Recommended):**
- Web Service: $7/month
- PostgreSQL: $7/month
- **Total:** $14/month

## Next Steps

1. ✅ Deploy to Render
2. ✅ Initialize database
3. ✅ Test all features
4. 📱 Share URL with users
5. 📈 Monitor performance
6. 💾 Set up backups (paid plan)
7. 🌐 Add custom domain (optional)

## Support

- Render Docs: https://render.com/docs
- Community: https://community.render.com
- Status Page: https://status.render.com

---

**Your app is now live and accessible from anywhere! 🚀**
