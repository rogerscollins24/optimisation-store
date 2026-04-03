from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Admin Panel API"
    app_host: str = "0.0.0.0"
    app_port: int = 9000
    database_url: str = "postgresql+psycopg://admin:admin@localhost:5433/adminpanel"
    cors_origins: str = "http://localhost:4173,http://127.0.0.1:4173"
    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080

    model_config = SettingsConfigDict(env_file=".env.backend", env_file_encoding="utf-8", extra="ignore")

    def __init__(self, **data):
        super().__init__(**data)
        # Transform DATABASE_URL to use psycopg driver if it's using old postgresql:// format
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)


settings = Settings()
