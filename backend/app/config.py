from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Admin Panel API"
    app_host: str = "0.0.0.0"
    app_port: int = 9000
    database_url: str = "postgresql+psycopg://admin:admin@localhost:5433/adminpanel"
    cors_origins: str = "http://localhost:4173,http://127.0.0.1:4173"

    model_config = SettingsConfigDict(env_file=".env.backend", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
