# Blueprint and Deployment Setup Guide

## Overview

This project uses FastAPI's modular routing system (blueprints) organized in `/backend/app/routes/` to maintain clean, scalable architecture. The deployment configuration is defined in `render.yaml` for Render.com.

## Directory Structure

```
backend/app/
├── routes/                 # Blueprint modules
│   ├── __init__.py        # Main router that combines all blueprints
│   ├── health.py          # Health check endpoints
│   ├── auth.py            # Authentication routes
│   ├── users.py           # User management routes
│   ├── products.py        # Product management routes
│   ├── tasks.py           # Task routes (future)
│   └── combos.py          # Combo routes (future)
├── main.py                # FastAPI app initialization
├── router.py              # Legacy router (being migrated)
├── api.py                 # Legacy API routes
└── ...
```

## Blueprint Architecture

### 1. Health Blueprint (`routes/health.py`)
Provides server status endpoints:
- `GET /api/health` - Health check
- `GET /api/` - Root endpoint

### 2. Auth Blueprint (`routes/auth.py`)
Handles authentication:
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification

### 3. Users Blueprint (`routes/users.py`)
User management endpoints:
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user
- `POST /api/users/{user_id}/lock` - Suspend user
- `POST /api/users/{user_id}/balance` - Update balance
- `POST /api/users/training-account` - Create training account

### 4. Products Blueprint (`routes/products.py`)
Product management endpoints:
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/{product_id}` - Update product
- `DELETE /api/products/{product_id}` - Delete product
- `POST /api/products/upload-image` - Upload product image

## How to Add New Routes

### Step 1: Create new blueprint file
Create `backend/app/routes/new_feature.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import YourModel

router = APIRouter(prefix="/new-feature", tags=["new-feature"])

@router.get("")
def get_items(db: Session = Depends(get_db)):
    """Get all items"""
    items = db.query(YourModel).all()
    return [_to_dict(item) for item in items]

@router.post("")
def create_item(payload: YourSchema, request: Request, db: Session = Depends(get_db)):
    """Create new item"""
    item = YourModel(**payload.dict())
    db.add(item)
    db.commit()
    return {"success": True, "item": _to_dict(item)}
```

### Step 2: Import in `routes/__init__.py`
Update `/backend/app/routes/__init__.py`:

```python
from .new_feature import router as new_feature_router

api_router.include_router(new_feature_router)

__all__ = [..., "new_feature_router"]
```

### Step 3: Prefix paths automatically
All routes are automatically prefixed with `/api` from the main router initialization.

## Render.yaml Deployment Configuration

The `render.yaml` file defines three services:

### Service 1: Backend (FastAPI)
```yaml
- type: web
  name: optimization-backend
  runtime: python
  buildCommand: cd backend && pip install -r requirements.txt
  startCommand: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Service 2: Frontend (Node.js)
```yaml
- type: web
  name: optimization-frontend
  runtime: node
  buildCommand: cd optimization-front && npm install && npm run build
  startCommand: cd optimization-front && npm run preview
```

### Service 3: Database (PostgreSQL)
```yaml
- type: pserv
  name: optimization-db
  runtime: postgres
```

## Environment Variables for Render

Configure these in your Render dashboard:

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection |
| `CORS_ORIGINS` | `https://app.example.com` | Allowed CORS origins |
| `JWT_SECRET` | `your-secret-key-here` | JWT signing secret |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `VITE_API_URL` | `https://backend.onrender.com` | Frontend API endpoint |

## Deployment Steps

### 1. Connect Repository
- Push code to GitHub
- Connect repository to Render

### 2. Create Services
Render will automatically detect `render.yaml` and create:
- PostgreSQL database
- Backend API service
- Frontend service

### 3. Configure Environment
Set environment variables in Render dashboard for each service

### 4. Deploy
- Push to main branch
- Render automatically builds and deploys

## Local Development

### Running with blueprints:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The app will start with all blueprints registered at `http://localhost:8000`

## Testing Endpoints

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"pass123"}'
```

### List Products
```bash
curl http://localhost:8000/api/products
```

## Migration Status

**Completed blueprints:**
- ✅ Health
- ✅ Auth
- ✅ Users
- ✅ Products

**To migrate:**
- 🔄 Tasks
- 🔄 Combos
- 🔄 Withdrawals
- 🔄 Settings
- 🔄 Notifications
- 🔄 Activity Logs

## Key Benefits

1. **Modularity** - Each feature has its own file
2. **Scalability** - Easy to add new routes without touching existing code
3. **Maintainability** - Clear code organization
4. **Testing** - Isolated blueprints are easier to test
5. **Deployment** - render.yaml provides infrastructure-as-code

## Notes

- All blueprints automatically get `/api` prefix from main router
- Use relative imports (`from ..models`) to import from parent packages
- Each blueprint should have its own tag for OpenAPI docs
- Dependency injection works seamlessly across blueprints via FastAPI's `Depends`
