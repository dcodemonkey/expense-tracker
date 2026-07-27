from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, categories, transactions, budgets, insights, sync, devices, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(devices.router, prefix="/devices", tags=["devices"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])