from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "ncspectra-dev-secret-key-ncb-field-2024-xj9q2r"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720

    DATABASE_URL: str = "sqlite:///./ncspectra.db"

    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
