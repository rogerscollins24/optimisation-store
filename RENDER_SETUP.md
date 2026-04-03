# Render.yaml - Deployment Configuration Reference

This file defines a multi-service deployment for:
- Backend API (FastAPI + Python)
- Frontend (React + Node.js)
- Database (PostgreSQL)

## Environment Variables Setup

### For Backend Service
```
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
CORS_ORIGINS=http://localhost:3000,http://localhost:4173,https://yourfrontend.com
JWT_SECRET=your-secret-key-min-32-chars-required
JWT_ALGORITHM=HS256
```

### For Frontend Service
```
VITE_API_URL=https://optimization-backend.onrender.com
```

### For Database Service
```
POSTGRES_DB=optimization_db
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
```

## Build & Start Commands

### Backend
- **Build**: `cd backend && pip install -r requirements.txt`
- **Start**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Python Version**: 3.11

### Frontend
- **Build**: `cd optimization-front && npm install && npm run build`
- **Start**: `cd optimization-front && npm run preview`
- **Build Output**: `dist` directory

### Database
- **Type**: PostgreSQL (managed service)
- **Plan**: Free tier (can be upgraded)

## Render Deployment URLs

After deployment, your services will be available at:
- Backend: `https://optimization-backend.onrender.com`
- Frontend: `https://optimization-frontend.onrender.com`
- Database: Managed internally by Render

## Important Notes

1. **Auto-Deploy**: Set `autoDeploy: true` to rebuild on git push
2. **Port**: FastAPI automatically uses the `$PORT` environment variable
3. **CORS**: Update CORS_ORIGINS to include your frontend domain
4. **Database Backups**: Configure in Render dashboard for production
5. **Free Tier Limitations**:
   - Services spin down after 15 minutes of inactivity
   - Database limited resources
   - Suitable for development/staging

## Monitoring & Logs

- Backend logs: Render Dashboard → Logs tab
- Frontend build: Check build logs during deployment
- Database: Use pgAdmin or CLI client

## Scaling Guidelines

**To upgrade from free tier:**
1. Backend: Standard plan recommended ($12/month)
2. Frontend: Standard plan recommended ($7/month)
3. Database: Standard plan recommended ($15/month)

## Setting Up on Render

1. Go to [https://render.com](https://render.com)
2. New → Blueprint
3. Connect GitHub repository
4. Select branch (main)
5. Add environment variables
6. Deploy

The system will automatically:
- Install dependencies
- Build services
- Start all three services
- Configure networking
- Set up health checks

## Troubleshooting

### Backend won't start
- Check Python version is 3.11
- Verify requirements.txt installs correctly locally first
- Check logs for import errors

### Frontend won't build
- Ensure npm dependencies resolve
- Check VITE_API_URL environment variable
- Verify build script in package.json

### Database connection fails
- Check DATABASE_URL format
- Verify PostgreSQL service started
- Confirm credentials in environment variables

## Local Development Check

Before pushing to Render:
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (different terminal)
cd optimization-front
npm install
npm run dev

# Database (if using Docker locally)
docker-compose up -d postgres
```

Verify all services work locally before GitHub push.
