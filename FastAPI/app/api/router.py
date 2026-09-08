from fastapi import APIRouter

from app.api.routes import analysis, auth, notifications, officers, reagents, records, system

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(officers.router)
api_router.include_router(reagents.router)
api_router.include_router(records.router)
api_router.include_router(analysis.router)
api_router.include_router(notifications.router)
api_router.include_router(system.router)

