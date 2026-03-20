from pydantic import BaseModel, Field
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
    TomlConfigSettingsSource,
    EnvSettingsSource,
    DotEnvSettingsSource,
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        frozen=True,
        toml_file="config.toml",
        env_file=".env",
        extra="ignore"
    )

    @classmethod
    def settings_customise_sources(cls, settings_cls, **kwargs):
        return (
            EnvSettingsSource(settings_cls),
            DotEnvSettingsSource(settings_cls),
            TomlConfigSettingsSource(settings_cls)
        )


class PersonalizationModuleSettings(Settings):
    apply_personalization_prompt: str = Field(alias="APPLY_PERSONALIZATION_PROMPT")
    update_personalization_prompt: str = Field(alias="UPDATE_PERSONALIZATION_PROMPT")


class VerificationModuleSettings(Settings):
    threshold_distance: float = Field(default=0.6, alias="THRESHOLD_DISTANCE")


class AppSettings(Settings):
    base_url: str | None = Field(alias="MODEL_BASE_URL", default=None)
    model: str = Field(alias="MODEL_NAME")
    api_key: str = Field(alias="MODEL_API_KEY")
    temperature: float = Field(alias="TEMPERATURE", default=0.3)
    embedding_model: str = Field(alias="EMBEDDING_MODEL")
    

class PostgreDatabaseConfig(Settings):
    host: str
    port: int
    user: str
    password: str
    name: str


class EducationDatabaseConfig(PostgreDatabaseConfig):
    host: str = Field(alias="EDUCATION_DATABASE_HOST")
    port: int = Field(alias="EDUCATION_DATABASE_PORT")
    user: str = Field(alias="EDUCATION_DATABASE_USER")
    password: str = Field(alias="EDUCATION_DATABASE_PASS")
    name: str = Field(alias="EDUCATION_DATABASE_NAME")


settings = AppSettings()
