"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings


DEFAULT_FRONTEND_URL = "https://zoom-clone-teal-five.vercel.app"
DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    f"{DEFAULT_FRONTEND_URL}"
)
DEFAULT_CORS_ORIGIN_REGEX = r"https://.*\.vercel\.app"


class Settings(BaseSettings):
    # Auth
    secret_key: str = "change-me-in-production-super-secret-key-2026"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Database
    database_url: str = "sqlite:///./zoom_clone.db"

    # Frontend base URL used when generating shareable invite links.
    frontend_url: str = DEFAULT_FRONTEND_URL

    # CORS — comma-separated list of allowed frontend origins.
    # Any deployment override is merged with the known defaults so a partial
    # Render env config cannot accidentally drop the production frontend.
    cors_origins: str = DEFAULT_CORS_ORIGINS

    # Match Vercel preview/prod subdomains without having to redeploy Render
    # every time the frontend URL changes.
    cors_origin_regex: str = DEFAULT_CORS_ORIGIN_REGEX

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]

        frontend = self.frontend_url.strip().rstrip("/")
        if frontend and frontend not in origins:
            origins.append(frontend)

        return origins


settings = Settings()
