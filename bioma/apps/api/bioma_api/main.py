from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bioma_api.config import get_settings
from bioma_api.routers import auth, client_hub, files, health, performance


settings = get_settings()

app = FastAPI(
    title=settings.api_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=(
        r"^http://(localhost|127\.0\.0\.1):(5173|5174)$"
        if settings.app_env == "local"
        else None
    ),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(client_hub.router)
app.include_router(performance.router)
app.include_router(files.router)
app.include_router(health.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.api_name, "env": settings.app_env}
