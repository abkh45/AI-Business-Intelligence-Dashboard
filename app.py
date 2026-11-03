from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import router


# =========================================================
# CREATE APP
# =========================================================

app = FastAPI(
    title="AI BI Dashboard API",
    description=(
        "Backend API for the AI Business "
        "Intelligence Dashboard"
    ),
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# INCLUDE API ROUTER
# =========================================================

app.include_router(
    router,
    prefix="/api",
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "AI BI Dashboard API is running",
        "api": "/api",
        "documentation": "/docs",
    }