from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bioma_api.config import get_settings
from bioma_api.routers import auth, health


settings = get_settings()

app = FastAPI(
    title=settings.api_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(health.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.api_name, "env": settings.app_env}
