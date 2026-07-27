from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models import User, Category as CategoryModel
from app.schemas import CategoryCreate, CategoryUpdate, Category as CategorySchema

router = APIRouter()


@router.post("", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if cat_in.parent_id:
        result = await db.execute(select(CategoryModel).where(CategoryModel.id == cat_in.parent_id, CategoryModel.user_id == current_user.id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Parent category not found")

    category = CategoryModel(**cat_in.model_dump(), user_id=current_user.id)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.get("", response_model=List[CategorySchema])
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CategoryModel).where(CategoryModel.user_id == current_user.id, CategoryModel.is_active == True).order_by(CategoryModel.name))
    return result.scalars().all()


@router.get("/{category_id}", response_model=CategorySchema)
async def get_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CategoryModel).where(CategoryModel.id == category_id, CategoryModel.user_id == current_user.id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    cat_in: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CategoryModel).where(CategoryModel.id == category_id, CategoryModel.user_id == current_user.id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = cat_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CategoryModel).where(CategoryModel.id == category_id, CategoryModel.user_id == current_user.id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if category.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default category")

    await db.delete(category)
    await db.commit()