from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "TRACE ML Inference Service"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    INTERNAL_SERVICE_KEY: str = "trace_internal_secret_key_change_me_in_production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
