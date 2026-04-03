from pathlib import Path
from uuid import uuid4

import shutil
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product
from ..deps import get_optional_current_user
from ..schemas import ProductCreateRequest, ProductUpdateRequest
from ..models import User, ActivityLog

router = APIRouter(prefix="/products", tags=["products"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PRODUCT_UPLOADS_DIR = BASE_DIR / "backend" / "uploads" / "products"
MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_PRODUCT_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_PRODUCT_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _log_action(db: Session, request: Request | None, action: str, target: str, details: str) -> None:
    db.add(
        ActivityLog(
            admin="System",
            action=action,
            target=target,
            details=details,
            ip=request.client.host if request and request.client else "unknown",
        )
    )


def _save_product_image(image: UploadFile) -> str:
    """Save uploaded product image and return URL path"""
    if not image.filename:
        raise HTTPException(status_code=400, detail="Image file is required")

    extension = Path(image.filename).suffix.lower()
    if extension not in ALLOWED_PRODUCT_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image file type")

    if image.content_type not in ALLOWED_PRODUCT_IMAGE_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image MIME type")

    image.file.seek(0, 2)
    file_size = image.file.tell()
    image.file.seek(0)

    if file_size > MAX_PRODUCT_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be 5MB or smaller")

    PRODUCT_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    destination = PRODUCT_UPLOADS_DIR / filename

    with destination.open("wb") as out_file:
        shutil.copyfileobj(image.file, out_file)

    return f"/api/uploads/products/{filename}"


def _to_dict(model_obj, extra: dict | None = None) -> dict:
    """Convert SQLAlchemy model to dictionary"""
    result = {}
    for column in model_obj.__table__.columns:
        value = getattr(model_obj, column.name)
        if hasattr(value, "value"):
            value = value.value
        if hasattr(value, "isoformat"):
            value = value.isoformat()
        result[column.name] = value
    if extra:
        result.update(extra)
    return result


@router.get("")
def get_products(db: Session = Depends(get_db)):
    """Get all products"""
    products = db.scalars(select(Product).order_by(Product.id)).all()
    return [_to_dict(product) for product in products]


@router.post("/upload-image")
def upload_product_image(request: Request, image: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload product image"""
    image_url = _save_product_image(image)
    _log_action(db, request, "Uploaded Product Image", "Products", image.filename or image_url)
    db.commit()
    return {"success": True, "image_url": image_url}


@router.post("")
def create_product(payload: ProductCreateRequest, request: Request, db: Session = Depends(get_db)):
    """Create new product"""
    product = Product(
        name=payload.name,
        description=payload.description,
        image_url=payload.image_url,
        price=payload.price,
        commission_rate=payload.commission_rate,
        stock=payload.stock,
        status=payload.status,
    )
    db.add(product)
    db.flush()
    _log_action(db, request, "Created Product", f"Product ID: {product.id}", product.name)
    db.commit()
    return {"success": True, "product": _to_dict(product)}


@router.put("/{product_id}")
def update_product(product_id: int, payload: ProductUpdateRequest, request: Request, db: Session = Depends(get_db)):
    """Update product"""
    db_product = db.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = payload.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(db_product, key, value)

    _log_action(db, request, "Updated Product", f"Product ID: {product_id}", str(updates))
    db.commit()
    return {"success": True}


@router.delete("/{product_id}")
def delete_product(product_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete product"""
    db_product = db.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(db_product)
    _log_action(db, request, "Deleted Product", f"Product ID: {product_id}", db_product.name)
    db.commit()
    return {"success": True}
