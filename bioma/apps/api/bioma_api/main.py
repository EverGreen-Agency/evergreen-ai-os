from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bioma_api.config import get_settings
from bioma_api.routers import (
    admin,
    ai_content,
    analytics,
    auth,
    benchmark,
    client_hub,
    files,
    health,
    integrations,
    invites,
    oauth,
    passwords,
    performance,
    projects,
    teams,
    vault,
    workspaces,
    tasks,
)


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
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(oauth.router)
app.include_router(passwords.router)
app.include_router(invites.public_router)
app.include_router(benchmark.public_router)
app.include_router(client_hub.router)
app.include_router(workspaces.router)
app.include_router(tasks.router)
app.include_router(teams.router)
app.include_router(vault.router)
app.include_router(ai_content.router)
app.include_router(client_hub.workspace_router)
app.include_router(invites.admin_router)
app.include_router(invites.workspace_admin_router)
app.include_router(performance.router)
app.include_router(performance.workspace_router)
app.include_router(projects.router)
app.include_router(projects.workspace_router)
app.include_router(analytics.router)
app.include_router(files.router)
app.include_router(files.workspace_router)
app.include_router(integrations.router)
app.include_router(benchmark.admin_router)
app.include_router(health.router)
app.include_router(admin.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.api_name, "env": settings.app_env}
